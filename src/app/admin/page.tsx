import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/authz";
import { getAllBadges } from "@/lib/data";
import { getBadgeHolders } from "./data";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const [badges, holders] = await Promise.all([
    getAllBadges(),
    getBadgeHolders(),
  ]);

  return <AdminClient badges={badges ?? []} holders={holders} />;
}
