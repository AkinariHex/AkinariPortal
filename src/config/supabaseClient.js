import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. SERVER-ONLY.
// The key has no NEXT_PUBLIC_ prefix, so Next never inlines it into the client
// bundle. On the client `serviceRoleKey` resolves to "" and this stays null.
// Never import this module from a client component.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export default supabase;
