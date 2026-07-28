import "server-only";
import { auth } from "@/auth";
import supabase from "@/lib/supabaseServer";

// Returns the current session ONLY if that user has role 'admin' in the DB,
// otherwise null. Role is read from the `users` table (the session/JWT does not
// carry it). Use for gating admin pages and every admin server action.
export async function getAdminSession(): Promise<any | null> {
  const session: any = await auth();
  if (!session?.id) return null;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.id)
    .single();

  return data?.role === "admin" ? session : null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
