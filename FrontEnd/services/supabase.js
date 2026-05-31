/**
 * services/supabase.js
 * Supabase client singleton — import ini di mana saja butuh auth.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "Supabase env belum di-set. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
