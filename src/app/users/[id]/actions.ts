"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { auth } from "@/auth";
import supabase from "@/lib/supabaseServer";

const skinSchema = z.object({
  name: z.string().trim().min(1).max(45),
  creator: z.string().trim().min(1).max(25),
  bg: z.string().trim().default(""),
  modes: z.string().min(1),
  tags: z.string().default("[]"),
  url: z.string().trim().url(),
});

type ActionResult =
  | { status: "done" }
  | { status: "error"; message?: string }
  | { status: "unauthorized" };

async function ownsSkin(skinId: string | number, userId: string) {
  const { data } = await supabase
    .from("skins")
    .select("Player")
    .eq("id", skinId)
    .single();
  return data ? String(data.Player) === String(userId) : false;
}

export async function createSkin(input: unknown): Promise<ActionResult> {
  const session: any = await auth();
  if (!session?.id) return { status: "unauthorized" };

  const parsed = skinSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Invalid input" };
  const skin = parsed.data;

  // Owner is derived from the session, never trusted from the client.
  const { error } = await supabase.from("skins").insert([
    {
      Name: skin.name,
      Creator: skin.creator,
      Player: String(session.id),
      Banner: skin.bg,
      Modes: skin.modes,
      Tags: skin.tags,
      URL: skin.url,
      Downloads: 0,
    },
  ]);

  if (error) {
    console.error(error);
    return { status: "error" };
  }

  updateTag("skins");
  updateTag(`skins:user:${session.id}`);
  return { status: "done" };
}

export async function updateSkin(input: unknown): Promise<ActionResult> {
  const session: any = await auth();
  if (!session?.id) return { status: "unauthorized" };

  const schema = skinSchema.extend({ id: z.union([z.string(), z.number()]) });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Invalid input" };
  const skin = parsed.data;

  if (!(await ownsSkin(skin.id, String(session.id)))) {
    return { status: "unauthorized" };
  }

  const { error } = await supabase
    .from("skins")
    .update({
      Name: skin.name,
      Creator: skin.creator,
      Banner: skin.bg,
      Modes: skin.modes,
      Tags: skin.tags,
      URL: skin.url,
    })
    .eq("id", skin.id);

  if (error) {
    console.error(error);
    return { status: "error" };
  }

  updateTag("skins");
  updateTag(`skins:user:${session.id}`);
  return { status: "done" };
}

export async function deleteSkin(id: string | number): Promise<ActionResult> {
  const session: any = await auth();
  if (!session?.id) return { status: "unauthorized" };

  if (!(await ownsSkin(id, String(session.id)))) {
    return { status: "unauthorized" };
  }

  const { error } = await supabase.from("skins").delete().match({ id });
  if (error) {
    console.error(error);
    return { status: "error" };
  }

  updateTag("skins");
  updateTag(`skins:user:${session.id}`);
  return { status: "done" };
}

// Public: anyone downloading a skin bumps its counter. Count is derived
// server-side; no client-supplied value is trusted.
export async function incrementDownload(id: string | number): Promise<ActionResult> {
  const { data: current, error: readError } = await supabase
    .from("skins")
    .select("Downloads,Player")
    .eq("id", id)
    .single();

  if (readError || !current) return { status: "error" };

  const { error } = await supabase
    .from("skins")
    .update({ Downloads: (current.Downloads ?? 0) + 1 })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { status: "error" };
  }

  updateTag(`skins:user:${current.Player}`);
  return { status: "done" };
}
