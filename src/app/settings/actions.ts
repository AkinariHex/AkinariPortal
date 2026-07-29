"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { auth } from "@/auth";
import supabase from "@/lib/supabaseServer";
import { notifyKeyboardRequest } from "@/lib/discord";

const generateApiKeyLib = require("generate-api-key");

const randomString = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:<>?,./";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
};

export async function generateApiKey() {
  const session: any = await auth();
  if (!session?.id) return { status: "error" as const };

  const { data, error } = await supabase
    .from("users")
    .select("id,UUID")
    .eq("id", session.id);

  if (error || !data?.length) {
    console.error(error);
    return { status: "error" as const };
  }

  const newAPI = generateApiKeyLib({
    method: "uuidv5",
    name: randomString(),
    namespace: data[0].UUID,
    prefix: String(data[0].id),
  });

  const { error: updateError } = await supabase
    .from("users")
    .update({ secret_key: newAPI })
    .eq("id", session.id);

  if (updateError) {
    console.error(updateError);
    return { status: "error" as const };
  }

  return { status: "success" as const, secret_key: newAPI as string };
}

export async function destroyApiKey() {
  const session: any = await auth();
  if (!session?.id) return { status: "error" as const };

  const { error } = await supabase
    .from("users")
    .update({ secret_key: "" })
    .eq("id", session.id);

  if (error) {
    console.error(error);
    return { status: "error" as const };
  }

  return { status: "success" as const };
}

export async function saveSkinView(skinView: unknown) {
  const session: any = await auth();
  if (!session?.id) return { message: "error" as const };

  const parsed = z.object({ value: z.string(), label: z.string() }).safeParse(skinView);
  if (!parsed.success) return { message: "error" as const };

  const { error } = await supabase
    .from("users")
    .update({ skin_view: parsed.data })
    .eq("id", session.id);

  if (error) {
    console.error(error);
    return { message: "error" as const };
  }

  updateTag(`user:${session.id}`);
  return { message: "done" as const };
}

export async function saveProfileLayout(layout: unknown) {
  const session: any = await auth();
  if (!session?.id) return { message: "error" as const };

  const parsed = z.enum(["side-panel", "big-cover"]).safeParse(layout);
  if (!parsed.success) return { message: "error" as const };

  const { error } = await supabase
    .from("users")
    .update({ profile_layout: parsed.data })
    .eq("id", session.id);

  if (error) {
    console.error(error);
    return { message: "error" as const };
  }

  updateTag(`user:${session.id}`);
  return { message: "done" as const };
}

export async function saveSocials(input: unknown) {
  const session: any = await auth();
  if (!session?.id) return { message: "error" as const };

  const parsed = z
    .object({
      twitch: z.string(),
      github: z.string(),
      twitter: z.string(),
      discord: z.string(),
      youtube: z.string(),
    })
    .safeParse(input);
  if (!parsed.success) return { message: "error" as const };

  const { error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", session.id);

  if (error) {
    console.error(error);
    return { message: "error" as const };
  }

  updateTag(`user:${session.id}`);
  return { message: "done" as const };
}

// Any logged-in user can request a device that's not in the catalog.
export async function requestKeyboard(input: unknown) {
  const session: any = await auth();
  if (!session?.id) return { status: "unauthorized" as const };

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(100),
      brand: z.string().trim().max(60).optional(),
      type: z.enum(["keyboard", "keypad"]).default("keyboard"),
      vendor_id: z.number().int().nullable().optional(),
      product_id: z.number().int().nullable().optional(),
      note: z.string().trim().max(500).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { status: "error" as const };

  const row = {
    user_id: String(session.id),
    name: parsed.data.name,
    brand: parsed.data.brand ?? null,
    vendor_id: parsed.data.vendor_id ?? null,
    product_id: parsed.data.product_id ?? null,
    note: parsed.data.note ?? null,
  };

  // `type` arrives with docs/keyboard-request-type.sql; until that runs, insert
  // without it rather than losing the request.
  let { error } = await supabase
    .from("keyboard_requests")
    .insert({ ...row, type: parsed.data.type });

  if (error) {
    ({ error } = await supabase.from("keyboard_requests").insert(row));
  }

  if (error) {
    console.error(error);
    return { status: "error" as const };
  }

  updateTag("keyboard-requests");

  // Ping Discord after the row is safely in. notifyKeyboardRequest swallows its
  // own failures, so a broken webhook never costs the user their request.
  const { data: requester } = await supabase
    .from("users")
    .select("username")
    .eq("id", session.id)
    .maybeSingle();

  await notifyKeyboardRequest({
    name: parsed.data.name,
    brand: parsed.data.brand ?? null,
    type: parsed.data.type,
    note: parsed.data.note ?? null,
    vendorId: parsed.data.vendor_id ?? null,
    productId: parsed.data.product_id ?? null,
    userId: String(session.id),
    username: requester?.username ?? null,
    requestedAt: new Date().toISOString(),
  });

  return { status: "done" as const };
}

export async function saveKeyboard(input: unknown) {
  const session: any = await auth();
  if (!session?.id) return { message: "error" as const };

  const parsed = z
    .object({
      keyboard: z.string().nullable(),
      keyboard_keys: z.array(z.string()).default([]),
    })
    .safeParse(input);
  if (!parsed.success) return { message: "error" as const };

  const { error } = await supabase
    .from("users")
    .update({
      keyboard: parsed.data.keyboard,
      keyboard_keys: parsed.data.keyboard_keys,
    })
    .eq("id", session.id);

  if (error) {
    console.error(error);
    return { message: "error" as const };
  }

  updateTag(`user:${session.id}`);
  updateTag("keyboards");
  return { message: "done" as const };
}

export async function saveTablet(input: unknown) {
  const session: any = await auth();
  if (!session?.id) return { message: "error" as const };

  const parsed = z
    .object({
      tablet: z.any().nullable(),
      tabletSettingsFile: z.any().nullable(),
      tabletFileUploadInfo: z.any().nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { message: "error" as const };

  const { error } = await supabase
    .from("users")
    .update({
      tablet: parsed.data.tablet ?? null,
      tabletSettingsFile: parsed.data.tabletSettingsFile ?? null,
      tabletFileUploadInfo: parsed.data.tabletFileUploadInfo ?? null,
    })
    .eq("id", session.id);

  if (error) {
    console.error(error);
    return { message: "error" as const };
  }

  updateTag(`user:${session.id}`);
  return { message: "done" as const };
}
