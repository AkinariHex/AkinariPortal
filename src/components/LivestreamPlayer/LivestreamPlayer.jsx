import { useEffect, useRef, useState } from 'react';
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
  const checkedRef = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode's double effect invocation (dev), which
    // would otherwise fire the Twitch check twice.
    if (checkedRef.current) return;
    checkedRef.current = true;
    checkUserLivestream(twitchName, setIsUserLive);
  }, [twitchName]);

  return (
    <>
      {isUserLive && (
        <div
          id="livestream"
          className="flex w-full flex-col gap-3.5 box-border p-3.5 animate-in fade-in duration-500"
        >
          <div className="flex w-full flex-row">
            <div className="text-[1.4em] font-medium text-[#cee0f6]">
              Livestream
            </div>
          </div>
          <div className="overflow-hidden rounded-md">
            <ReactPlayer width="100%" src={`https://twitch.tv/${twitchName}`} />
          </div>
        </div>
      )}
    </>
  );
}

export default LivestreamPlayer;
