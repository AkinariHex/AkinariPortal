"use client";

import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "sonner";
import {
  DiscordIcon,
  GithubIcon,
  OsuIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/SocialIcons/SocialIcons";
import { cn } from "@/lib/utils";

type Props = {
  user: any;
  className?: string;
};

// Hover uses the muted `-text` tints, not the raw brand colors: at icon size
// the saturated originals glare against the dark profile surfaces.
const LINKS: {
  key: string;
  field?: string;
  icon: React.ReactNode;
  href: (v: string) => string;
  hover: string;
}[] = [
  {
    key: "osu",
    // Not a stored social: the osu! profile is derived from the account id.
    field: "id",
    icon: <OsuIcon />,
    href: (v: string) => `https://osu.ppy.sh/users/${v}`,
    hover: "hover:text-social-osu-text",
  },
  {
    key: "twitch",
    icon: <TwitchIcon />,
    href: (v: string) => `https://twitch.tv/${v}`,
    hover: "hover:text-social-twitch-text",
  },
  {
    key: "twitter",
    icon: <TwitterIcon />,
    href: (v: string) => `https://twitter.com/${v}`,
    hover: "hover:text-social-twitter-text",
  },
  {
    key: "youtube",
    icon: <YoutubeIcon />,
    href: (v: string) => `https://youtube.com/${v}`,
    hover: "hover:text-social-youtube-text",
  },
  {
    key: "github",
    icon: <GithubIcon />,
    href: (v: string) => `https://github.com/${v}`,
    hover: "hover:text-social-github-text",
  },
];

// Social row shared by every profile layout, so a new social is added once.
export default function ProfileSocials({ user, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-row flex-wrap items-center gap-4 text-[#afbed1]",
        className
      )}
    >
      {LINKS.filter((link) => user[link.field ?? link.key]).map((link) => (
        <a
          key={link.key}
          href={link.href(user[link.field ?? link.key])}
          target="_blank"
          rel="noreferrer"
          aria-label={link.key}
          className={cn(
            "cursor-pointer transition-colors active:scale-95",
            link.hover
          )}
        >
          {link.icon}
        </a>
      ))}
      {user.discord && (
        <CopyToClipboard
          text={`${user.discord}`}
          onCopy={() => toast.success("Username copied")}
        >
          <button
            type="button"
            aria-label="discord"
            className="cursor-pointer transition-colors hover:text-social-discord-text active:scale-95"
          >
            <DiscordIcon />
          </button>
        </CopyToClipboard>
      )}
    </div>
  );
}
