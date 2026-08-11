-- =====================================================================
-- Centro de Jubilados — Esquema de Base de Datos para Supabase
-- =====================================================================
-- Ejecutar en el SQL Editor de Supabase (proyecto ya creado).
-- Orden: extensiones -> tipos -> tablas -> índices -> triggers -> vista -> RLS
-- =====================================================================

-- ---------- EXTENSIONES ----------
create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ---------- TIPOS ----------
create type estado_socio as enum ('ACTIVO', 'INACTIVO');
create type estado_pago  as enum ('ACTIVO', 'ANULADO');

-- =====================================================================
-- USUARIOS (perfil interno, 1:1 con auth.users)
-- =====================================================================
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null,
  rol text not null default 'ADMIN',        -- preparado para roles futuros
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Crea automáticamente el perfil cuando se registra un usuario en Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- MEDIOS DE PAGO (catálogo, extensible sin migraciones de tipo)
-- =====================================================================
create table public.medios_pago (
  id smallint generated always as identity primary key,
  nombre text not null unique,
  activo boolean not null default true
);

insert into public.medios_pago (nombre) values ('EFECTIVO'), ('TRANSFERENCIA'), ('OTRO');

-- =====================================================================
-- SOCIOS
-- =====================================================================
create table public.socios (
  id uuid primary key default gen_random_uuid(),
  numero_socio integer not null unique,
  nombre text not null,
  apellido text not null,
  dni text not null unique,
  fecha_nacimiento date,
  telefono text,
  email text,
  direccion text,
  fecha_alta date not null default current_date,
  fecha_baja date,
  estado estado_socio not null default 'ACTIVO',
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_fecha_baja check (fecha_baja is null or fecha_baja >= fecha_alta)
);

create index idx_socios_numero on public.socios(numero_socio);
create index idx_socios_dni on public.socios(dni);
create index idx_socios_apellido_nombre on public.socios(apellido, nombre);
create index idx_socios_estado on public.socios(estado);

-- =====================================================================
-- CUOTAS_PERIODOS
-- =====================================================================
create table public.cuotas_periodos (
  id uuid primary key default gen_random_uuid(),
  anio integer not null check (anio >= 2000),
  trimestre smallint not null check (trimestre between 1 and 4),
  fecha_desde date not null,
  fecha_hasta date not null,
  valor numeric(12,2) not null check (valor > 0),
  observaciones text,
  created_at timestamptz not null default now(),
  constraint uq_periodo unique (anio, trimestre),
  constraint chk_fechas_periodo check (fecha_hasta > fecha_desde)
);

create index idx_periodos_anio on public.cuotas_periodos(anio);

-- Impide modificar el valor de un período que ya tiene pagos asociados
create or replace function public.chk_periodo_sin_pagos()
returns trigger as $$
begin
  if new.valor <> old.valor and exists (
    select 1 from public.pagos where cuota_periodo_id = new.id
  ) then
    raise exception 'No se puede modificar el valor de un período que ya tiene pagos registrados (año %, trimestre %)', new.anio, new.trimestre;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_periodo_sin_pagos
before update on public.cuotas_periodos
for each row execute function public.chk_periodo_sin_pagos();

-- =====================================================================
-- PAGOS
-- =====================================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id),
  cuota_periodo_id uuid not null references public.cuotas_periodos(id),
  fecha_pago date not null default current_date,
  importe numeric(12,2) not null check (importe > 0),
  medio_pago_id smallint not null references public.medios_pago(id),
  numero_comprobante text,
  observaciones text,
  usuario_id uuid not null references public.usuarios(id),
  estado estado_pago not null default 'ACTIVO',
  pago_original_id uuid references public.pagos(id),
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un socio no puede tener más de un pago ACTIVO por período (también evita
-- condiciones de carrera si dos operadores cargan el mismo pago a la vez)
create unique index uq_pago_activo_por_periodo
  on public.pagos(socio_id, cuota_periodo_id)
  where estado = 'ACTIVO';

create index idx_pagos_socio on public.pagos(socio_id);
create index idx_pagos_periodo on public.pagos(cuota_periodo_id);
create index idx_pagos_fecha on public.pagos(fecha_pago);
create index idx_pagos_estado on public.pagos(estado);

