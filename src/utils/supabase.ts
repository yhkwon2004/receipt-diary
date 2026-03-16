import { createClient } from '@supabase/supabase-js';

// ==================== Supabase 클라이언트 ====================
// 환경변수 또는 런타임 설정에서 읽기
const getSupabaseConfig = () => {
  const url =
    process.env.REACT_APP_SUPABASE_URL ||
    localStorage.getItem('sb_url') ||
    '';
  const key =
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    localStorage.getItem('sb_anon_key') ||
    '';
  return { url, key };
};

let _client: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!_client) {
    _client = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
};

export const resetSupabaseClient = () => {
  _client = null;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

export default getSupabase;
