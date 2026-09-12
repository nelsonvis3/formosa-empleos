-- ============================================================
-- FORMOSA EMPLEOS - Esquema inicial
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo)
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: usuarios
-- Extiende auth.users con datos propios de la app.
-- Se crea automáticamente vía trigger cuando alguien se registra.
-- ------------------------------------------------------------
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('postulante', 'empresa', 'admin')),
  nombre_completo text,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- Cualquiera puede ver datos básicos de usuarios (necesario para mostrar
-- nombre de empresa en listados públicos, por ejemplo)
create policy "usuarios_select_publico"
  on public.usuarios for select
  using (true);

-- Un usuario solo puede insertar/actualizar su propia fila
create policy "usuarios_insert_propio"
  on public.usuarios for insert
  with check (auth.uid() = id);

create policy "usuarios_update_propio"
  on public.usuarios for update
  using (auth.uid() = id);


-- ------------------------------------------------------------
-- 2. TABLA: perfiles_postulante
-- ------------------------------------------------------------
create table public.perfiles_postulante (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  telefono text,
  ubicacion text default 'Formosa Capital',
  cv_url text,
  experiencia text,
  habilidades text[],
  disponibilidad text,
  updated_at timestamptz not null default now()
);

alter table public.perfiles_postulante enable row level security;

-- El propio postulante gestiona su perfil
create policy "perfil_postulante_select_propio"
  on public.perfiles_postulante for select
  using (auth.uid() = usuario_id);

create policy "perfil_postulante_insert_propio"
  on public.perfiles_postulante for insert
  with check (auth.uid() = usuario_id);

create policy "perfil_postulante_update_propio"
  on public.perfiles_postulante for update
  using (auth.uid() = usuario_id);

-- Nota: falta una policy más para esta tabla ("perfil_postulante_select_empresa"),
-- que le permite a una empresa ver el perfil de quien se postuló a su empleo.
-- Esa policy depende de las tablas `empleos` y `postulaciones`, que todavía no
-- existen en este punto del archivo — se crea al final, en la sección 6.


-- ------------------------------------------------------------
-- 3. TABLA: perfiles_empresa
-- estado: pendiente -> aprobada / rechazada (moderación manual)
-- ------------------------------------------------------------
create table public.perfiles_empresa (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  nombre_empresa text not null,
  cuit text,
  logo_url text,
  descripcion text,
  rubro text,
  sitio_web text,
  red_social text,
  direccion text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  updated_at timestamptz not null default now()
);

alter table public.perfiles_empresa enable row level security;

-- Cualquiera puede ver empresas aprobadas (para mostrar en listados públicos)
create policy "perfil_empresa_select_publico"
  on public.perfiles_empresa for select
  using (estado = 'aprobada');

-- La empresa siempre puede ver su propio perfil, sin importar el estado
create policy "perfil_empresa_select_propio"
  on public.perfiles_empresa for select
  using (auth.uid() = usuario_id);

-- Un admin puede ver TODAS las empresas, sin importar el estado
-- (necesario para el panel de aprobación: sin esto, getEmpresasPendientes()
-- corre sin error pero la RLS filtra en silencio las filas ajenas, y el
-- admin nunca ve las empresas pendientes de otros usuarios)
create policy "perfil_empresa_select_admin"
  on public.perfiles_empresa for select
  using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.tipo = 'admin')
  );

create policy "perfil_empresa_insert_propio"
  on public.perfiles_empresa for insert
  with check (auth.uid() = usuario_id);

-- La empresa puede editar SUS datos, pero no su propio estado de aprobación
create policy "perfil_empresa_update_propio"
  on public.perfiles_empresa for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- Solo un admin puede cambiar el estado (aprobar/rechazar)
create policy "perfil_empresa_update_admin"
  on public.perfiles_empresa for update
  using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.tipo = 'admin')
  );


-- ------------------------------------------------------------
-- 4. TABLA: empleos
-- ------------------------------------------------------------
create table public.empleos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.perfiles_empresa(usuario_id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  rubro text,
  modalidad text check (modalidad in ('presencial', 'remoto', 'hibrido')),
  salario_desde numeric,
  salario_hasta numeric,
  requiere_formulario boolean not null default false,
  campos_formulario jsonb, -- ej: [{"nombre":"años_experiencia","tipo":"texto"}]
  estado text not null default 'activo' check (estado in ('activo', 'pausado', 'cerrado')),
  created_at timestamptz not null default now()
);

