-- ============================================================
-- MIGRACIÓN 04: campos adicionales de empresa (opcionales)
-- ============================================================
-- Contexto: el perfil de empresa necesita más información de cara al
-- rediseño del sitio (panel de detalle más completo, logo visible,
-- datos de contacto). Todos estos campos son opcionales — la empresa
-- los completa si quiere, no son obligatorios para publicar empleos.

alter table public.perfiles_empresa
  add column if not exists sitio_web text,
  add column if not exists red_social text,
  add column if not exists direccion text;
