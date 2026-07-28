import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/authz";
import { getAllBadges } from "@/lib/data";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const badges = await getAllBadges();

  return <AdminClient badges={badges ?? []} />;
}
