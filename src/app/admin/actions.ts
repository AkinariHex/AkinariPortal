"use server";

import { updateTag } from "next/cache";
import { getAdminSession } from "@/lib/authz";
import supabase from "@/lib/supabaseServer";

type BadgeId = string | number;

export async function createBadge(input: { id: BadgeId; title: string }) {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" as const };

  const id = String(input?.id ?? "").trim();
  const title = String(input?.title ?? "").trim();
  if (!id || !title) return { status: "invalid" as const };

  try {
    const { error } = await supabase.from("badges").insert({ id, title });
    if (error) {
      console.error(error);
      return { status: "error" as const };
    }
    updateTag("badges");
    return { status: "done" as const };
  } catch (err) {
    console.error(err);
    return { status: "error" as const };
  }
}

export async function updateBadge(input: { id: BadgeId; title: string }) {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" as const };

  const title = String(input?.title ?? "").trim();
  if (input?.id === undefined || input?.id === null || !title)
    return { status: "invalid" as const };

  try {
    const { error } = await supabase
      .from("badges")
      .update({ title })
      .eq("id", input.id);
    if (error) {
      console.error(error);
      return { status: "error" as const };
    }
    updateTag("badges");
    return { status: "done" as const };
  } catch (err) {
    console.error(err);
    return { status: "error" as const };
  }
}

export async function deleteBadge(id: BadgeId) {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" as const };

  if (id === undefined || id === null) return { status: "invalid" as const };

  try {
    await supabase.from("users_badges").delete().eq("badge_id", id);
    await supabase.from("pending_badges").delete().eq("badge_id", id);

    const { error } = await supabase.from("badges").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { status: "error" as const };
    }
    updateTag("badges");
    return { status: "done" as const };
  } catch (err) {
    console.error(err);
    return { status: "error" as const };
  }
}

export async function grantBadge(osuId: BadgeId, badgeId: BadgeId) {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" as const };

  if (osuId === undefined || osuId === null || badgeId === undefined || badgeId === null)
    return { status: "invalid" as const };

  try {
    const { data: userRows, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("id", osuId);
    if (userErr) {
      console.error(userErr);
      return { status: "error" as const };
    }

    const hasAccount = !!(userRows && userRows.length > 0);

    if (hasAccount) {
      const { error } = await supabase
        .from("users_badges")
        .upsert(
          { user_id: osuId, badge_id: badgeId },
          { onConflict: "user_id,badge_id" }
        );
      if (error) {
        console.error(error);
        return { status: "error" as const };
      }
      updateTag(`user:${osuId}`);
      return { status: "done" as const, placement: "active" as const };
    }

    // No site account: place in pending_badges. Assume no unique constraint,
    // so dedupe with a select-first before inserting.
    const { data: existing, error: existErr } = await supabase
      .from("pending_badges")
      .select("badge_id")
      .eq("user_id", osuId)
      .eq("badge_id", badgeId);
    if (existErr) {
      console.error(existErr);
      return { status: "error" as const };
    }

    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from("pending_badges")
        .insert({ user_id: osuId, badge_id: badgeId });
      if (error) {
        console.error(error);
        return { status: "error" as const };
      }
    }

    updateTag(`user:${osuId}`);
    return { status: "done" as const, placement: "pending" as const };
  } catch (err) {
    console.error(err);
    return { status: "error" as const };
  }
}

export async function revokeBadge(osuId: BadgeId, badgeId: BadgeId) {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" as const };

  if (osuId === undefined || osuId === null || badgeId === undefined || badgeId === null)
    return { status: "invalid" as const };

  try {
    await supabase
      .from("users_badges")
      .delete()
      .eq("user_id", osuId)
      .eq("badge_id", badgeId);
    await supabase
      .from("pending_badges")
      .delete()
      .eq("user_id", osuId)
      .eq("badge_id", badgeId);

    updateTag(`user:${osuId}`);
    return { status: "done" as const };
  } catch (err) {
    console.error(err);
    return { status: "error" as const };
  }
}

export async function getUserBadges(osuId: BadgeId) {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" as const };

  if (osuId === undefined || osuId === null || String(osuId).trim() === "")
    return { status: "invalid" as const };

  try {
    const [accountRes, assignedRes, pendingRes] = await Promise.all([
      supabase.from("users").select("id").eq("id", osuId),
      supabase.from("users_badges").select("badge_id").eq("user_id", osuId),
      supabase.from("pending_badges").select("badge_id").eq("user_id", osuId),
    ]);

    if (accountRes.error || assignedRes.error || pendingRes.error) {
      console.error(accountRes.error || assignedRes.error || pendingRes.error);
      return { status: "error" as const };
    }

    return {
      status: "done" as const,
      hasAccount: !!(accountRes.data && accountRes.data.length > 0),
      assigned: (assignedRes.data ?? []).map((r: any) => r.badge_id),
      pending: (pendingRes.data ?? []).map((r: any) => r.badge_id),
    };
  } catch (err) {
    console.error(err);
    return { status: "error" as const };
  }
}
