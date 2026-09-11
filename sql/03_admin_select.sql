create policy "perfil_empresa_select_admin"
  on public.perfiles_empresa for select
  using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.tipo = 'admin')
  );