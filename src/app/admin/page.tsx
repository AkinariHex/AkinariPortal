import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/authz";
import { getAllBadges, getAllKeyboards } from "@/lib/data";
import { getBadgeHolders } from "./data";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const [badges, holders, keyboards] = await Promise.all([
    getAllBadges(),
    getBadgeHolders(),
    getAllKeyboards(),
  ]);

  return (
    <AdminClient
      badges={badges ?? []}
      holders={holders}
      keyboards={keyboards ?? []}
    />
  );
}
