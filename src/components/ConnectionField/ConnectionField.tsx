"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ConnectionFieldProps = {
  social: string;
  name: string;
  id: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  readOnly: boolean;
};

type SocialConfig = {
  icon: string;
  placeholder: string;
  accent: string;
  row: string;
  box: string;
  field: string;
  tooltip: ReactNode;
};

const socials: Record<string, SocialConfig> = {
  discord: {
    icon: "/img/socials/discord_logo.svg",
    placeholder: "Username",
    accent: "text-social-discord-text",
    row: "bg-social-discord/10 border border-social-discord/30",
    box: "border border-social-discord/40 bg-social-discord/20",
    field: "border-social-discord/20",
    tooltip: (
      <div className="flex flex-col gap-2">
        <span>
          Your username is your account name with your # id:
          <br />
          <span className="font-semibold text-social-discord-text">
            Akinari#3171
          </span>
        </span>
        <img
          src="https://akinariosu.s-ul.eu/6Q6GKi9c"
          alt="discord help"
          className="max-w-full rounded"
        />
      </div>
    ),
  },
  twitch: {
    icon: "/img/socials/twitch_logo.svg",
    placeholder: "Channel Name",
    accent: "text-social-twitch-text",
    row: "bg-social-twitch/10 border border-social-twitch/30",
    box: "border border-social-twitch/40 bg-social-twitch/20",
    field: "border-social-twitch/20",
    tooltip: (
      <span>
        You can find your channel name at the end of the url:
        <br />
        <span className="text-muted-foreground">https://twitch.tv/</span>
        <span className="font-semibold text-social-twitch-text">
          test_channel
        </span>
      </span>
    ),
  },
  twitter: {
    icon: "/img/socials/twitter_logo.png",
    placeholder: "Profile Tag",
    accent: "text-social-twitter-text",
    row: "bg-social-twitter/10 border border-social-twitter/30",
    box: "border border-social-twitter/40 bg-social-twitter/20",
    field: "border-social-twitter/20",
    tooltip: (
      <span>
        You can find your profile tag at the end of the url:
        <br />
        <span className="text-muted-foreground">https://twitter.com/</span>
        <span className="font-semibold text-social-twitter-text">
          test_profile
        </span>
      </span>
    ),
  },
  github: {
    icon: "/img/socials/github_logo.png",
    placeholder: "Profile Name",
    accent: "text-social-github-text",
    row: "bg-social-github-text/10 border border-social-github-text/30",
    box: "border border-social-github-text/40 bg-social-github-text/20",
    field: "border-social-github-text/20",
    tooltip: (
      <span>
        You can find your profile name at the end of the url:
        <br />
        <span className="text-muted-foreground">https://github.com/</span>
        <span className="font-semibold text-social-github-text">
          test_profile
        </span>
      </span>
    ),
  },
  youtube: {
    icon: "/img/socials/youtube_square_red.png",
    placeholder: "Channel Name",
    accent: "text-social-youtube-text",
    row: "bg-social-youtube/10 border border-social-youtube/30",
    box: "border border-social-youtube/40 bg-social-youtube/20",
    field: "border-social-youtube/20",
    tooltip: (
      <span>
        You can find your channel name at the end of the url:
        <br />
        <span className="text-muted-foreground">https://youtube.com/</span>
        <span className="font-semibold text-social-youtube-text">
          channel/name_channel
        </span>{" "}
        or
        <br />
        <span className="text-muted-foreground">https://youtube.com/</span>
        <span className="font-semibold text-social-youtube-text">
          c/name_channel
        </span>
      </span>
    ),
  },
};

function ConnectionField({
  social,
  name,
  id,
  inputValue,
  setInputValue,
  readOnly,
}: ConnectionFieldProps) {
  const config = socials[social];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-2",
        config.row
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md p-2",
          config.box
        )}
      >
        <img
          src={config.icon}
          alt={`${social} logo`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <Input
        type="text"
        name={name}
        id={id}
        value={inputValue ?? ""}
        placeholder={config.placeholder}
        onChange={(e) => {
          e.preventDefault();
          setInputValue(e.target.value);
        }}
        readOnly={readOnly}
        className={cn("flex-1 bg-transparent shadow-none", config.field)}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${social} help`}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-site-secondary",
              config.accent
            )}
          >
            <Info size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default ConnectionField;
