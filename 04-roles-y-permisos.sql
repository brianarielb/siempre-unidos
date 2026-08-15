-- =====================================================================
-- Migración: Roles y permisos (ADMIN / OPERADOR / LECTURA)
-- Ejecutar en el SQL Editor de Supabase, sobre el proyecto donde ya
-- corriste 02-schema.sql (y opcionalmente 03-migracion...).
-- =====================================================================

-- ---------- 1. Restringir los valores posibles de "rol" ----------
alter table public.usuarios
  drop constraint if exists chk_rol;

alter table public.usuarios
  add constraint chk_rol
  check (rol in ('ADMIN', 'OPERADOR', 'LECTURA'));

comment on column public.usuarios.rol is
  'ADMIN: acceso total. OPERADOR: gestiona socios y registra pagos, no puede '
  'editar cuotas ni anular pagos. LECTURA: solo consulta y reportes.';

-- ---------- 2. Los usuarios nuevos entran como OPERADOR por defecto ----------
-- (los que ya existen conservan el rol que tengan hoy; probablemente ADMIN)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nombre, email, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), new.email, 'OPERADOR');
  return new;
end;
$$ language plpgsql security definer;

-- ---------- 3. Función helper: rol del usuario logueado ----------
-- security definer + estable: evita recursión de RLS al usarla dentro de
-- las propias políticas de "usuarios", y evita repetir el subquery en cada
-- política.
create or replace function public.rol_actual()
returns text
language sql
security definer
stable
as $$
  select rol from public.usuarios where id = auth.uid();
$$;

-- ---------- 4. Trigger: nadie puede auto-ascenderse de rol ----------
-- Un usuario puede editar su propia fila (nombre, etc.) pero solo un ADMIN
-- puede cambiar el campo "rol" de cualquier usuario, incluido el propio.
create or replace function public.proteger_cambio_rol()
returns trigger as $$
begin
  if new.rol is distinct from old.rol and public.rol_actual() <> 'ADMIN' then
    raise exception 'Solo un administrador puede cambiar el rol de un usuario';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_cambio_rol on public.usuarios;
create trigger trg_proteger_cambio_rol
before update on public.usuarios
for each row execute function public.proteger_cambio_rol();

-- ---------- 5. Reemplazar las políticas "todo o nada" por unas por rol ----------

-- USUARIOS
drop policy if exists usuarios_select_own on public.usuarios;
drop policy if exists usuarios_update_own on public.usuarios;

create policy usuarios_select_own on public.usuarios
  for select using (auth.uid() = id);

drop policy if exists usuarios_select_admin on public.usuarios;

create policy usuarios_select_admin on public.usuarios
  for select using (public.rol_actual() = 'ADMIN');

create policy usuarios_update_own on public.usuarios
  for update using (auth.uid() = id);

drop policy if exists usuarios_update_admin on public.usuarios;
create policy usuarios_update_admin on public.usuarios
  for update using (public.rol_actual() = 'ADMIN');

-- SOCIOS: todos consultan; ADMIN y OPERADOR crean/editan
drop policy if exists socios_all on public.socios;

drop policy if exists socios_select on public.socios;
create policy socios_select on public.socios
  for select using (auth.role() = 'authenticated');

drop policy if exists socios_insert on public.socios;
create policy socios_insert on public.socios
  for insert with check (public.rol_actual() in ('ADMIN', 'OPERADOR'));

drop policy if exists socios_update on public.socios;
create policy socios_update on public.socios
  for update using (public.rol_actual() in ('ADMIN', 'OPERADOR'));

-- CUOTAS_PERIODOS: todos consultan; solo ADMIN crea/edita valores
drop policy if exists periodos_all on public.cuotas_periodos;

drop policy if exists periodos_select on public.cuotas_periodos;
create policy periodos_select on public.cuotas_periodos
  for select using (auth.role() = 'authenticated');

drop policy if exists periodos_insert on public.cuotas_periodos;
create policy periodos_insert on public.cuotas_periodos
  for insert with check (public.rol_actual() = 'ADMIN');

drop policy if exists periodos_update on public.cuotas_periodos;
create policy periodos_update on public.cuotas_periodos
  for update using (public.rol_actual() = 'ADMIN');

-- MEDIOS_PAGO: todos consultan; solo ADMIN agrega/desactiva
drop policy if exists medios_pago_select on public.medios_pago;

drop policy if exists medios_pago_select on public.medios_pago;
create policy medios_pago_select on public.medios_pago
  for select using (auth.role() = 'authenticated');

drop policy if exists medios_pago_insert on public.medios_pago;
create policy medios_pago_insert on public.medios_pago
  for insert with check (public.rol_actual() = 'ADMIN');

drop policy if exists medios_pago_update on public.medios_pago;
create policy medios_pago_update on public.medios_pago
  for update using (public.rol_actual() = 'ADMIN');

-- PAGOS: todos consultan; ADMIN y OPERADOR registran; solo ADMIN anula
drop policy if exists pagos_all on public.pagos;

drop policy if exists pagos_select on public.pagos;
create policy pagos_select on public.pagos
  for select using (auth.role() = 'authenticated');

drop policy if exists pagos_insert on public.pagos;
create policy pagos_insert on public.pagos
  for insert with check (public.rol_actual() in ('ADMIN', 'OPERADOR'));

drop policy if exists pagos_update on public.pagos;
create policy pagos_update on public.pagos
  for update using (public.rol_actual() = 'ADMIN');

-- AUDITORIA: solo ADMIN puede consultarla (sigue insertándose vía triggers)
drop policy if exists auditoria_select on public.auditoria;

drop policy if exists auditoria_select on public.auditoria;
create policy auditoria_select on public.auditoria
  for select using (public.rol_actual() = 'ADMIN');
