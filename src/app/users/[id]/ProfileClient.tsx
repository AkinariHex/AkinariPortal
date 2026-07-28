"use client";

import {
  faDownload,
  faGrip,
  faGripLines,
  faPen,
  faShare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import jsDownload from "js-file-download";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Tooltip } from "react-tooltip";
import AlertContainer from "@/components/Alert/AlertContainer";
import LivestreamPlayer from "@/components/LivestreamPlayer/LivestreamPlayer";
import Modal from "@/components/Modal/Modal";
import PlaystyleSection from "@/components/PlaystyleSection/PlaystyleSection";
import { deleteSkin, incrementDownload } from "./actions";

interface ProfileClientProps {
  userData: any;
  skinsData: any[];
  isOwner: boolean;
  sessionId: string | null;
}

export default function ProfileClient({
  userData,
  skinsData,
  isOwner,
  sessionId,
}: ProfileClientProps) {
  const router = useRouter();

  const [skinView, setSkinView] = useState(userData.skin_view.value);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalSkinEdit, setModalSkinEdit] = useState<any>();

  const [typeOfCopy, setTypeOfCopy] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  function showCopyAlert(type: string) {
    setTypeOfCopy(type);
    setIsLinkCopied(true);
    setTimeout(() => {
      setIsLinkCopied(false);
    }, 5000);
  }

  function handleDownload(skin: any) {
    void incrementDownload(skin.id);
    window.open(skin.URL, "_blank");
  }

  async function handleDelete(id: any) {
    const res = await deleteSkin(id);
    if (res.status === "done") router.refresh();
  }

  return (
    <>
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
                    userData.badges.map((badge: any, index: number) => {
                      return (
                        <img
                          key={index}
                          data-tooltip-id="badge-tip"
                          data-tooltip-content={badge.title}
                          className="badge"
                          src={`/img/badges/${badge.id}.webp`}
                          alt={badge.title}
                        />
                      );
                    })}
                  {userData.badges.length !== 0 && (
                    <Tooltip
                      id="badge-tip"
                      place="top"
                      className="badgeTooltip"
                      delayShow={300}
                      delayHide={0}
                    />
                  )}
                </div>
                <div className="socials">
                  {userData.twitch !== null && userData.twitch !== "" && (
                    <div className="social" id="twitch">
                      <i
                        className="bx bxl-twitch"
                        onClick={() =>
                          window.open(
                            `https://twitch.tv/${userData.twitch}`,
                            "_blank"
                          )
                        }
                      ></i>
                    </div>
                  )}
                  {userData.twitter !== null && userData.twitter !== "" && (
                    <div className="social" id="twitter">
                      <i
                        className="bx bxl-twitter"
                        onClick={() =>
                          window.open(
                            `https://twitter.com/${userData.twitter}`,
                            "_blank"
                          )
                        }
                      ></i>
                    </div>
                  )}
                  {userData.youtube !== null && userData.youtube !== "" && (
                    <div className="social" id="youtube">
                      <i
                        className="bx bxl-youtube"
                        onClick={() =>
                          window.open(
                            `https://youtube.com/${userData.youtube}`,
                            "_blank"
                          )
                        }
                      ></i>
                    </div>
                  )}
                  {userData.github !== null && userData.github !== "" && (
                    <div className="social" id="github">
                      <i
                        className="bx bxl-github"
                        onClick={() =>
                          window.open(
                            `https://github.com/${userData.github}`,
                            "_blank"
                          )
                        }
                      ></i>
                    </div>
                  )}
                  {userData.discord !== null && userData.discord !== "" && (
                    <div className="social" id="discord">
                      <CopyToClipboard
                        text={`${userData.discord}`}
                        onCopy={() => showCopyAlert("discordID")}
                      >
                        <i className="bx bxl-discord-alt"></i>
                      </CopyToClipboard>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {userData.twitch !== null && (
            <LivestreamPlayer twitchName={userData.twitch} />
          )}
          {userData.tablet &&
            userData.tabletSettingsFile &&
            userData.tabletFileUploadInfo && (
              <div className="section" id="tabletarea">
                <div className="header">
                  <div className="title">Tablet Area</div>
                  {sessionId && (
                    <div
                      className="downloadTabletSettingsBTN"
                      onClick={() =>
                        jsDownload(
                          JSON.stringify(userData.tabletSettingsFile),
                          userData.tabletFileUploadInfo.file
                        )
                      }
                    >
                      <FontAwesomeIcon icon={faDownload} /> Download Settings
                    </div>
                  )}
                </div>
                <PlaystyleSection
                  tabletInfo={userData.tablet}
                  tabletSettings={userData.tabletSettingsFile}
                />
              </div>
            )}
          <div className="section" id="skins">
            <div className="header">
              <div className="title">Skins</div>
              <div className="styles">
                <FontAwesomeIcon
                  className={`viewStyle ${skinView === "list" && "active"}`}
                  id="list"
                  icon={faGripLines}
                  data-tooltip-id="viewstyle-tip"
                  data-tooltip-content="List View"
                  width={"13.2pt"}
                  onClick={() => setSkinView("list")}
                />
                <FontAwesomeIcon
                  className={`viewStyle ${skinView === "grid" && "active"}`}
                  id="grid"
                  icon={faGrip}
                  data-tooltip-id="viewstyle-tip"
                  data-tooltip-content="Grid View"
                  width={"13.2pt"}
                  onClick={() => setSkinView("grid")}
                />
                <Tooltip
                  id="viewstyle-tip"
                  place="top"
                  className="viewStyleTooltip"
                  delayShow={300}
                />
              </div>
            </div>
            {skinView === "list" ? (
              <div className="list">
                {skinsData.map((skin: any, index: number) => {
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
                                {skin.Tags.includes("lazer") && (
                                  <div className="tag lazer">Lazer</div>
                                )}
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
                        {isOwner && (
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
                              onClick={() => handleDelete(skin.id)}
                            />
                          </div>
                        )}
                        <div className="buttons">
                          <CopyToClipboard
                            text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                            onCopy={() => showCopyAlert("skinLink")}
                          >
                            <FontAwesomeIcon className="button" icon={faShare} />
                          </CopyToClipboard>
                          <FontAwesomeIcon
                            className="button"
                            icon={faDownload}
                            onClick={() => handleDownload(skin)}
                          />
                        </div>
                      </div>
                    );
                  }
                })}
                {skinsData.map((skin: any, index: number) => {
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
                                {skin.Tags.includes("lazer") && (
                                  <div className="tag lazer">Lazer</div>
                                )}
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
                        {isOwner && (
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
                              onClick={() => handleDelete(skin.id)}
                            />
                          </div>
                        )}
                        <div className="buttons">
                          <CopyToClipboard
                            text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                            onCopy={() => showCopyAlert("skinLink")}
                          >
                            <FontAwesomeIcon className="button" icon={faShare} />
                          </CopyToClipboard>
                          <FontAwesomeIcon
                            className="button"
                            icon={faDownload}
                            onClick={() => handleDownload(skin)}
                          />
                        </div>
                      </div>
                    );
                  }
                })}
                {isOwner && (
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
                {skinsData.map((skin: any, index: number) => {
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
                            {skin.Tags.includes("lazer") && (
                              <div className="tag lazer gridTag">Lazer</div>
                            )}
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
                          {isOwner && (
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
                                onClick={() => handleDelete(skin.id)}
                              />
                            </div>
                          )}
                          <div className="buttons">
                            <CopyToClipboard
                              text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                              onCopy={() => showCopyAlert("skinLink")}
                            >
                              <FontAwesomeIcon
                                className="button"
                                icon={faShare}
                              />
                            </CopyToClipboard>
                            <FontAwesomeIcon
                              className="button"
                              icon={faDownload}
                              onClick={() => handleDownload(skin)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {skinsData.map((skin: any, index: number) => {
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
                            {skin.Tags.includes("lazer") && (
                              <div className="tag lazer gridTag">Lazer</div>
                            )}
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
                          {isOwner && (
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
                                onClick={() => handleDelete(skin.id)}
                              />
                            </div>
                          )}
                          <div className="buttons">
                            <CopyToClipboard
                              text={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skin.id}`}
                              onCopy={() => showCopyAlert("skinLink")}
                            >
                              <FontAwesomeIcon
                                className="button"
                                icon={faShare}
                              />
                            </CopyToClipboard>
                            <FontAwesomeIcon
                              className="button"
                              icon={faDownload}
                              onClick={() => handleDownload(skin)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {isOwner && (
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
            sessionUser={sessionId}
          />
        )}
      </div>
      {isLinkCopied && <AlertContainer type={typeOfCopy} />}
    </>
  );
}
