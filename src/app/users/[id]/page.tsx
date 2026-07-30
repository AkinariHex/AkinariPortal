import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile, getUserSkins, resolveUserId } from "./data";
import ProfileClient from "./ProfileClient";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonicalId = await resolveUserId(id);
  if (!canonicalId) return {};

  const userData: any = await getUserProfile(canonicalId);
  if (!userData) return {};

  const title = `${userData.username}'s Profile | Akinari Portal`;
  return {
    title: { absolute: title },
    openGraph: { title },
    twitter: { title },
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // [id] accepts a numeric osu! id, a current username, or a previous
  // username - resolve to the canonical numeric id and redirect there so
  // every profile has one stable URL.
  const canonicalId = await resolveUserId(id);
  if (!canonicalId) notFound();
  if (canonicalId !== id) redirect(`/users/${canonicalId}`);

  const [userData, skinsData, session] = await Promise.all([
    getUserProfile(canonicalId),
    getUserSkins(canonicalId),
    auth(),
  ]);

  if (!userData) notFound();

  const sessionId = (session as any)?.id ?? null;
  const isOwner = String(sessionId) === String(canonicalId);

  return (
    <ProfileClient
      userData={userData}
      skinsData={skinsData}
      isOwner={isOwner}
      sessionId={sessionId}
    />
  );
}
