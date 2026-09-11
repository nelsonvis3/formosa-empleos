// ============================================================
// API - capa de abstracción sobre Supabase
// ============================================================
// TODO el resto del código (UI, páginas) llama a las funciones
// de este archivo, NUNCA a `supabaseClient` directamente.
//
// ¿Por qué? El día que migremos de Supabase a un backend propio
// (FastAPI), solo hay que reescribir el CONTENIDO de estas
// funciones para que hagan fetch() a la nueva API en vez de
// llamar a Supabase. La firma de cada función (nombre, params,
// qué devuelve) se mantiene igual, así que el resto del código
// no se toca.
// ============================================================

const Api = {
  // ---------- AUTH ----------

  async registrarse({ email, password, tipo, nombreCompleto }) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          tipo, // 'postulante' | 'empresa'
          nombre_completo: nombreCompleto,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async login({ email, password }) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  async getUsuarioActual() {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // ---------- PERFIL EMPRESA ----------

  async crearPerfilEmpresa({
    usuarioId,
    nombreEmpresa,
    cuit,
    descripcion,
    rubro,
  }) {
    const { data, error } = await supabaseClient
      .from("perfiles_empresa")
      .insert({
        usuario_id: usuarioId,
        nombre_empresa: nombreEmpresa,
        cuit,
        descripcion,
        rubro,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPerfilEmpresa(usuarioId) {
    const { data, error } = await supabaseClient
      .from("perfiles_empresa")
      .select("*")
      .eq("usuario_id", usuarioId)
      .single();
    if (error) throw error;
    return data;
  },

  async actualizarPerfilEmpresa(usuarioId, cambios) {
    const { data, error } = await supabaseClient
      .from("perfiles_empresa")
      .update(cambios)
      .eq("usuario_id", usuarioId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---------- PERFIL POSTULANTE ----------

  async crearPerfilPostulante({
    usuarioId,
    telefono,
    ubicacion,
    experiencia,
    habilidades,
  }) {
    const { data, error } = await supabaseClient
      .from("perfiles_postulante")
      .insert({
        usuario_id: usuarioId,
        telefono,
        ubicacion,
        experiencia,
        habilidades,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPerfilPostulante(usuarioId) {
    const { data, error } = await supabaseClient
      .from("perfiles_postulante")
      .select("*")
      .eq("usuario_id", usuarioId)
      .single();
    if (error) throw error;
    return data;
  },

  async actualizarPerfilPostulante(usuarioId, cambios) {
    const { data, error } = await supabaseClient
      .from("perfiles_postulante")
      .update(cambios)
      .eq("usuario_id", usuarioId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async subirCV(usuarioId, archivo) {
    const path = `cvs/${usuarioId}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabaseClient.storage
      .from("archivos")
      .upload(path, archivo, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage.from("archivos").getPublicUrl(path);
    return data.publicUrl;
  },

  // ---------- EMPLEOS ----------

  async getEmpleosPublicos({ rubro = null, modalidad = null } = {}) {
    let query = supabaseClient
      .from("empleos")
      .select("*, perfiles_empresa(nombre_empresa, logo_url, rubro)")
      .eq("estado", "activo")
      .order("created_at", { ascending: false });

    if (rubro) query = query.eq("rubro", rubro);
    if (modalidad) query = query.eq("modalidad", modalidad);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getEmpleoPorId(empleoId) {
    const { data, error } = await supabaseClient
      .from("empleos")
      .select(
        "*, perfiles_empresa(nombre_empresa, logo_url, descripcion, rubro)",
      )
      .eq("id", empleoId)
      .single();
    if (error) throw error;
    return data;
  },

  async getMisEmpleos(empresaId) {
    const { data, error } = await supabaseClient
      .from("empleos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async crearEmpleo(empleo) {
    const { data, error } = await supabaseClient
      .from("empleos")
      .insert(empleo)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async actualizarEmpleo(empleoId, cambios) {
    const { data, error } = await supabaseClient
      .from("empleos")
      .update(cambios)
      .eq("id", empleoId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---------- POSTULACIONES ----------

  async postularse({
    empleoId,
    postulanteId,
    respuestasFormulario = null,
    cvUsadoUrl = null,
  }) {
    const { data, error } = await supabaseClient
      .from("postulaciones")
      .insert({
        empleo_id: empleoId,
        postulante_id: postulanteId,
        respuestas_formulario: respuestasFormulario,
        cv_usado_url: cvUsadoUrl,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async yaSePostulo(empleoId, postulanteId) {
    const { data, error } = await supabaseClient
      .from("postulaciones")
      .select("id")
      .eq("empleo_id", empleoId)
      .eq("postulante_id", postulanteId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getMisPostulaciones(postulanteId) {
    const { data, error } = await supabaseClient
      .from("postulaciones")
      .select("*, empleos(titulo, perfiles_empresa(nombre_empresa))")
      .eq("postulante_id", postulanteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPostulacionesDeEmpleo(empleoId) {
    const { data, error } = await supabaseClient
      .from("postulaciones")
      .select("*, perfiles_postulante(*, usuarios(nombre_completo, email))")
      .eq("empleo_id", empleoId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async actualizarEstadoPostulacion(postulacionId, estado) {
    const { data, error } = await supabaseClient
      .from("postulaciones")
      .update({ estado })
      .eq("id", postulacionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---------- ADMIN ----------

  async getEmpresasPendientes() {
    const { data, error } = await supabaseClient
      .from("perfiles_empresa")
      .select("*, usuarios(email, nombre_completo)")
      .eq("estado", "pendiente");
    if (error) throw error;
    return data;
  },

  async cambiarEstadoEmpresa(usuarioId, estado) {
    const { data, error } = await supabaseClient
      .from("perfiles_empresa")
      .update({ estado })
      .eq("usuario_id", usuarioId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
