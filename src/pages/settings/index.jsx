import Head from "next/head";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileUpload, faXmark } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
import ConnectionField from "../../components/ConnectionField/ConnectionField";
import LoadingIcon from "../../components/LoadingIcon/LoadingIcon";
import moment from "moment/moment";
import supabase from "../../config/supabaseClient";

moment.locale("en");

export default function Settings({ session, userData }) {
  const [tabletSettingsInfo, setTabletSettingsInfo] = useState(
    userData.tabletFileUploadInfo !== null
      ? userData.tabletFileUploadInfo
      : { file: "", date: "" }
  );
  const [tabletUploadError, setTabletUploadError] = useState(false);

  const [skinview, setSkinview] = useState(userData.skin_view);

  const [prevTwitchData, setPrevTwitchData] = useState(userData.twitch);
  const [prevGithubData, setPrevGithubData] = useState(userData.github);
  const [prevTwitterData, setPrevTwitterData] = useState(userData.twitter);
  const [prevDiscordData, setPrevDiscordData] = useState(userData.discord);
  const [prevYoutubeData, setPrevYoutubeData] = useState(userData.youtube);

  const [twitchData, setTwitchData] = useState(userData.twitch);
  const [githubData, setGithubData] = useState(userData.github);
  const [twitterData, setTwitterData] = useState(userData.twitter);
  const [discordData, setDiscordData] = useState(userData.discord);
  const [youtubeData, setYoutubeData] = useState(userData.youtube);

  const [hasSkinViewSaved, setHasSkinViewSaved] = useState(false);
  /* isSaving refer to Socials saving */
  const [isSaving, setIsSaving] = useState(false);

  const select_options = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
  ];

  const uploadTabletSettings = async (tabletFile) => {
    var reader = new FileReader();
    reader.onload = async function (e) {
      const dataNow = Date.now();
      const uploadInfo = {
        file: tabletFile.name,
        date: dataNow,
      };
      const jsonFile = JSON.parse(e.target.result);
      const tabletName = jsonFile.Profiles[0].Tablet;
      // parse string to json
      setTabletSettingsInfo(uploadInfo);

      const { data, error } = await supabase
        .from("users")
        .update({
          tablet: tabletName,
          tabletSettingsFile: jsonFile,
          tabletFileUploadInfo: uploadInfo,
        })
        .eq("id", session.id);

      if (error) {
        setTabletUploadError(true);
      } else {
        setTabletUploadError(false);
      }
    };
    reader.readAsText(tabletFile);
  };

  const deleteTabletSettings = async () => {
    const { data, error } = await supabase
      .from("users")
      .update({
        tablet: null,
        tabletSettingsFile: null,
        tabletFileUploadInfo: null,
      })
      .eq("id", session.id);

    if (error) return;

    setTabletSettingsInfo({ file: "", date: "" });
  };

  const saveSkinView = async (changedView) => {
    const saving = {
      skin_view: changedView,
    };
    var data = await fetch("/api/settings/save?m=skinview", {
      method: "POST",
      body: JSON.stringify(saving),
    });

    data = await data.json();

    if (data.message === "done") {
      setHasSkinViewSaved(true);
      setTimeout(() => setHasSkinViewSaved(false), 5500);
    }
  };

  const saveConnectionsInputs = async () => {
    if (!isSaving) {
      setIsSaving(true);
      const connections = {
        twitch: twitchData,
        github: githubData,
        twitter: twitterData,
        discord: discordData,
        youtube: youtubeData,
      };
      var data = await fetch("/api/settings/save?m=socials", {
        method: "POST",
        body: JSON.stringify(connections),
      });

      data = await data.json();

      if (data.message === "done") {
        setPrevTwitchData(twitchData);
        setPrevGithubData(githubData);
        setPrevTwitterData(twitterData);
        setPrevDiscordData(discordData);
        setPrevYoutubeData(youtubeData);
        setIsSaving(false);
      }
    }
  };

  const resetConnectionsInputs = () => {
    setTwitchData(userData.twitch);
    setGithubData(userData.github);
    setTwitterData(userData.twitter);
    setDiscordData(userData.discord);
    setYoutubeData(userData.youtube);
  };

  return (
    <>
      <Head>
        <title>Settings | Akinari Portal</title>
      </Head>
      <div className="settingsPageContainer">
        <div className="settingsContainer">
          <div className="header">Settings</div>
          <div className="section" id="tabletSettings">
            <div className="title">
              Tablet Settings <span className="betaSection">BETA</span>
            </div>
            <div className="fileInfo">
              <div
                className={`currentFile ${tabletUploadError ? "error" : ""}`}
              >
                <span id="tabletSettingsName">
                  {tabletSettingsInfo.file === ""
                    ? "No settings uploaded"
                    : tabletSettingsInfo.file}
                </span>
                {tabletSettingsInfo.date && (
                  <span id="uploadDate">
                    {moment(tabletSettingsInfo.date).format(
                      "DD MMM YYYY, kk:mm"
                    )}
                  </span>
                )}
              </div>
              {tabletSettingsInfo.file !== "" &&
                tabletSettingsInfo.date !== "" && (
                  <div
                    className="deleteTabletSettings"
                    data-tip={"Delete Tablet Settings"}
                    onClick={() => deleteTabletSettings()}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </div>
                )}
            </div>
            <div className="tabletUploadBTN">
              <FontAwesomeIcon icon={faFileUpload} /> Import Tablet Settings
              <input
                type="file"
                name="tabletSettingsJSON"
                id="tabletSettingsJSON"
                onChange={(e) => uploadTabletSettings(e.target.files[0])}
              />
            </div>
            <div className="subtitle">
              Show on your profile the tablet area you are currently using!
              Upload the exported .json file.
              <br />
              It supports only the .json file made by{" "}
              <a href="https://opentabletdriver.net/" target={"_blank"}>
                OpenTabletDriver
              </a>
              .{" "}
              <span
                data-tip={`
                <div class="exportExample">
                <span>To export the settings on OpenTabletDriver go to<br /><b>File</b> > <b>Save settings as...</b></span>
                <img src="https://akinariosu.s-ul.eu/KUl8xGrI" />
                </div>
                `}
                data-html={true}
              >
                How to export the tablet settings?
              </span>
            </div>
          </div>
          <div className="section" id="skinview">
            <div className="main">
              <div className="title">Skin View</div>
              <Select
                classNamePrefix="react-select"
                className={`react-select ${hasSkinViewSaved ? "saved" : ""}`}
                options={select_options}
                value={skinview}
                onChange={(e) => {
                  setSkinview(e);
                  saveSkinView(e);
                }}
              />
            </div>
            <div className="subtitle">
              Default view for skins of your userpage
            </div>
          </div>
          <div className="section" id="connections">
            <div className="title">Socials</div>
            <ConnectionField
              name="twitch_connection"
              id="twitch_connection"
              social={"twitch"}
              inputValue={twitchData}
              setInputValue={setTwitchData}
              readOnly={isSaving ? true : false}
            />
            <ConnectionField
              name="twitter_connection"
              id="twitter_connection"
              social={"twitter"}
              inputValue={twitterData}
              setInputValue={setTwitterData}
              readOnly={isSaving ? true : false}
            />
            <ConnectionField
              name="youtube_connection"
              id="youtube_connection"
              social={"youtube"}
              inputValue={youtubeData}
              setInputValue={setYoutubeData}
              readOnly={isSaving ? true : false}
            />
            <ConnectionField
              name="github_connection"
              id="github_connection"
              social={"github"}
              inputValue={githubData}
              setInputValue={setGithubData}
              readOnly={isSaving ? true : false}
            />
            <ConnectionField
              name="discord_connection"
              id="discord_connection"
              social={"discord"}
              inputValue={discordData}
              setInputValue={setDiscordData}
              readOnly={isSaving ? true : false}
            />
            <div
              className={`connections-btns ${
                twitchData !== prevTwitchData ||
                twitterData !== prevTwitterData ||
                youtubeData !== prevYoutubeData ||
                discordData !== prevDiscordData ||
                githubData !== prevGithubData
                  ? "_active"
                  : ""
              }`}
            >
              <div className="save-btn" onClick={saveConnectionsInputs}>
                {isSaving ? <LoadingIcon /> : "Save Socials"}
              </div>
              <div
                className={`reset-btn ${isSaving ? "_disable" : ""}`}
                onClick={resetConnectionsInputs}
              >
                Reset Socials
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  // Get user session
  const session = await getSession(context);

  var statusData =
    session !== null
      ? await supabase
          .from("users")
          .select(
            "skin_view,twitch,youtube,github,twitter,discord,tabletSettingsFile,tabletFileUploadInfo"
          )
          .eq("id", session.id)
      : [{}];

  const returnProps =
    session === null
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
          },
        };

  return { ...returnProps };
}
