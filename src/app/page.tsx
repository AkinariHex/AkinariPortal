import RecentSkins from "@/components/RecentSkins/RecentSkins";
import RecentUsers from "@/components/RecentUsers/RecentUsers";
import { getRecentSkins, getRecentUsers } from "@/lib/data";

export const revalidate = 86400;

export default async function Home() {
  const [dbUsers, dbSkins] = await Promise.all([
    getRecentUsers(),
    getRecentSkins(),
  ]);

  return (
    <div className="homeContent">
      <object
        style={{ height: 150, filter: "brightness(1.1)", margin: 40 }}
        type="image/webp"
        data="/img/logoFull.webp"
      />
      <RecentSkins rSkins={dbSkins} />
      <RecentUsers rUsers={dbUsers} />
    </div>
  );
}
