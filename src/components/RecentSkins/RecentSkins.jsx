import React from "react";

function RecentSkins({ rSkins }) {
  return (
    <div className="homepageContainer" id="recentSkins">
      <div className="title">Recent Skins</div>
      <div className="items">
        {rSkins.map((skin, index) => {
          return (
            <div
              key={index}
              className="item skins"
              onClick={() => window.open(skin.URL, "_blank")}
            >
              <div
                className="header"
                style={{ backgroundImage: `url(${skin.Banner})` }}
              >
                <div className="dimForBG"></div>
              </div>
              <div className="content">
                <div className="name">{skin.Name}</div>
                <div className="info">
                  <div className="owner">
                    <img
                      src={`http://s.ppy.sh/a/${skin.Owner}`}
                      alt={skin.Owner}
                    />{" "}
                    <span>{skin.OwnerName}</span>
                  </div>
                  <div className="rightSide">
                    <div className="downloads">
                      {skin.Downloads}
                      <i className="bx bxs-download"></i>
                    </div>
                    <div className="gamemodes">
                      <object
                        className={`modeImg ${
                          skin.Modes.includes("osu!standard") ? "active" : ""
                        }`}
                        data="/img/modes/mode-osu.webp"
                        type="image/webp"
                      />
                      <object
                        className={`modeImg ${
                          skin.Modes.includes("osu!mania") ? "active" : ""
                        }`}
                        data="/img/modes/mode-mania.webp"
                        type="image/webp"
                      />
                      <object
                        className={`modeImg ${
                          skin.Modes.includes("osu!taiko") ? "active" : ""
                        }`}
                        data="/img/modes/mode-taiko.webp"
                        type="image/webp"
                      />
                      <object
                        className={`modeImg ${
                          skin.Modes.includes("osu!ctb") ? "active" : ""
                        }`}
                        data="/img/modes/mode-fruits.webp"
                        type="image/webp"
                        style={{ rotate: "-90deg" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentSkins;
