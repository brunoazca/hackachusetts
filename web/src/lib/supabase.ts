import { createClient } from "@supabase/supabase-js";

// Browser + server read client (anon key, RLS = public read).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
