import { createBrowserClient } from '@supabase/ssr'

// No Next.js 16, usamos o createBrowserClient para garantir que os cookies 
// sejam salvos de um jeito que o Proxy/Server consiga ler.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)