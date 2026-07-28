import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

async function checkUserLivestream(channel, setIsUserLive) {
  const response = await fetch(
    `/api/twitch/checklivestream?channel=${encodeURIComponent(channel)}`
  );
  const checkResponse = await response.json();

  if (checkResponse?.is_live === true) {
    setIsUserLive(true);
  }
}

function LivestreamPlayer({ twitchName }) {
  const [isUserLive, setIsUserLive] = useState(false);

  useEffect(() => {
    checkUserLivestream(twitchName, setIsUserLive);
  }, []);

  return (
    <>
      {isUserLive && (
        <div
          className={`section ${isUserLive ? 'live' : 'notlive'}`}
          id="livestream"
        >
          <div className="header">
            <div className="title">Livestream</div>
          </div>
          <ReactPlayer
            className="twitchPlayer"
            width="100%"
            src={`https://twitch.tv/${twitchName}`}
          />
        </div>
      )}
    </>
  );
}

export default LivestreamPlayer;
