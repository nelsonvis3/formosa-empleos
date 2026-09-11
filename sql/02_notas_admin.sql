-- ============================================================
-- NOTAS OPERATIVAS - leer antes de probar el flujo completo
-- ============================================================

-- 1) CÓMO CONVERTIRTE EN ADMIN
-- Los usuarios se crean como 'postulante' o 'empresa' vía el trigger.
-- Para tener un usuario admin (vos, para aprobar empresas), registrate
-- normal desde el front y después corré esto manualmente UNA vez,
-- reemplazando el email:

-- update public.usuarios
-- set tipo = 'admin'
-- where email = 'tu-email-de-prueba@gmail.com';


-- 2) CÓMO APROBAR UNA EMPRESA A MANO (mientras no tengas el panel admin listo)

-- update public.perfiles_empresa
-- set estado = 'aprobada'
-- where nombre_empresa = 'Nombre de la empresa de prueba';


-- 3) VERIFICAR QUE LAS RLS POLICIES FUNCIONAN
-- Corré esto en el SQL editor logueado como distintos usuarios
-- (Supabase permite "impersonar" un usuario en el SQL editor con
-- auth.uid() seteado, o simplemente probá desde el frontend con
-- distintas cuentas).

-- Chequeo rápido: ver todas las policies activas por tabla
-- select schemaname, tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, cmd;


-- 4) LIMPIAR TODO Y EMPEZAR DE CERO (¡CUIDADO, borra todo!)
-- drop table if exists public.postulaciones cascade;
-- drop table if exists public.empleos cascade;
-- drop table if exists public.perfiles_empresa cascade;
-- drop table if exists public.perfiles_postulante cascade;
-- drop table if exists public.usuarios cascade;
-- drop function if exists public.handle_new_user cascade;