-- =====================================================================
-- Trigger genérico updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_socios_updated_at
before update on public.socios
for each row execute function public.set_updated_at();

create trigger trg_pagos_updated_at
before update on public.pagos
for each row execute function public.set_updated_at();

-- =====================================================================
-- AUDITORIA
-- =====================================================================
create table public.auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid references public.usuarios(id),
  tabla text not null,
  registro_id text not null,
  accion text not null,           -- ALTA_SOCIO, BAJA_SOCIO, ALTA_PAGO, ANULACION_PAGO, etc.
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index idx_auditoria_tabla_registro on public.auditoria(tabla, registro_id);

-- Auditoría automática de pagos (alta y anulación)
create or replace function public.audit_pagos()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.auditoria (usuario_id, tabla, registro_id, accion, detalle)
    values (new.usuario_id, 'pagos', new.id::text, 'ALTA_PAGO', to_jsonb(new));
  elsif tg_op = 'UPDATE' and old.estado = 'ACTIVO' and new.estado = 'ANULADO' then
    insert into public.auditoria (usuario_id, tabla, registro_id, accion, detalle)
    values (new.usuario_id, 'pagos', new.id::text, 'ANULACION_PAGO',
      jsonb_build_object('motivo', new.motivo_anulacion));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_audit_pagos
after insert or update on public.pagos
for each row execute function public.audit_pagos();

-- Auditoría automática de socios (alta y baja)
create or replace function public.audit_socios()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.auditoria (tabla, registro_id, accion, detalle)
    values ('socios', new.id::text, 'ALTA_SOCIO', to_jsonb(new));
  elsif tg_op = 'UPDATE' and old.estado = 'ACTIVO' and new.estado = 'INACTIVO' then
    insert into public.auditoria (tabla, registro_id, accion, detalle)
    values ('socios', new.id::text, 'BAJA_SOCIO', jsonb_build_object('fecha_baja', new.fecha_baja));
  elsif tg_op = 'UPDATE' and old.estado = 'INACTIVO' and new.estado = 'ACTIVO' then
    insert into public.auditoria (tabla, registro_id, accion, detalle)
    values ('socios', new.id::text, 'REACTIVACION_SOCIO', '{}'::jsonb);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_audit_socios
after insert or update on public.socios
for each row execute function public.audit_socios();

-- =====================================================================
-- VISTA: ESTADO DE CUENTA (socio x período, con estado calculado)
-- =====================================================================
create or replace view public.vista_estado_cuenta as
select
  s.id as socio_id,
  s.numero_socio,
  s.nombre,
  s.apellido,
  s.estado as estado_socio,
  cp.id as periodo_id,
  cp.anio,
  cp.trimestre,
  cp.valor as valor_cuota,
  cp.fecha_hasta,
  p.id as pago_id,
  p.fecha_pago,
  p.importe,
  case
    when p.id is not null then 'PAGADO'
    when cp.fecha_hasta < current_date then 'ATRASADO'
    else 'PENDIENTE'
  end as estado_cuota
from public.socios s
cross join public.cuotas_periodos cp
left join public.pagos p
  on p.socio_id = s.id
  and p.cuota_periodo_id = cp.id
  and p.estado = 'ACTIVO';

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.usuarios enable row level security;
alter table public.socios enable row level security;
alter table public.cuotas_periodos enable row level security;
alter table public.medios_pago enable row level security;
alter table public.pagos enable row level security;
alter table public.auditoria enable row level security;

-- usuarios: cada quien ve y edita su propio perfil
create policy usuarios_select_own on public.usuarios
  for select using (auth.uid() = id);

create policy usuarios_update_own on public.usuarios
  for update using (auth.uid() = id);

-- Resto de tablas operativas: cualquier usuario autenticado puede
-- leer/escribir (hoy hay un solo rol; el día que haya roles distintos,
-- estas políticas se refinan usando usuarios.rol sin tocar el resto del modelo)
create policy socios_all on public.socios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy periodos_all on public.cuotas_periodos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy medios_pago_select on public.medios_pago
  for select using (auth.role() = 'authenticated');

create policy pagos_all on public.pagos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy auditoria_select on public.auditoria
  for select using (auth.role() = 'authenticated');

create policy auditoria_insert on public.auditoria
  for insert with check (auth.role() = 'authenticated');
