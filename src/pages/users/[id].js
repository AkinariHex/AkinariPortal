import { getSession } from "next-auth/react";
import { useState } from "react";
import ReactTooltip from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGrip,
  faDownload,
  faGripLines,
  faShare,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../../components/Modal/Modal";

function modifyDownloadCount(downloadCount, recordID) {
  fetch(`/api/skins/modifydownload?c=${downloadCount + 1}&id=${recordID}`);
}

async function deleteSkinFromDB(recordID) {
  var data = await fetch(`/api/skins/delete?id=${recordID}`);
  data = await data.json();
  data.status === "done" && window.location.reload();
}

export default function User({ session, userData, skinsData }) {
  const [skinView, setSkinView] = useState("list");

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalSkinEdit, setModalSkinEdit] = useState();

  return (
    <div className="profileDivBackground">
      <div className="mainDiv">
        <div className="userInfo">
          <div
            className="banner"
            style={{ backgroundImage: `url(${userData.Banner})` }}
          >
            <div className="dim" />
          </div>
          <div className="content">
            <div className="head">
              <img
                src={`http://s.ppy.sh/a/${userData.ID}`}
                alt={`${userData.Username}'s propic`}
                className="propic"
              />
              <div className="info">
                <div className="name">{userData.Username}</div>
                <div className="country">
                  <img
                    src={`https://raw.githubusercontent.com/ppy/osu-resources/master/osu.Game.Resources/Textures/Flags/${userData.Country.code}.png`}
                    alt={userData.Country.name}
                    className="flag"
                  />
                  <span>{userData.Country.name}</span>{" "}
                </div>
              </div>
              <div className="badges">
                {userData.Badges.length !== 0 &&
                  userData.Badges.map((badge, index) => {
                    return (
                      <img
                        key={index}
                        data-tip={badge.desc}
                        className="badge"
                        src={`/img/badges/${badge.code}.webp`}
                        alt={badge.desc}
                      />
                    );
                  })}
                {userData.Badges.length !== 0 && (
                  <ReactTooltip
                    place="top"
                    effect="solid"
                    className="badgeTooltip"
                    delayShow={300}
                    arrowColor={"var(--site-background-users-page-color)"}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="section" id="skins">
          <div className="header">
            <div className="title">Skins</div>
            <div className="styles">
              <FontAwesomeIcon
                className={`viewStyle ${skinView === "list" && "active"}`}
                id="list"
                icon={faGripLines}
                data-tip="List View"
                onClick={() => setSkinView("list")}
              />
              <FontAwesomeIcon
                className={`viewStyle ${skinView === "grid" && "active"}`}
                id="grid"
                icon={faGrip}
                data-tip="Grid View"
                onClick={() => setSkinView("grid")}
              />
              <ReactTooltip
                place="top"
                effect="solid"
                className="viewStyleTooltip"
                delayShow={300}
                arrowColor={"var(--site-background-users-page-color)"}
              />
            </div>
          </div>
          {skinView === "list" ? (
            <div className="list">
              {skinsData.map((skin, index) => {
                return (
                  <div className="item" key={index} id={skin.RecordID}>
                    <div className="about">
                      <div className="title">
                        <div className="name">{skin.Name}</div>
                        <div className="author">by {skin.Creator}</div>
                      </div>
                      <div className="info">
                        <div className="gamemodes">
                          <img
                            className={`skinMode ${
                              skin.Modes.includes("osu!standard")
                                ? "active"
                                : ""
                            }`}
                            src="/img/modes/mode-osu.png"
                          />
                          <img
                            className={`skinMode ${
                              skin.Modes.includes("osu!mania") ? "active" : ""
                            }`}
                            src="/img/modes/mode-mania.png"
                          />
                          <img
                            className={`skinMode ${
                              skin.Modes.includes("osu!taiko") ? "active" : ""
                            }`}
                            src="/img/modes/mode-taiko.png"
                          />
                          <img
                            className={`skinMode ${
                              skin.Modes.includes("osu!ctb") ? "active" : ""
                            }`}
                            src="/img/modes/mode-fruits.png"
                            style={{ rotate: "-90deg" }}
                          />
                        </div>
                        <div className="downloads">
                          <i className="bx bxs-download"></i>
                          {skin.Downloads}
                        </div>
                        {skin.Tags && (
                          <div className="tags">
                            {skin.Tags.includes("current") && (
                              <div className="tag current">Currently Using</div>
                            )}
                            {skin.Tags.includes("HD") && (
                              <div className="tag HD">HD</div>
                            )}
                            {skin.Tags.includes("HR") && (
                              <div className="tag HR">HR</div>
                            )}
                            {skin.Tags.includes("DT") && (
                              <div className="tag DT">DT</div>
                            )}
                            {skin.Tags.includes("EZ") && (
                              <div className="tag EZ">EZ</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {session && session?.id === userData.ID && (
                      <div className="adminButtons">
                        <FontAwesomeIcon
                          className="button"
                          icon={faPen}
                          style={{ color: "#fee7ad" }}
                          onClick={() => {
                            setModalIsOpen(true);
                            setModalSkinEdit(skin);
                          }}
                        />
                        <FontAwesomeIcon
                          className="button"
                          icon={faTrash}
                          style={{ color: "#ffb2b2" }}
                          onClick={() => deleteSkinFromDB(skin.RecordID)}
                        />
                      </div>
                    )}
                    <div className="buttons">
                      <FontAwesomeIcon className="button" icon={faShare} />
                      <FontAwesomeIcon
                        className="button"
                        icon={faDownload}
                        onClick={() => {
                          modifyDownloadCount(skin.Downloads, skin.RecordID);
                          window.open(skin.URL, "_blank");
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {session && session?.id === userData.ID && (
                <div
                  className="item createSkin"
                  onClick={() => setModalIsOpen(true)}
                >
                  <span>Add Skin</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid">
              {skinsData.map((skin, index) => {
                return (
                  <div
                    className="item"
                    key={index}
                    style={{
                      backgroundImage: `url('${skin.Banner}')`,
                    }}
                  >
                    {skin.Tags && (
                      <div className="tags">
                        {skin.Tags.includes("current") && (
                          <div className="tag current">Currently Using</div>
                        )}
                        {skin.Tags.includes("HD") && (
                          <div className="tag HD">HD</div>
                        )}
                        {skin.Tags.includes("HR") && (
                          <div className="tag HR">HR</div>
                        )}
                        {skin.Tags.includes("DT") && (
                          <div className="tag DT">DT</div>
                        )}
                        {skin.Tags.includes("EZ") && (
                          <div className="tag EZ">EZ</div>
                        )}
                      </div>
                    )}
                    <div className="content">
                      <div className="about">
                        <div className="title">
                          <div className="name">{skin.Name}</div>
                          <div className="author">by {skin.Creator}</div>
                        </div>
                        <div className="info">
                          <div className="gamemodes">
                            <img
                              className={`skinMode ${
                                skin.Modes.includes("osu!standard")
                                  ? "active"
                                  : ""
                              }`}
                              src="/img/modes/mode-osu.png"
                            />
                            <img
                              className={`skinMode ${
                                skin.Modes.includes("osu!mania") ? "active" : ""
                              }`}
                              src="/img/modes/mode-mania.png"
                            />
                            <img
                              className={`skinMode ${
                                skin.Modes.includes("osu!taiko") ? "active" : ""
                              }`}
                              src="/img/modes/mode-taiko.png"
                            />
                            <img
                              className={`skinMode ${
                                skin.Modes.includes("osu!ctb") ? "active" : ""
                              }`}
                              src="/img/modes/mode-fruits.png"
                              style={{ rotate: "-90deg" }}
                            />
                          </div>
                          <div className="downloads">
                            {skin.Downloads}
                            <i className="bx bxs-download"></i>
                          </div>
                        </div>
                      </div>
                      {session && session?.id === userData.ID && (
                        <div className="adminButtons">
                          <FontAwesomeIcon
                            className="button"
                            icon={faPen}
                            style={{ color: "#fee7ad" }}
                            onClick={() => {
                              setModalIsOpen(true);
                              setModalSkinEdit(skin);
                            }}
                          />
                          <FontAwesomeIcon
                            className="button"
                            icon={faTrash}
                            style={{ color: "#ffb2b2" }}
                            onClick={() => deleteSkinFromDB(skin.RecordID)}
                          />
                        </div>
                      )}
                      <div className="buttons">
                        <FontAwesomeIcon className="button" icon={faShare} />
                        <FontAwesomeIcon
                          className="button"
                          icon={faDownload}
                          onClick={() => {
                            window.open(skin.URL, "_blank");
                            modifyDownloadCount(skin.Downloads, skin.RecordID);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {session && session?.id === userData.ID && (
                <div
                  className="itemCreateSkin"
                  onClick={() => setModalIsOpen(true)}
                >
                  <span>Add Skin</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {modalIsOpen && (
        <Modal
          openModal={setModalIsOpen}
          skinToEdit={modalSkinEdit}
          skinToEditStatus={setModalSkinEdit}
          sessionUser={session.id}
        />
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  // Get user session
  const session = await getSession(context);

  const statusData = await fetch(
    `${process.env.NEXTAUTH_URL}/api/users?u=${context.params.id}`
  )
    .then((res) => res.json())
    .then((res) => res[0]);

  const skinsData =
    statusData !== null
      ? await fetch(
          `${process.env.NEXTAUTH_URL}/api/skins?u=${context.params.id}`
        ).then((res) => res.json())
      : [{}];

  const returnProps =
    statusData === null
      ? {
          redirect: {
            destination: "/",
            permanent: false,
          },
        }
      : {
          props: {
            session: session,
            userData: statusData,
            skinsData,
          },
        };

  return { ...returnProps };
}
