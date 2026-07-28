import RecentSkins from "@/components/RecentSkins/RecentSkins";
import RecentUsers from "@/components/RecentUsers/RecentUsers";
import HomeStats from "@/components/HomeStats/HomeStats";
import SkinCard from "@/components/SkinCard/SkinCard";
import {
  getRecentSkins,
  getRecentUsers,
  getMostDownloadedSkins,
  getSiteStats,
} from "@/lib/data";

export const revalidate = 86400;

export const metadata = {
  title: "Home",
};

export default async function Home() {
  const [dbUsers, dbSkins, mostDownloaded, stats] = await Promise.all([
    getRecentUsers(),
    getRecentSkins(),
    getMostDownloadedSkins(),
    getSiteStats(),
  ]);

  return (
    <div className="homeContent">
      <object
        style={{ height: 150, filter: "brightness(1.1)", margin: 40 }}
        type="image/webp"
        data="/img/logoFull.webp"
      />
      <HomeStats skins={stats.skins} users={stats.users} />
      <div className="homepageContainer" id="mostDownloaded">
        <div className="title">Most Downloaded</div>
        <div className="items">
          {mostDownloaded.map((skin: any, index: number) => (
            <SkinCard key={skin.id ?? index} skin={skin} />
          ))}
        </div>
      </div>
      <RecentSkins rSkins={dbSkins} />
      <RecentUsers rUsers={dbUsers} />
    </div>
  );
}
