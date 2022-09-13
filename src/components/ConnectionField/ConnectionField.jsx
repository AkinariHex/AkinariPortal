import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";

function ConnectionField({
  social,
  name,
  id,
  inputValue,
  setInputValue,
  readOnly,
}) {
  const socials = {
    discord: {
      icon: "/img/socials/discord_logo.svg",
      placeholder: "Username",
      tooltip:
        "Your username is your account name with your # id:<br><span style='color: #939cff; font-weight: 600' >Akinari#3171</span><br><img src='https://akinariosu.s-ul.eu/6Q6GKi9c' alt='discord help' />",
    },
    twitch: {
      icon: "/img/socials/twitch_logo.svg",
      placeholder: "Channel Name",
      tooltip:
        "You can find your channel name at the end of the url:<br><span style='color: #ccc' >https://twitch.tv/</span><span style='color: #c497ff; font-weight: 600' >test_channel</span>",
    },
    twitter: {
      icon: "/img/socials/twitter_logo.png",
      placeholder: "Profile Tag",
      tooltip:
        "You can find your profile tag at the end of the url:<br><span style='color: #ccc' >https://twitter.com/</span><span style='color: #57bbfd; font-weight: 600' >test_profile</span>",
    },
    github: {
      icon: "/img/socials/github_logo.png",
      placeholder: "Profile Name",
      tooltip:
        "You can find your profile name at the end of the url:<br><span style='color: #ccc' >https://github.com/</span><span style='color: #3c3838; font-weight: 600' >test_profile</span>",
    },
    youtube: {
      icon: "/img/socials/youtube_square_red.png",
      placeholder: "Channel Name",
      tooltip:
        "You can find your channel name at the end of the url:<br><span style='color: #ccc' >https://youtube.com/</span><span style='color: #ff3b3b; font-weight: 600'>channel/name_channel</span> or<br><span style='color: #ccc' >https://youtube.com/</span><span style='color: #ff3b3b; font-weight: 600' >c/name_channel</span>",
    },
  };

  return (
    <div className={`socialField ${social}`}>
      <div className={`icon ${social}`}>
        <img src={socials[social].icon} alt={`${social} logo`} />
      </div>
      <input
        type="text"
        name={name}
        id={id}
        value={inputValue}
        placeholder={socials[social].placeholder}
        onChange={(e) => {
          e.preventDefault();
          setInputValue(e.target.value);
        }}
        readOnly={readOnly}
      />
      <div className="about">
        <FontAwesomeIcon
          icon={faInfoCircle}
          data-html={true}
          data-tip={socials[social].tooltip}
        />
        <ReactTooltip
          place="right"
          effect="solid"
          className="viewStyleTooltip"
          delayShow={100}
          arrowColor={"var(--site-background-users-page-color)"}
        />
      </div>
    </div>
  );
}

export default ConnectionField;
