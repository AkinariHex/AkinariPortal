"use client";

import SkinCard from "@/components/SkinCard/SkinCard";

type Skin = Parameters<typeof SkinCard>[0]["skin"];

function RecentSkins({ rSkins }: { rSkins: Skin[] }) {
  return (
    <section
      id="recentSkins"
      className="flex w-[92%] flex-col items-center justify-center gap-5 rounded-2xl bg-site-primary px-6 pb-6 pt-[18px] shadow-[0px_1px_15px_0px_#232931] md:w-[70%]"
    >
      <h2 className="select-none text-center text-[22pt] font-semibold text-[#eee] md:text-[26pt]">
        Recent Skins
      </h2>
      <div className="flex w-full flex-row flex-wrap justify-center gap-4">
        {rSkins.map((skin, index) => (
          <SkinCard key={skin.id ?? index} skin={skin} />
        ))}
      </div>
    </section>
  );
}

export default RecentSkins;
