import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile, getUserSkins } from "./data";
import ProfileClient from "./ProfileClient";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const userData: any = await getUserProfile(id);
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

  const [userData, skinsData, session] = await Promise.all([
    getUserProfile(id),
    getUserSkins(id),
    auth(),
  ]);

  if (!userData) notFound();

  const sessionId = (session as any)?.id ?? null;
  const isOwner = String(sessionId) === String(id);

  return (
    <ProfileClient
      userData={userData}
      skinsData={skinsData}
      isOwner={isOwner}
      sessionId={sessionId}
    />
  );
}
