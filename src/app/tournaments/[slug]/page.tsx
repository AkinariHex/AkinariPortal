import { notFound } from "next/navigation";
import { getTournamentAccess } from "@/lib/tournaments/authz";
import { buildBundle } from "@/lib/tournaments/buildBundle";
import { getTournamentMembers } from "@/lib/tournaments/data";
import TournamentClient from "./TournamentClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Tournament ${slug}`, description: "Teams, mappool, qualifiers, casters and overlay files." };
}

export default async function TournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // No access and no tournament look the same: a slug is not a secret worth leaking.
  const access = await getTournamentAccess(slug);
  if (!access) notFound();

  const members = access.role === "admin" ? await getTournamentMembers(access.tournament.id) : [];
  const siteUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/+$/, "");

  return (
    <TournamentClient
      tournament={access.tournament}
      bundle={buildBundle(access.tournament)}
      role={access.role}
      members={members}
      apiUrl={`${siteUrl}/api/overlay/${slug}`}
    />
  );
}
