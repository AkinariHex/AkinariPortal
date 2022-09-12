import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import ReactTooltip from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  faGrip,
  faDownload,
  faGripLines,
  faShare,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../../components/Modal/Modal";
import AlertContainer from "../../components/Alert/AlertContainer";
import LivestreamPlayer from "../../components/LivestreamPlayer/LivestreamPlayer";
import supabase from "../../config/supabaseClient";

function modifyDownloadCount(downloadCount, recordID) {
  fetch(`/api/skins/modifydownload?c=${downloadCount + 1}&id=${recordID}`);
}

async function deleteSkinFromDB(recordID, userid) {
  var data = await fetch(`/api/skins/delete?id=${recordID}&user=${userid}`);
  data = await data.json();
  data.status === "done" && window.location.reload();
}

export default function User({ session, userData, skinsData }) {
  const [skinView, setSkinView] = useState(userData.skin_view.value);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalSkinEdit, setModalSkinEdit] = useState();

  const [isLinkCopied, setIsLinkCopied] = useState(false);

  function showCopyAlert() {
    setIsLinkCopied(true);
    setTimeout(() => {
      setIsLinkCopied(false);
    }, 5000);
  }

  return (
    <>
      <Head>
        <title>{userData.username}'s Profile | Akinari Portal</title>
        <meta
          property="og:title"
          content={`${userData.username}'s Profile | Akinari Portal`}
        />
        <meta
          name="twitter:title"
          content={`${userData.username}'s Profile | Akinari Portal`}
        />
      </Head>
      <div className="profileDivBackground">
        <div className="mainDiv">
          <div className="userInfo">
            <div
              className="banner"
              style={{ backgroundImage: `url(${userData.banner})` }}
            >
              <div className="dim" />
            </div>
            <div className="content">
              <div className="head">
                <img
                  src={`http://s.ppy.sh/a/${userData.id}`}
                  alt={`${userData.username}'s propic`}
                  className="propic"
                />
                <div className="info">
                  <div className="name">{userData.username}</div>
                  <div className="country">
                    <img
                      src={`https://raw.githubusercontent.com/ppy/osu-resources/master/osu.Game.Resources/Textures/Flags/${userData.country?.code}.png`}
                      alt={userData.country?.name}
                      className="flag"
                    />
                    <span>{userData.country?.name}</span>{" "}
                  </div>
                </div>
                <div className="badges">
                  {userData.badges.length !== 0 &&
                    userData.badges.map((badge, index) => {
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
                  {userData.badges.length !== 0 && (
                    <ReactTooltip
                      place="top"
                      effect="solid"
                      className="badgeTooltip"
                      delayShow={300}
                      delayHide={0}
                      arrowColor={"var(--site-background-users-page-color)"}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          {userData.twitch !== null && (
            <LivestreamPlayer twitchName={userData.twitch} />
          )}
          <div className="section" id="skins">
            <div className="header">
              <div className="title">Skins</div>
              <div className="styles">
                <FontAwesomeIcon
                  className={`viewStyle ${skinView === "list" && "active"}`}
                  id="list"
                  icon={faGripLines}
                  data-tip="List View"
                  width={"13.2pt"}
                  onClick={() => setSkinView("list")}
                />
                <FontAwesomeIcon
                  className={`viewStyle ${skinView === "grid" && "active"}`}
                  id="grid"
                  icon={faGrip}
                  data-tip="Grid View"
                  width={"13.2pt"}
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
                  if (skin.Tags.includes("current")) {
                    return (
                      <div className="item" key={index} id={skin.id}>
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
                                  skin.Modes.includes("osu!mania")
                                    ? "active"
                                    : ""
                                }`}
                                src="/img/modes/mode-mania.png"
                              />
                              <img
                                className={`skinMode ${
                                  skin.Modes.includes("osu!taiko")
                                    ? "active"
                                    : ""
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
                                  <div className="tag current">
                                    Currently Using
                                  </div>
                                )}
                                {skin.Tags.includes("tournaments") && (
                                  <div className="tag tournaments">
                                    Using in Tournaments
                                  </div>
                                )}
                                {skin.Tags.includes("casual") && (
                                  <div className="tag casual">Casual</div>
                                )}
                                {skin.Tags.includes("old") && (
                                  <div className="tag old">Old</div>
                                )}
                                {skin.Tags.includes("aim") && (
                                  <div className="tag aim">Aim</div>
                                )}
                                {skin.Tags.includes("stream") && (
                                  <div className="tag stream">Stream</div>
                                )}
                                {skin.Tags.includes("tech") && (
                                  <div className="tag tech">Tech</div>
                                )}
                                {skin.Tags.includes("reading") && (
                                  <div className="tag reading">Reading</div>
                                )}
                                {skin.Tags.includes("speed") && (
                                  <div className="tag speed">Speed</div>
                                )}
                                {skin.Tags.includes("highAR") && (
                                  <div className="tag highAR">HighAR</div>
                                )}
                                {skin.Tags.includes("lowAR") && (
                                  <div className="tag lowAR">LowAR</div>
                                )}
                                {skin.Tags.includes("highCS") && (
                                  <div className="tag highCS">HighCS</div>
                                )}
                                {skin.Tags.includes("lowCS") && (
                                  <div className="tag lowCS">LowCS</div>
                                )}
                                {skin.Tags.includes("troll") && (
                                  <div className="tag troll">Troll</div>
                                )}
                                {skin.Tags.includes("NM") && (
                                  <div className="tag NM">NM</div>
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
                                {skin.Tags.includes("FL") && (
                                  <div className="tag FL">FL</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {session && session?.id === userData.id && (
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
                              onClick={() =>
                                deleteSkinFromDB(skin.id, skin.Player.id)
                              }
                            />
                          </div>
                        )}
                        <div className="buttons">
                          <CopyToClipboard
                            text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                            onCopy={showCopyAlert}
                          >
                            <FontAwesomeIcon
                              className="button"
                              icon={faShare}
                            />
                          </CopyToClipboard>
                          <FontAwesomeIcon
                            className="button"
                            icon={faDownload}
                            onClick={() => {
                              modifyDownloadCount(skin.Downloads, skin.id);
                              window.open(skin.URL, "_blank");
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                })}
                {skinsData.map((skin, index) => {
                  if (!skin.Tags.includes("current")) {
                    return (
                      <div className="item" key={index} id={skin.id}>
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
                                  skin.Modes.includes("osu!mania")
                                    ? "active"
                                    : ""
                                }`}
                                src="/img/modes/mode-mania.png"
                              />
                              <img
                                className={`skinMode ${
                                  skin.Modes.includes("osu!taiko")
                                    ? "active"
                                    : ""
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
                                  <div className="tag current">
                                    Currently Using
                                  </div>
                                )}
                                {skin.Tags.includes("tournaments") && (
                                  <div className="tag tournaments">
                                    Using in Tournaments
                                  </div>
                                )}
                                {skin.Tags.includes("casual") && (
                                  <div className="tag casual">Casual</div>
                                )}
                                {skin.Tags.includes("old") && (
                                  <div className="tag old">Old</div>
                                )}
                                {skin.Tags.includes("aim") && (
                                  <div className="tag aim">Aim</div>
                                )}
                                {skin.Tags.includes("stream") && (
                                  <div className="tag stream">Stream</div>
                                )}
                                {skin.Tags.includes("tech") && (
                                  <div className="tag tech">Tech</div>
                                )}
                                {skin.Tags.includes("reading") && (
                                  <div className="tag reading">Reading</div>
                                )}
                                {skin.Tags.includes("speed") && (
                                  <div className="tag speed">Speed</div>
                                )}
                                {skin.Tags.includes("highAR") && (
                                  <div className="tag highAR">HighAR</div>
                                )}
                                {skin.Tags.includes("lowAR") && (
                                  <div className="tag lowAR">LowAR</div>
                                )}
                                {skin.Tags.includes("highCS") && (
                                  <div className="tag highCS">HighCS</div>
                                )}
                                {skin.Tags.includes("lowCS") && (
                                  <div className="tag lowCS">LowCS</div>
                                )}
                                {skin.Tags.includes("troll") && (
                                  <div className="tag troll">Troll</div>
                                )}
                                {skin.Tags.includes("NM") && (
                                  <div className="tag NM">NM</div>
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
                                {skin.Tags.includes("FL") && (
                                  <div className="tag FL">FL</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {session && session?.id === userData.id && (
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
                              onClick={() =>
                                deleteSkinFromDB(skin.id, skin.Player.id)
                              }
                            />
                          </div>
                        )}
                        <div className="buttons">
                          <CopyToClipboard
                            text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                            onCopy={showCopyAlert}
                          >
                            <FontAwesomeIcon
                              className="button"
                              icon={faShare}
                            />
                          </CopyToClipboard>
                          <FontAwesomeIcon
                            className="button"
                            icon={faDownload}
                            onClick={() => {
                              modifyDownloadCount(skin.Downloads, skin.id);
                              window.open(skin.URL, "_blank");
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                })}
                {session && session?.id === userData.id && (
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
                  if (skin.Tags.includes("current")) {
                    return (
                      <div
                        className="item"
                        key={index}
                        id={skin.id}
                        style={{
                          backgroundImage: `url('${skin.Banner}')`,
                        }}
                      >
                        {skin.Tags && (
                          <div className="tags">
                            {skin.Tags.includes("current") && (
                              <div className="tag current">Currently Using</div>
                            )}
                            {skin.Tags.includes("tournaments") && (
                              <div className="tag tournaments">
                                Using in Tournaments
                              </div>
                            )}
                            {skin.Tags.includes("casual") && (
                              <div className="tag casual">Casual</div>
                            )}
                            {skin.Tags.includes("old") && (
                              <div className="tag old">Old</div>
                            )}
                            {skin.Tags.includes("aim") && (
                              <div className="tag aim">Aim</div>
                            )}
                            {skin.Tags.includes("stream") && (
                              <div className="tag stream">Stream</div>
                            )}
                            {skin.Tags.includes("tech") && (
                              <div className="tag tech">Tech</div>
                            )}
                            {skin.Tags.includes("reading") && (
                              <div className="tag reading">Reading</div>
                            )}
                            {skin.Tags.includes("speed") && (
                              <div className="tag speed">Speed</div>
                            )}
                            {skin.Tags.includes("highAR") && (
                              <div className="tag highAR">HighAR</div>
                            )}
                            {skin.Tags.includes("lowAR") && (
                              <div className="tag lowAR">LowAR</div>
                            )}
                            {skin.Tags.includes("highCS") && (
                              <div className="tag highCS">HighCS</div>
                            )}
                            {skin.Tags.includes("lowCS") && (
                              <div className="tag lowCS">LowCS</div>
                            )}
                            {skin.Tags.includes("troll") && (
                              <div className="tag troll">Troll</div>
                            )}
                            {skin.Tags.includes("NM") && (
                              <div className="tag NM gridTag">NM</div>
                            )}
                            {skin.Tags.includes("HD") && (
                              <div className="tag HD gridTag">HD</div>
                            )}
                            {skin.Tags.includes("HR") && (
                              <div className="tag HR gridTag">HR</div>
                            )}
                            {skin.Tags.includes("DT") && (
                              <div className="tag DT gridTag">DT</div>
                            )}
                            {skin.Tags.includes("EZ") && (
                              <div className="tag EZ gridTag">EZ</div>
                            )}
                            {skin.Tags.includes("FL") && (
                              <div className="tag FL gridTag">FL</div>
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
                                    skin.Modes.includes("osu!mania")
                                      ? "active"
                                      : ""
                                  }`}
                                  src="/img/modes/mode-mania.png"
                                />
                                <img
                                  className={`skinMode ${
                                    skin.Modes.includes("osu!taiko")
                                      ? "active"
                                      : ""
                                  }`}
                                  src="/img/modes/mode-taiko.png"
                                />
                                <img
                                  className={`skinMode ${
                                    skin.Modes.includes("osu!ctb")
                                      ? "active"
                                      : ""
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
                          {session && session?.id === userData.id && (
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
                                onClick={() => deleteSkinFromDB(skin.id)}
                              />
                            </div>
                          )}
                          <div className="buttons">
                            <CopyToClipboard
                              text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                              onCopy={showCopyAlert}
                            >
                              <FontAwesomeIcon
                                className="button"
                                icon={faShare}
                              />
                            </CopyToClipboard>
                            <FontAwesomeIcon
                              className="button"
                              icon={faDownload}
                              onClick={() => {
                                window.open(skin.URL, "_blank");
                                modifyDownloadCount(skin.Downloads, skin.id);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {skinsData.map((skin, index) => {
                  if (!skin.Tags.includes("current")) {
                    return (
                      <div
                        className="item"
                        key={index}
                        id={skin.id}
                        style={{
                          backgroundImage: `url('${skin.Banner}')`,
                        }}
                      >
                        {skin.Tags && (
                          <div className="tags">
                            {skin.Tags.includes("current") && (
                              <div className="tag current">Currently Using</div>
                            )}
                            {skin.Tags.includes("tournaments") && (
                              <div className="tag tournaments">
                                Using in Tournaments
                              </div>
                            )}
                            {skin.Tags.includes("casual") && (
                              <div className="tag casual">Casual</div>
                            )}
                            {skin.Tags.includes("old") && (
                              <div className="tag old">Old</div>
                            )}
                            {skin.Tags.includes("aim") && (
                              <div className="tag aim">Aim</div>
                            )}
                            {skin.Tags.includes("stream") && (
                              <div className="tag stream">Stream</div>
                            )}
                            {skin.Tags.includes("tech") && (
                              <div className="tag tech">Tech</div>
                            )}
                            {skin.Tags.includes("reading") && (
                              <div className="tag reading">Reading</div>
                            )}
                            {skin.Tags.includes("speed") && (
                              <div className="tag speed">Speed</div>
                            )}
                            {skin.Tags.includes("highAR") && (
                              <div className="tag highAR">HighAR</div>
                            )}
                            {skin.Tags.includes("lowAR") && (
                              <div className="tag lowAR">LowAR</div>
                            )}
                            {skin.Tags.includes("highCS") && (
                              <div className="tag highCS">HighCS</div>
                            )}
                            {skin.Tags.includes("lowCS") && (
                              <div className="tag lowCS">LowCS</div>
                            )}
                            {skin.Tags.includes("troll") && (
                              <div className="tag troll">Troll</div>
                            )}
                            {skin.Tags.includes("NM") && (
                              <div className="tag NM gridTag">NM</div>
                            )}
                            {skin.Tags.includes("HD") && (
                              <div className="tag HD gridTag">HD</div>
                            )}
                            {skin.Tags.includes("HR") && (
                              <div className="tag HR gridTag">HR</div>
                            )}
                            {skin.Tags.includes("DT") && (
                              <div className="tag DT gridTag">DT</div>
                            )}
                            {skin.Tags.includes("EZ") && (
                              <div className="tag EZ gridTag">EZ</div>
                            )}
                            {skin.Tags.includes("FL") && (
                              <div className="tag FL gridTag">FL</div>
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
                                    skin.Modes.includes("osu!mania")
                                      ? "active"
                                      : ""
                                  }`}
                                  src="/img/modes/mode-mania.png"
                                />
                                <img
                                  className={`skinMode ${
                                    skin.Modes.includes("osu!taiko")
                                      ? "active"
                                      : ""
                                  }`}
                                  src="/img/modes/mode-taiko.png"
                                />
                                <img
                                  className={`skinMode ${
                                    skin.Modes.includes("osu!ctb")
                                      ? "active"
                                      : ""
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
                          {session && session?.id === userData.id && (
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
                                onClick={() => deleteSkinFromDB(skin.id)}
                              />
                            </div>
                          )}
                          <div className="buttons">
                            <CopyToClipboard
                              text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                              onCopy={showCopyAlert}
                            >
                              <FontAwesomeIcon
                                className="button"
                                icon={faShare}
                              />
                            </CopyToClipboard>
                            <FontAwesomeIcon
                              className="button"
                              icon={faDownload}
                              onClick={() => {
                                window.open(skin.URL, "_blank");
                                modifyDownloadCount(skin.Downloads, skin.id);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {session && session?.id === userData.id && (
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
      {isLinkCopied && <AlertContainer />}
    </>
  );
}

export async function getServerSideProps(context) {
  // Get user session
  const session = await getSession(context);

  var statusData = await supabase
    .from("users")
    .select("id,username,badges,country,banner,skin_view,twitch")
    .eq("id", context.params.id);

  try {
    statusData.data[0].badges = JSON.parse(statusData.data[0].badges);
  } catch (error) {}

  try {
    statusData.data[0].country = JSON.parse(statusData.data[0].country);
  } catch (error) {}

  const skinsData =
    statusData.data !== null
      ? await supabase
          .from("skins")
          .select(
            "id,Name,Creator,Player(id,username),Banner,Modes,Tags,URL,Downloads"
          )
          .eq("Player(id)", context.params.id)
          .order("created_at", { ascending: false })
      : [{}];

  const returnProps =
    statusData.data === null || !statusData.data.length
      ? {
          redirect: {
            destination: "/",
            permanent: false,
          },
        }
      : {
          props: {
            session: session,
            userData: !statusData.data.length ? null : statusData.data[0],
            skinsData: !skinsData.data.length ? [] : skinsData.data,
          },
        };

  return { ...returnProps };
}
