import "server-only";
import supabase from "@/lib/supabaseServer";

// Every write bumps updated_at: it is what the overlay API's ETag is built from,
// so overlays only re-download the bundle after a real change.
export async function saveTournament(id: number, patch: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase
    .from("tournaments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error(error);
  return !error;
}
