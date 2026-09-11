// ============================================================
// SUPABASE CLIENT - configuración única del proyecto
// ============================================================
// Reemplazá estos dos valores con los de TU proyecto en
// Supabase > Project Settings > API
//
// IMPORTANTE: la "anon key" es pública y está pensada para ir
// en el frontend. NUNCA pongas acá la "service_role key".
// ============================================================

const SUPABASE_URL = "https://akminovplbmksmcdrgld.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_knMT2VICf28e1V2QSQDdgQ_eTZ6OKMc";

// Se importa el SDK desde CDN en el <script> de cada HTML (ver login.html)
// así que acá asumimos que `window.supabase` ya existe.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
