"use client";

import SkinCard from "@/components/SkinCard/SkinCard";

type Skin = Parameters<typeof SkinCard>[0]["skin"];

function RecentSkins({ rSkins }: { rSkins: Skin[] }) {
  return (
    <div className="homepageContainer" id="recentSkins">
      <div className="title">Recent Skins</div>
      <div className="items">
        {rSkins.map((skin, index) => (
          <SkinCard key={skin.id ?? index} skin={skin} />
        ))}
      </div>
    </div>
  );
}

export default RecentSkins;
