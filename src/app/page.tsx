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
    <div className="flex w-full flex-col items-center gap-6 px-4 pb-24 pt-8 md:gap-7 md:pb-12 md:pt-6">
      <object
        type="image/webp"
        data="/img/logoFull.webp"
        className="my-6 hidden h-[150px] brightness-110 md:block"
      />

      <HomeStats
        skins={stats.skins}
        users={stats.users}
        tablet={stats.tablet}
        keyboard={stats.keyboard}
      />

      <section
        id="mostDownloaded"
        className="flex w-[92%] flex-col items-center justify-center gap-5 rounded-2xl bg-site-primary px-6 pb-6 pt-[18px] shadow-[0px_1px_15px_0px_#232931] md:w-[70%]"
      >
        <h2 className="select-none text-center text-[22pt] font-semibold text-[#eee] md:text-[26pt]">
          Most Downloaded
        </h2>
        <div className="flex w-full flex-row flex-wrap justify-center gap-4">
          {mostDownloaded.map((skin: any, index: number) => (
            <SkinCard key={skin.id ?? index} skin={skin} />
          ))}
        </div>
      </section>

      <RecentSkins rSkins={dbSkins} />
      <RecentUsers rUsers={dbUsers} />
    </div>
  );
}