alter table public.empleos enable row level security;

-- Público: cualquiera ve empleos activos de empresas aprobadas
create policy "empleos_select_publico"
  on public.empleos for select
  using (
    estado = 'activo'
    and exists (
      select 1 from public.perfiles_empresa pe
      where pe.usuario_id = empleos.empresa_id and pe.estado = 'aprobada'
    )
  );

-- La empresa ve TODOS sus propios empleos (activos, pausados, cerrados)
create policy "empleos_select_propio_empresa"
  on public.empleos for select
  using (auth.uid() = empresa_id);

-- Solo empresas ya aprobadas pueden crear empleos
create policy "empleos_insert_empresa_aprobada"
  on public.empleos for insert
  with check (
    auth.uid() = empresa_id
    and exists (
      select 1 from public.perfiles_empresa pe
      where pe.usuario_id = auth.uid() and pe.estado = 'aprobada'
    )
  );

create policy "empleos_update_propio"
  on public.empleos for update
  using (auth.uid() = empresa_id);

create policy "empleos_delete_propio"
  on public.empleos for delete
  using (auth.uid() = empresa_id);


-- ------------------------------------------------------------
-- 5. TABLA: postulaciones
-- ------------------------------------------------------------
create table public.postulaciones (
  id uuid primary key default gen_random_uuid(),
  empleo_id uuid not null references public.empleos(id) on delete cascade,
  postulante_id uuid not null references public.perfiles_postulante(usuario_id) on delete cascade,
  respuestas_formulario jsonb, -- null si la postulación fue "de un click"
  cv_usado_url text,
  estado text not null default 'enviada' check (estado in ('enviada', 'vista', 'rechazada', 'contactado')),
  created_at timestamptz not null default now(),
  unique (empleo_id, postulante_id) -- evita postularse 2 veces al mismo empleo
);

alter table public.postulaciones enable row level security;

-- El postulante ve y crea sus propias postulaciones
create policy "postulaciones_select_propio_postulante"
  on public.postulaciones for select
  using (auth.uid() = postulante_id);

create policy "postulaciones_insert_propio"
  on public.postulaciones for insert
  with check (auth.uid() = postulante_id);

-- La empresa ve las postulaciones a SUS empleos
create policy "postulaciones_select_empresa"
  on public.postulaciones for select
  using (
    exists (
      select 1 from public.empleos e
      where e.id = postulaciones.empleo_id and e.empresa_id = auth.uid()
    )
  );

-- La empresa puede actualizar el estado (vista/rechazada/contactado)
create policy "postulaciones_update_empresa"
  on public.postulaciones for update
  using (
    exists (
      select 1 from public.empleos e
      where e.id = postulaciones.empleo_id and e.empresa_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 6. Policy pendiente de perfiles_postulante
-- (depende de empleos y postulaciones, que recién ahora existen)
-- ------------------------------------------------------------

-- Las empresas pueden ver el perfil de quienes se postularon a sus empleos
create policy "perfil_postulante_select_empresa"
  on public.perfiles_postulante for select
  using (
    exists (
      select 1
      from public.postulaciones p
      join public.empleos e on e.id = p.empleo_id
      where p.postulante_id = perfiles_postulante.usuario_id
        and e.empresa_id = auth.uid()
    )
  );


-- ============================================================
-- TRIGGER: crear fila en public.usuarios automáticamente
-- cuando alguien se registra en Supabase Auth.
-- El "tipo" y "nombre" se pasan como metadata en el signUp().
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, tipo, nombre_completo, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'tipo', 'postulante'),
    new.raw_user_meta_data->>'nombre_completo',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- ÍNDICES para las consultas más frecuentes
-- ============================================================
create index idx_empleos_estado on public.empleos(estado);
create index idx_empleos_empresa on public.empleos(empresa_id);
create index idx_postulaciones_empleo on public.postulaciones(empleo_id);
create index idx_postulaciones_postulante on public.postulaciones(postulante_id);
create index idx_perfiles_empresa_estado on public.perfiles_empresa(estado);