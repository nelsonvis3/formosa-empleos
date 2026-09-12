-- ============================================================
-- MIGRACIÓN 05: RLS policies para Storage (bucket 'archivos')
-- ============================================================
-- Bug encontrado: Supabase Storage NO permite ningún upload a un bucket
-- sin RLS policies explícitas en storage.objects — esto es un sistema
-- de permisos SEPARADO de las RLS que ya armamos para las tablas
-- normales (usuarios, empleos, etc.). Nunca creamos estas policies,
-- así que subir CV (postulante/perfil.js) y logo (empresa/perfil.js)
-- fallaba con "new row violates row-level security policy".
--
-- Las rutas de archivo usadas en el proyecto son:
--   cvs/{usuario_id}-{timestamp}.pdf
--   logos/{usuario_id}-{timestamp}.{ext}
-- El usuario_id es parte del NOMBRE del archivo (no una subcarpeta),
-- así que las policies extraen esa parte con string functions en vez
-- del patrón más común de storage.foldername().
--
-- Ejecutar en el SQL Editor de Supabase (proyecto ya existente).
-- ============================================================

-- Cualquier usuario autenticado puede subir un archivo cuyo nombre
-- empiece con SU PROPIO user id, dentro de cvs/ o logos/
create policy "storage_upload_propio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'archivos'
    and (
      name like 'cvs/' || auth.uid()::text || '-%'
      or name like 'logos/' || auth.uid()::text || '-%'
    )
  );

-- Mismo dueño puede sobreescribir (upsert) su propio archivo
create policy "storage_update_propio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'archivos'
    and (
      name like 'cvs/' || auth.uid()::text || '-%'
      or name like 'logos/' || auth.uid()::text || '-%'
    )
  );

-- Lectura pública: los CVs y logos se enlazan con getPublicUrl() y se
-- muestran a otros (la empresa ve el CV del postulante, cualquiera ve
-- el logo en el listado público) — por eso el bucket es público para
-- lectura, no solo para el dueño.
create policy "storage_select_publico"
  on storage.objects for select
  using (bucket_id = 'archivos');