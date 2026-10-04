Formosa Empleos

Plataforma web de empleo para Formosa Capital que conecta empresas locales con personas en búsqueda de trabajo.

El proyecto permite a las empresas publicar oportunidades laborales y gestionar postulaciones, mientras que los postulantes pueden explorar ofertas, filtrarlas y aplicar directamente desde la plataforma.

La plataforma incorpora diferentes roles de usuario, validación administrativa de empresas, formularios de postulación personalizados y notificaciones por correo.

🌐 Ver aplicación en producción →
📦 Ver repositorio →

Tabla de contenidos
Características
Stack tecnológico
Arquitectura
Roadmap técnico
Instalación y configuración local
Variables de entorno
Estructura del proyecto
Roles de usuario
Capturas
Licencia
Características
Para postulantes
Exploración pública de ofertas sin necesidad de registrarse.
Búsqueda y filtrado de oportunidades laborales.
Postulación directa desde la plataforma.
Formularios personalizados según cada oferta.
Seguimiento del estado de las postulaciones.
Para empresas
Registro con aprobación administrativa.
Publicación y gestión de ofertas laborales.
Visualización y gestión de postulantes.
Estados dentro del proceso de selección.
Formularios de postulación personalizados.
Perfil empresarial con logo, sitio web, redes sociales y dirección.
Administración
Validación y aprobación de cuentas empresariales.
Control de las empresas habilitadas para publicar ofertas.
Experiencia de usuario
Interfaz responsive.
Vista dividida para explorar ofertas y consultar sus detalles sin recargar la página.
Actualización dinámica del contenido.
Notificaciones transaccionales por correo electrónico.
Stack tecnológico
Capa	Tecnología
Frontend	HTML · CSS · JavaScript
Backend / Auth / DB	Supabase · PostgreSQL · Row Level Security
Almacenamiento	Supabase Storage
Envío de correo	Resend mediante SMTP
Hosting	Vercel
Tipografía / UI	Archivo · gris oscuro · blanco · acento verde
Arquitectura

La versión actual del proyecto utiliza una arquitectura basada en servicios gestionados de Supabase.

El frontend consume directamente los servicios de Supabase para autenticación, acceso a PostgreSQL y almacenamiento de archivos. Las políticas de Row Level Security (RLS) controlan el acceso a los datos según el rol y los permisos de cada usuario.

┌─────────────────────────────┐
│          Frontend           │
│       HTML / CSS / JS       │
│          (Vercel)           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Supabase           │
│                             │
│ Auth · PostgreSQL · RLS     │
│ Storage                     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│           Resend            │
│       Email / SMTP          │
└─────────────────────────────┘

Esta arquitectura permitió desarrollar y validar rápidamente el producto completo, incluyendo el modelo de datos, autenticación, permisos, flujos de usuario y experiencia de uso, sin incorporar inicialmente una infraestructura de backend propia.

Seguridad y permisos

El acceso a los datos se controla mediante políticas de Row Level Security en PostgreSQL.

Esto permite aplicar reglas diferentes según el tipo de usuario:

Los postulantes pueden acceder a sus propias postulaciones.
Las empresas pueden administrar únicamente sus ofertas y postulantes.
Las cuentas empresariales requieren aprobación administrativa.
Las operaciones administrativas están restringidas al rol correspondiente.
Roadmap técnico

La versión actual fue diseñada como una primera versión funcional del producto. Como evolución de la arquitectura, está planificada una migración hacia un backend propio utilizando FastAPI + PostgreSQL.

El objetivo de esta migración es reducir la dependencia de servicios gestionados para la lógica de negocio y obtener mayor control sobre:

Autenticación y autorización.
Reglas de negocio.
Procesamiento de datos.
Validaciones.
Integraciones externas.
Escalabilidad de la aplicación.
Próximas mejoras

Migrar backend de Supabase a FastAPI + PostgreSQL.

Adquirir y configurar un dominio propio.

Verificar el dominio en Resend para habilitar el envío de correos a usuarios reales.

Incorporar métricas para empresas.

Mostrar estadísticas de visualizaciones y postulaciones.

Incorporar notificaciones en tiempo real para nuevas postulaciones.

Instalación y configuración local
Requisitos
Node.js.
npm.
Una cuenta/proyecto de Supabase.
Credenciales de Resend si se desea probar el envío de correos.
Clonar el repositorio
git clone https://github.com/nelsonvis3/formosa-empleos.git
cd formosa-empleos
Instalar dependencias
npm install
Configurar variables de entorno

Copiar el archivo de ejemplo:

cp .env.example .env

Completar las variables correspondientes con las credenciales del proyecto de Supabase y la configuración de correo.

Ejecutar en desarrollo
npm run dev

La aplicación estará disponible normalmente en:

http://localhost:3000
Variables de entorno
Variable	Descripción
SUPABASE_URL	URL del proyecto de Supabase.
SUPABASE_ANON_KEY	Clave pública del proyecto de Supabase.
SMTP_HOST	Servidor SMTP utilizado para el envío de correos.
SMTP_USER	Usuario del servicio SMTP.
SMTP_PASS	Credencial del servicio SMTP.
SITE_URL	URL base de la aplicación utilizada en enlaces y confirmaciones de correo.

Importante: nunca subir credenciales reales, claves privadas o archivos .env al repositorio.

Estructura del proyecto
formosa-empleos/
├── index.html              # Listado público de ofertas
├── empresa/                # Registro y panel de empresas
├── postulante/             # Registro y panel de postulantes
├── admin/                  # Panel administrativo
├── assets/                 # Estilos, iconos y recursos estáticos
└── lib/                    # Cliente de Supabase y utilidades compartidas
Roles de usuario
Postulante

Puede:

Explorar ofertas laborales.
Buscar y filtrar oportunidades.
Postularse a ofertas.
Completar formularios personalizados.
Consultar el estado de sus postulaciones.
Empresa

Puede:

Crear una cuenta empresarial.
Completar su perfil institucional.
Publicar ofertas una vez aprobada su cuenta.
Crear formularios de postulación personalizados.
Consultar postulantes.
Gestionar el estado de los candidatos.
Administrador

Puede:

Revisar nuevas cuentas empresariales.
Aprobar o rechazar empresas.
Controlar qué empresas pueden operar dentro de la plataforma.
Flujo principal
Postulante
Explorar ofertas
       ↓
Seleccionar una oportunidad
       ↓
Consultar detalles
       ↓
Postularse
       ↓
Completar formulario
       ↓
Seguimiento de postulación
Empresa
Crear cuenta
      ↓
Aprobación administrativa
      ↓
Completar perfil
      ↓
Publicar oferta
      ↓
Recibir postulaciones
      ↓
Gestionar candidatos

Este flujo busca mantener separadas las responsabilidades de cada tipo de usuario y evitar que una empresa pueda publicar ofertas antes de completar el proceso de validación.

Capturas

Las capturas se incorporarán progresivamente a medida que se actualice la presentación visual del proyecto.

Demo

🌐 Ver Formosa Empleos en producción →

Licencia

Proyecto de desarrollo personal y portfolio.

Todos los derechos reservados.

Desarrollado por Nelson Sivisstum

GitHub · LinkedIn
