# No Olvidarme

# Formosa Empleos

Portal de empleos para Formosa Capital. Conecta postulantes con empresas locales:
publicación de vacantes, postulación (de un click o con formulario), y perfiles
de usuario y empresa.

## Stack (v1)

- **Frontend:** HTML/CSS/JS vanilla (sin framework, sin build step)
- **Backend/DB:** Supabase (Postgres + Auth + Storage + Row Level Security)
- **Hosting:** Vercel/Netlify (frontend) + Supabase (backend)

### ⚠️ Plan de migración (recordatorio para el futuro)

Este proyecto arrancó con Supabase para priorizar velocidad de desarrollo.
**El plan es migrar a un backend propio (probablemente FastAPI + Postgres
propio) en el mediano/largo plazo.**

Para que esa migración sea manejable, todo el código de páginas llama
exclusivamente a las funciones de `js/api.js`. El día de la migración, el trabajo se concentra en reescribir
el contenido de `js/api.js` para que pegue a la nueva API en vez de a
Supabase — la UI no debería necesitar cambios.

Lo que NO migra automáticamente y hay que planear aparte:

- **Auth:** Supabase Auth maneja hoy el login/registro/sesión. Un backend
  propio necesita su propia estrategia (JWT, sesiones, etc.) y migrar los
  usuarios existentes.
- **Storage:** los CVs y logos están en Supabase Storage. Hay que decidir
  dónde viven en el nuevo esquema (¿S3? ¿disco propio?) y migrar los archivos.
- **RLS → autorización en el backend:** las reglas de permisos que hoy están
  en `sql/01_schema.sql` como policies de Postgres van a tener que
  reescribirse como middleware/chequeos explícitos en FastAPI.

## Estructura del proyecto

```
formosa-empleos/
├── sql/                    Esquema de base de datos y notas operativas
├── index.html              Listado público de empleos
├── css/styles.css          Estilos globales
├── js/
│   ├── supabase-client.js  Config de conexión a Supabase (URL + anon key)
│   └── api.js              Capa de abstracción — TODO el código llama acá,
│                            nunca directo a supabaseClient
├── login/                  Login y registro dual (postulante/empresa)
├── empresa/                Dashboard de empresa: publicar y ver postulantes
├── postulante/             Perfil y seguimiento de postulaciones
├── admin/                  Panel de aprobación de empresas
└── img/                    Assets estáticos del sitio
```

## Modelo de datos

Ver `sql/01_schema.sql` para el detalle completo con comentarios. Resumen:

- **usuarios** — extiende `auth.users`, define `tipo` (postulante/empresa/admin)
- **perfiles_postulante** — datos de CV, experiencia, habilidades
- **perfiles_empresa** — datos de empresa, con `estado` (pendiente/aprobada/rechazada)
- **empleos** — vacantes publicadas, con flag `requiere_formulario`
- **postulaciones** — postulaciones a empleos, con `unique(empleo_id, postulante_id)`

### Reglas de negocio clave (implementadas como RLS)

- Una empresa **no puede publicar empleos** hasta que un admin la apruebe
  (`estado = 'aprobada'` en `perfiles_empresa`).
- Una empresa **no puede autoaprobarse** — solo un usuario con `tipo = 'admin'`
  puede cambiar el campo `estado`.
- Los empleos públicos solo muestran los de empresas ya aprobadas.
- Cada postulante puede postularse **una sola vez** al mismo empleo (constraint
  de base de datos, no solo validación de UI).
- Según el empleo, la postulación puede ser de **un click** (usa el perfil/CV
  ya cargado) o requerir un **formulario corto** (`campos_formulario` en la
  tabla `empleos` define los campos dinámicos).

## Setup local

1. Clonar el repo
2. Crear un proyecto en [supabase.com](https://supabase.com)
3. Correr `sql/01_schema.sql` en el SQL Editor del proyecto
4. Crear un bucket de Storage público llamado `archivos` (para CVs y logos)

### Convertirte en admin (para aprobar empresas)

Los usuarios se crean como `postulante` o `empresa` al registrarse. Para tener
un usuario admin, registrate normal y después corré en el SQL Editor:

```sql
update public.usuarios set tipo = 'admin' where email = 'tu-email@ejemplo.com';
```

Ver `sql/02_notas_admin.sql` para más comandos operativos.

## Estado actual / roadmap

- [x] Esquema SQL + RLS policies
- [x] Setup del proyecto + estructura de carpetas
- [x] Login y registro dual (postulante/empresa)
- [x] Panel admin (aprobar/rechazar empresas)
- [x] Publicar empleo (lado empresa)
- [x] Listado + detalle de empleo (público)
- [x] Postulación (un click / formulario)
- [x] Dashboard empresa (ver postulantes)
- [x] Dashboard postulante (mis postulaciones, editar perfil, subir CV)
- [ ] Migración de Supabase a backend propio (FastAPI + Postgres)
