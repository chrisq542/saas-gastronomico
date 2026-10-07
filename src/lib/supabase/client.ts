import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Instancia singleton para uso rápido en componentes cliente
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;
export const getSupabase = () => {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
};

