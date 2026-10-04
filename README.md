# Formosa Empleos

Portal de empleos para Formosa Capital que conecta empresas locales con postulantes. Permite a las empresas publicar ofertas de trabajo (previa aprobación administrativa) y a los postulantes buscar, filtrar y aplicar directamente desde la plataforma.

🔗 **Demo en producción:** [formosa-empleos.vercel.app](https://formosa-empleos.vercel.app)
📦 **Repositorio:** [github.com/nelsonvis3/formosa-empleos](https://github.com/nelsonvis3/formosa-empleos)

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Roadmap técnico](#roadmap-técnico)
- [Instalación y configuración local](#instalación-y-configuración-local)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Roles de usuario](#roles-de-usuario)
- [Capturas](#capturas)
- [Licencia](#licencia)

---

## Características

- **Doble registro de usuarios**: flujos de alta diferenciados para empresas y para postulantes.
- **Aprobación administrativa de empresas**: las cuentas de empresa requieren validación manual antes de poder publicar ofertas, como control básico de calidad y prevención de spam.
- **Publicación y listado público de ofertas**: cualquier visitante puede explorar las vacantes activas sin necesidad de registrarse.
- **Postulación flexible**: el postulante puede aplicar de forma directa o completar un formulario personalizado definido por la empresa, con soporte para tres tipos de pregunta (texto libre, sí/no y opción múltiple).
- **Gestión de postulantes**: la empresa visualiza a los postulantes de cada oferta y actualiza su estado dentro del proceso de selección.
- **Perfil de empresa enriquecido**: carga opcional de logo, sitio web, redes sociales y dirección física.
- **Notificaciones por correo**: confirmaciones y notificaciones transaccionales vía SMTP.
- **UI sin recargas de página**: listado y detalle de ofertas en una vista dividida (split view), con actualización dinámica del panel de detalle.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend / Auth / DB | Supabase (PostgreSQL con Row Level Security) |
| Envío de correo | SMTP vía Resend |
| Hosting | Vercel |
| Tipografía / UI | Archivo, paleta gris oscuro + blanco con acento verde |

## Arquitectura

La v1 del proyecto prioriza velocidad de entrega: el frontend consume directamente los servicios gestionados de Supabase (autenticación, base de datos PostgreSQL con políticas de Row Level Security, y almacenamiento de archivos), sin una capa de backend propia intermedia.

```
┌─────────────┐        ┌──────────────────────────┐
│  Frontend   │ ─────► │        Supabase           │
│ HTML/CSS/JS │        │  Auth · PostgreSQL (RLS)  │
│  (Vercel)   │        │  Storage · SMTP (Resend)  │
└─────────────┘        └──────────────────────────┘
```

Esta decisión permitió validar el producto completo —modelo de datos, flujos de usuario y UI— sin invertir tiempo inicial en infraestructura de servidor propia.

## Roadmap técnico

> ⚠️ **Migración de backend planificada.** El proyecto va a migrar su backend de Supabase a una **API propia construida con FastAPI**, con PostgreSQL autogestionado como base de datos. El objetivo es dejar de depender de un servicio de terceros para la lógica de negocio y tener control total sobre las reglas de autenticación, permisos y procesamiento de datos a medida que el proyecto escale.

Otros puntos pendientes:

- [ ] Migrar backend de Supabase a FastAPI + PostgreSQL propio
- [ ] Adquirir dominio propio y verificarlo en Resend para habilitar el envío de correos a cualquier usuario real (actualmente limitado a direcciones de prueba)
- [ ] Panel de métricas para empresas (vistas de oferta, tasa de postulación)
- [ ] Notificaciones en tiempo real para nuevas postulaciones

## Instalación y configuración local

```bash
# Clonar el repositorio
git clone https://github.com/nelsonvis3/formosa-empleos.git
cd formosa-empleos

# Instalar dependencias (si aplica según el gestor del proyecto)
npm install

# Configurar variables de entorno
cp .env.example .env
# Completar .env con las credenciales de tu proyecto de Supabase

# Levantar en modo desarrollo
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Credenciales de envío de correo vía Resend |
| `SITE_URL` | URL base del sitio, usada en los links de confirmación de email |

## Estructura del proyecto

```
formosa-empleos/
├── index.html          # Listado público de ofertas
├── empresa/             # Flujo de registro y panel de empresa
├── postulante/           # Flujo de registro y panel de postulante
├── admin/               # Panel de aprobación de empresas
├── assets/               # Estilos, íconos y recursos estáticos
└── lib/                  # Cliente de Supabase y utilidades compartidas
```

## Roles de usuario

- **Postulante**: explora ofertas, se postula de forma directa o vía formulario, hace seguimiento de sus postulaciones.
- **Empresa**: publica ofertas (una vez aprobada), define formularios de postulación personalizados, gestiona el estado de sus postulantes, completa su perfil institucional.
- **Administrador**: aprueba o rechaza el alta de nuevas empresas antes de que puedan operar en la plataforma.

## Capturas

*(Agregar screenshots del listado, el detalle de oferta y el panel de empresa.)*

## Licencia

Proyecto de desarrollo personal / portfolio. Todos los derechos reservados.

---

Desarrollado por **Nelson Sivisstum** — [GitHub](https://github.com/nelsonvis3) · [LinkedIn](https://www.linkedin.com/in/nelson-sivisstum-4777a32b4/)
