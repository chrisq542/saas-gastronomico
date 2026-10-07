import { createClient } from '@supabase/supabase-js';

// Cliente con Service Role Key para operaciones de backend privilegiadas
// NUNCA importar ni invocar este cliente en el frontend o componentes de cliente
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
