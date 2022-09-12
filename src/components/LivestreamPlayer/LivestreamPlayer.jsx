import { useEffect, useState } from "react";
import ReactPlayer from "react-player/twitch";

function LivestreamPlayer({ twitchName }) {
  const [isUserLive, setIsUserLive] = useState(false);

  async function generateToken(channel) {
    var response = await fetch("/api/twitch/generate");
    response = await response.json();

    if (response.message === "token created") {
      return checkUserLivestream(channel);
    }
  }

  async function checkUserLivestream(channel, setIsUserLive) {
    var checkResponse = await fetch(
      `/api/twitch/checklivestream?channel=${channel}&secret=${process.env.TWITCH_DB_SECRET}`
    );
    checkResponse = await checkResponse.json();
    if (!checkResponse.status === 401) {
      return generateToken(channel);
    }

    if (checkResponse.is_live === true) {
      setIsUserLive(true);
    }
  }

  useEffect(() => {
    checkUserLivestream(twitchName, setIsUserLive);
  }, []);

  return (
    <>
      {isUserLive && (
        <div
          className={`section ${isUserLive ? "live" : "notlive"}`}
          id="livestream"
        >
          <div className="header">
            <div className="title">Livestream</div>
          </div>
          <ReactPlayer
            className="twitchPlayer"
            width="100%"
            url={`https://twitch.tv/${twitchName}`}
          />
        </div>
      )}
    </>
  );
}

export default LivestreamPlayer;
