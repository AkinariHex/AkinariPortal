import Head from "next/head";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Select from "react-select";
import ConnectionField from "../../components/ConnectionField/ConnectionField";
import LoadingIcon from "../../components/LoadingIcon/LoadingIcon";
import supabase from "../../config/supabaseClient";

export default function Settings({ session, userData }) {
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
          .select("skin_view,twitch,youtube,github,twitter,discord")
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
