# Centro de Jubilados — Gestión de socios y cuotas

Aplicación administrativa para gestionar socios y el cobro de cuotas trimestrales.
Next.js (App Router) + Supabase (Postgres, Auth, RLS).

## 1. Requisitos

- Node.js 18 o superior instalado en tu PC (https://nodejs.org).
- Una cuenta y un proyecto en https://supabase.com.

## 2. Base de datos

1. En el proyecto de Supabase, andá a **SQL Editor**.
2. Pegá y ejecutá el contenido de `02-schema.sql` (incluido junto a este proyecto, o en el mensaje donde te lo compartieron). Esto crea todas las tablas, índices, triggers, la vista de estado de cuenta y las políticas de RLS.
3. Andá a **Authentication → Users → Add user** y creá el primer usuario administrativo (email + contraseña). El sistema crea automáticamente su perfil interno.

## 3. Variables de entorno

1. Copiá `.env.example` a un nuevo archivo `.env.local`.
2. Completá los dos valores con los datos de tu proyecto (**Project Settings → API** en Supabase):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local` nunca se sube a git (ya está en `.gitignore`) ni se expone al navegador más allá de estos dos valores públicos, tal como recomienda Supabase.

## 4. Instalación y ejecución local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000 en el navegador. Vas a caer en el login; entrá con el usuario que creaste en el paso 2.

## 5. Despliegue (por ejemplo, Vercel)

1. Subí este proyecto a un repositorio (GitHub, GitLab, etc.).
2. En Vercel, importá el repositorio.
3. Cargá las mismas dos variables de entorno del paso 3 en la configuración del proyecto en Vercel.
4. Desplegá. Vercel te da una URL pública lista para usar.

## 6. Estructura del proyecto

```
app/
  login/                 Login y recuperación de contraseña
  auth/callback/         Callback de recuperación de contraseña (Supabase)
  reset-password/        Formulario para definir nueva contraseña
  (app)/                 Rutas protegidas (requieren sesión)
    dashboard/            Panel principal con métricas y gráficos
    socios/                Alta, edición, baja/reactivación, búsqueda
    cuotas/                 Valores de cuota por año/trimestre
    pagos/                   Listado y anulación de pagos
    pagos/registrar/         Wizard de registro de pago
    reportes/                Reportes exportables a CSV
    configuracion/           Cuenta y medios de pago
components/             Componentes de UI reutilizables
lib/                    Clientes de Supabase, tipos y utilidades
middleware.ts           Protección de rutas (redirige a /login si no hay sesión)
```

## 7. Notas de diseño

- El estado de cada cuota (PAGADO / PENDIENTE / ATRASADO) se calcula en la vista `vista_estado_cuenta` de la base de datos, no se guarda en ninguna tabla.
- Los pagos nunca se eliminan: se anulan (`estado = 'ANULADO'`) y quedan en el historial. Ver `02-schema.sql` para el detalle de las reglas de integridad.
- El valor de un período de cuota queda bloqueado en cuanto tiene al menos un pago asociado (trigger en base de datos).

## 8. Próximos pasos sugeridos

- Impresión / generación de comprobantes en PDF.
- Envío de avisos de cuotas pendientes por email.
- Roles y permisos diferenciados (la columna `usuarios.rol` ya está preparada para esto).
- Historial detallado de modificaciones sobre socios (hoy la tabla `auditoria` ya registra altas, bajas y anulaciones de pago).
# siempre-unidos
