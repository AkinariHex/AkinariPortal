"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileUpload, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Copy, Eye, EyeSlash } from "iconsax-react";
import moment from "moment/moment";
import ConnectionField from "@/components/ConnectionField/ConnectionField";
import LoadingIcon from "@/components/LoadingIcon/LoadingIcon";
import AlertContainer from "@/components/Alert/AlertContainer";
import {
  generateApiKey,
  destroyApiKey,
  saveSkinView as saveSkinViewAction,
  saveSocials,
  saveTablet,
} from "@/app/settings/actions";

moment.locale("en");

export default function SettingsClient({
  session,
  userData,
}: {
  session: any;
  userData: any;
}) {
  const router = useRouter();
  const data: any = userData ?? {};

  const [hideAPI, setHideAPI] = useState(true);
  const [apikey, setApikey] = useState(
    data.secret_key === null
      ? ""
      : data.secret_key === undefined
      ? ""
      : data.secret_key
  );

  const [tabletSettingsInfo, setTabletSettingsInfo] = useState<any>(
    data.tabletFileUploadInfo !== null && data.tabletFileUploadInfo !== undefined
      ? data.tabletFileUploadInfo
      : { file: "", date: "" }
  );
  const [tabletUploadError, setTabletUploadError] = useState(false);

  const [skinview, setSkinview] = useState<any>(data.skin_view);

  const [prevTwitchData, setPrevTwitchData] = useState(data.twitch);
  const [prevGithubData, setPrevGithubData] = useState(data.github);
  const [prevTwitterData, setPrevTwitterData] = useState(data.twitter);
  const [prevDiscordData, setPrevDiscordData] = useState(data.discord);
  const [prevYoutubeData, setPrevYoutubeData] = useState(data.youtube);

  const [twitchData, setTwitchData] = useState(data.twitch);
  const [githubData, setGithubData] = useState(data.github);
  const [twitterData, setTwitterData] = useState(data.twitter);
  const [discordData, setDiscordData] = useState(data.discord);
  const [youtubeData, setYoutubeData] = useState(data.youtube);

  const [hasSkinViewSaved, setHasSkinViewSaved] = useState(false);
  /* isSaving refer to Socials saving */
  const [isSaving, setIsSaving] = useState(false);

  const [typeOfCopy, setTypeOfCopy] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  function showCopyAlert(type: string) {
    setTypeOfCopy(type);
    setIsLinkCopied(true);
    setTimeout(() => {
      setIsLinkCopied(false);
    }, 5000);
  }

  const select_options = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
  ];

  const uploadTabletSettings = async (tabletFile: File) => {
    var reader = new FileReader();
    reader.onload = async function (e) {
      const dataNow = Date.now();
      const uploadInfo = {
        file: tabletFile.name,
        date: dataNow,
      };
      const jsonFile = JSON.parse(e.target!.result as string);
      const tabletName = jsonFile.Profiles[0].Tablet;
      // parse string to json
      setTabletSettingsInfo(uploadInfo);

      const result = await saveTablet({
        tablet: tabletName,
        tabletSettingsFile: jsonFile,
        tabletFileUploadInfo: uploadInfo,
      });

      setTabletUploadError(result.message !== "done");
      if (result.message === "done") router.refresh();
    };
    reader.readAsText(tabletFile);
  };

  const deleteTabletSettings = async () => {
    const result = await saveTablet({
      tablet: null,
      tabletSettingsFile: null,
      tabletFileUploadInfo: null,
    });

    if (result.message !== "done") return;

    setTabletSettingsInfo({ file: "", date: "" });
    router.refresh();
  };

  const saveSkinView = async (changedView: any) => {
    const result = await saveSkinViewAction(changedView);

    if (result.message === "done") {
      setHasSkinViewSaved(true);
      setTimeout(() => setHasSkinViewSaved(false), 5500);
      router.refresh();
    }
  };

  const saveConnectionsInputs = async () => {
    if (!isSaving) {
      setIsSaving(true);
      const result = await saveSocials({
        twitch: twitchData,
        github: githubData,
        twitter: twitterData,
        discord: discordData,
        youtube: youtubeData,
      });

      if (result.message === "done") {
        setPrevTwitchData(twitchData);
        setPrevGithubData(githubData);
        setPrevTwitterData(twitterData);
        setPrevDiscordData(discordData);
        setPrevYoutubeData(youtubeData);
        setIsSaving(false);
        router.refresh();
      } else {
        setIsSaving(false);
      }
    }
  };

  const resetConnectionsInputs = () => {
    setTwitchData(data.twitch);
    setGithubData(data.github);
    setTwitterData(data.twitter);
    setDiscordData(data.discord);
    setYoutubeData(data.youtube);
  };

  function copyToClipboard() {
    navigator.clipboard.writeText(apikey);
    showCopyAlert("secret_key");
  }

  async function createApikey() {
    const result = await generateApiKey();
    if (result.status === "success") {
      setApikey(result.secret_key);
    }
  }

  async function destroyApikey() {
    const result = await destroyApiKey();
    if (result.status === "success") {
      setApikey("You haven't generated any secret key!");
      setHideAPI(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="settingsPageContainer">
        <div className="settingsContainer">
          <div className="header">Settings</div>
          <div className="section" id="secretkey">
            <div className="title">Secret Key</div>
            <div className="field">
              <input
                type="text"
                placeholder="You haven't generated any secret key!"
                value={
                  apikey !== "" && hideAPI
                    ? "*********************************************"
                    : apikey
                }
                disabled
              />
              {apikey !== "" &&
              apikey !== "You haven't generated any secret key!" ? (
                hideAPI ? (
                  <>
                    <button
                      onClick={() =>
                        setHideAPI((prev) => (prev ? false : true))
                      }
                    >
                      <Eye size="18" color="#dadada" />
                    </button>
                    <button onClick={() => copyToClipboard()}>
                      <Copy size="18" color="#dadada" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setHideAPI((prev) => (prev ? false : true))
                      }
                    >
                      <EyeSlash size="18" color="#dadada" />
                    </button>
                    <button onClick={() => copyToClipboard()}>
                      <Copy size="18" color="#dadada" />
                    </button>
                  </>
                )
              ) : (
                ""
              )}
            </div>
            <div className="buttons">
              <button onClick={() => createApikey()}>Generate Apikey</button>
              <button onClick={() => destroyApikey()}>Destroy Apikey</button>
            </div>
          </div>
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
                onChange={(e) =>
                  e.target.files && uploadTabletSettings(e.target.files[0])
                }
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
      {isLinkCopied && <AlertContainer type={typeOfCopy} />}
    </>
  );
}
