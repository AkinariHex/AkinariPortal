"use client";

import jsDownload from "js-file-download";
import { Download, LayoutGrid, List, Pencil, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "sonner";
import KeyboardView from "@/components/KeyboardView/KeyboardView";
import LivestreamPlayer from "@/components/LivestreamPlayer/LivestreamPlayer";
import Modal from "@/components/Modal/Modal";
import PlaystyleSection from "@/components/PlaystyleSection/PlaystyleSection";
import SkinModes from "@/components/SkinModes/SkinModes";
import SkinTags from "@/components/SkinTags/SkinTags";
import {
  DiscordIcon,
  GithubIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/SocialIcons/SocialIcons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { deleteSkin, incrementDownload } from "./actions";

interface ProfileClientProps {
  userData: any;
  skinsData: any[];
  isOwner: boolean;
  sessionId: string | null;
}

const ACTION_BTN =
  "flex flex-1 w-full items-center justify-center cursor-pointer outline-none transition-colors";

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

  function handleDownload(skin: any) {
    void incrementDownload(skin.id);
    window.open(skin.URL, "_blank");
  }

  async function handleDelete(id: any) {
    const res = await deleteSkin(id);
    if (res.status === "done") router.refresh();
  }

  function openEdit(skin: any) {
    setModalIsOpen(true);
    setModalSkinEdit(skin);
  }

  const shareText = (skinId: any) =>
    `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skinId}`;

  const socials = [
    userData.twitch && {
      key: "twitch",
      icon: <TwitchIcon />,
      onClick: () => window.open(`https://twitch.tv/${userData.twitch}`, "_blank"),
      hover: "hover:text-social-twitch",
    },
    userData.twitter && {
      key: "twitter",
      icon: <TwitterIcon />,
      onClick: () =>
        window.open(`https://twitter.com/${userData.twitter}`, "_blank"),
      hover: "hover:text-social-twitter",
    },
    userData.youtube && {
      key: "youtube",
      icon: <YoutubeIcon />,
      onClick: () =>
        window.open(`https://youtube.com/${userData.youtube}`, "_blank"),
      hover: "hover:text-social-youtube",
    },
    userData.github && {
      key: "github",
      icon: <GithubIcon />,
      onClick: () =>
        window.open(`https://github.com/${userData.github}`, "_blank"),
      hover: "hover:text-social-github-text",
    },
  ].filter(Boolean) as {
    key: string;
    icon: ReactNode;
    onClick: () => void;
    hover: string;
  }[];

  function renderListItem(skin: any) {
    return (
      <div
        key={skin.id}
        id={skin.id}
        className="group flex min-h-[60px] w-full flex-row rounded-md bg-site-primary box-border target:[outline:2px_solid_#6ba2ed]"
      >
        <div className="flex w-full flex-col items-start justify-end px-1.5 py-1">
          <div className="mb-px ml-px flex select-none flex-row flex-wrap items-center gap-x-[5px]">
            <span className="text-[13pt] font-medium text-accent-blue">
              {skin.Name}
            </span>
            <span className="pt-[3px] text-[9.6pt] font-normal text-[#cee0f6]">
              by {skin.Creator}
            </span>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-1">
            <SkinModes modes={skin.Modes} />
            <div className="flex select-none flex-row items-center gap-1 text-[10pt] font-normal tabular-nums text-[#cee0f6]">
              <Download className="size-[18px]" />
              {skin.Downloads}
            </div>
            <SkinTags tags={skin.Tags} />
          </div>
        </div>
        {isOwner && (
          <div className="my-0.5 flex w-[30px] flex-col items-center justify-evenly rounded-l-md bg-site-secondary text-[#a9b8ca] shadow-[-2px_0_3px_0_rgba(0,0,0,0.05)]">
            <button
              type="button"
              aria-label="Edit skin"
              className={ACTION_BTN}
              onClick={() => openEdit(skin)}
            >
              <Pencil className="size-3 text-[#fee7ad] transition-transform active:scale-95" />
            </button>
            <button
              type="button"
              aria-label="Delete skin"
              className={ACTION_BTN}
              onClick={() => handleDelete(skin.id)}
            >
              <Trash2 className="size-3 text-[#ffb2b2] transition-transform active:scale-95" />
            </button>
          </div>
        )}
        <div className="flex w-8 flex-col items-center justify-evenly rounded-md bg-[#414a55] text-[#a9b8ca] shadow-[-2px_0_3px_0_rgba(0,0,0,0.05)]">
          <CopyToClipboard
            text={shareText(skin.id)}
            onCopy={() => toast.success("Link copied")}
          >
            <button type="button" aria-label="Share skin" className={ACTION_BTN}>
              <Share2 className="size-3 transition-colors hover:text-[#cee0f6]" />
            </button>
          </CopyToClipboard>
          <button
            type="button"
            aria-label="Download skin"
            className={ACTION_BTN}
            onClick={() => handleDownload(skin)}
          >
            <Download className="size-3 transition-colors hover:text-[#cee0f6]" />
          </button>
        </div>
      </div>
    );
  }

  function renderGridItem(skin: any) {
    const barBase =
      "flex flex-row items-center justify-evenly h-0 overflow-hidden text-[#a9b8ca] transition-[height] duration-[400ms] ease-in group-hover:h-6 group-hover:ease-out";
    const barIcon =
      "size-3 opacity-0 transition-opacity duration-200 ease-in group-hover:opacity-100 group-hover:delay-150 group-hover:duration-[400ms] group-hover:ease-out";

    return (
      <div
        key={skin.id}
        id={skin.id}
        className="group relative flex h-[14em] w-[18.8em] flex-col justify-end rounded-md bg-cover bg-center box-border target:[outline:2px_solid_#6ba2ed] max-[450px]:w-full"
        style={{ backgroundImage: `url('${skin.Banner}')` }}
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-md bg-black/60"
        />
        <SkinTags
          tags={skin.Tags}
          grid
          className="relative z-[1] mb-auto w-full p-[3px]"
        />
        <div className="relative z-[1] flex flex-col rounded-md bg-[hsla(213,17%,24%,0.5)] backdrop-blur-[3px]">
          <div className="flex flex-col">
            <div className="flex select-none flex-col items-center [text-shadow:0_0_6px_#222]">
              <span className="py-1 text-center text-[13pt] font-medium leading-[15pt] text-accent-blue">
                {skin.Name}
              </span>
              <span className="-mt-1 text-center text-[9.6pt] font-normal text-[#cee0f6]">
                by {skin.Creator}
              </span>
            </div>
            <div className="flex flex-row flex-wrap justify-between p-[5px]">
              <SkinModes modes={skin.Modes} />
              <div className="flex select-none flex-row items-center gap-1 text-[10pt] font-normal tabular-nums text-[#cee0f6]">
                {skin.Downloads}
                <Download className="size-[18px]" />
              </div>
            </div>
          </div>
          {isOwner && (
            <div
              className={cn(
                barBase,
                "mx-1.5 rounded-t-md bg-site-secondary shadow-[0_-2px_3px_0_rgba(0,0,0,0.05)]"
              )}
            >
              <button
                type="button"
                aria-label="Edit skin"
                className={ACTION_BTN}
                onClick={() => openEdit(skin)}
              >
                <Pencil className={cn(barIcon, "text-[#fee7ad]")} />
              </button>
              <button
                type="button"
                aria-label="Delete skin"
                className={ACTION_BTN}
                onClick={() => handleDelete(skin.id)}
              >
                <Trash2 className={cn(barIcon, "text-[#ffb2b2]")} />
              </button>
            </div>
          )}
          <div
            className={cn(
              barBase,
              "rounded-md bg-[#414a55] shadow-[0_-2px_3px_0_rgba(0,0,0,0.05)]"
            )}
          >
            <CopyToClipboard
              text={shareText(skin.id)}
              onCopy={() => toast.success("Link copied")}
            >
              <button
                type="button"
                aria-label="Share skin"
                className={ACTION_BTN}
              >
                <Share2 className={cn(barIcon, "hover:text-[#cee0f6]")} />
              </button>
            </CopyToClipboard>
            <button
              type="button"
              aria-label="Download skin"
              className={ACTION_BTN}
              onClick={() => handleDownload(skin)}
            >
              <Download className={cn(barIcon, "hover:text-[#cee0f6]")} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-site-users box-border px-2.5 -mt-[4.2em] pt-[4.2em] pb-2.5">
        <div className="my-[50px] w-[60em] bg-site-secondary box-border rounded-[20px] max-[1100px]:w-[90vw] max-[450px]:my-5 max-[450px]:w-screen">
          {/* HERO */}
          <div className="flex flex-row flex-wrap rounded-t-[20px]">
            <div
              className="h-[12em] w-full rounded-t-[20px] border-b-2 border-accent-blue bg-cover bg-center"
              style={{ backgroundImage: `url(${userData.banner})` }}
            >
              <div className="h-full w-full rounded-t-[20px] bg-black/50 backdrop-blur-[0.6px]" />
            </div>
            <div className="flex w-full flex-col bg-site-primary shadow-[0_1px_6px_0_rgba(0,0,0,0.1)]">
              <div className="flex w-full flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://s.ppy.sh/a/${userData.id}`}
                  alt={`${userData.username}'s propic`}
                  className="z-[2] -mt-[4.6em] size-[6em] rounded-full border-2 border-accent-blue outline outline-1 outline-white/10 isolate"
                />
                <div className="flex flex-col items-center text-[#cee0f6]">
                  <div className="text-[20pt] font-medium [text-shadow:0_0_4px_rgba(0,0,0,0.2)]">
                    {userData.username}
                  </div>
                  <div className="-mt-1 flex flex-row items-center gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://raw.githubusercontent.com/ppy/osu-resources/master/osu.Game.Resources/Textures/Flags/${userData.country?.code}.png`}
                      alt={userData.country?.name}
                      className="h-5 rounded-[2px] outline outline-1 outline-white/10"
                    />
                    <span className="text-[11.5pt] font-normal">
                      {userData.country?.name}
                    </span>
                  </div>
                </div>

                {userData.badges.length !== 0 && (
                  <div className="my-2.5 flex flex-row flex-wrap items-center justify-center gap-1.5">
                    {userData.badges.map((badge: any, index: number) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/img/badges/${badge.id}.webp`}
                            alt={badge.title}
                            className="block h-[42px] w-auto max-w-none shrink-0 rounded-[4px] object-contain shadow-[0_0_0_1px_rgba(0,0,0,0.05)] outline outline-1 outline-white/10 transition-transform duration-150 will-change-transform hover:-translate-y-0.5"
                          />
                        </TooltipTrigger>
                        <TooltipContent>{badge.title}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}

                <div className="flex h-7 w-full flex-row flex-wrap items-center justify-center gap-3.5 bg-[linear-gradient(0deg,#2e3640,transparent_80%)] text-[#afbed1]">
                  {socials.map((social) => (
                    <button
                      key={social.key}
                      type="button"
                      aria-label={social.key}
                      onClick={social.onClick}
                      className={cn(
                        "cursor-pointer transition-colors active:scale-95",
                        social.hover
                      )}
                    >
                      {social.icon}
                    </button>
                  ))}
                  {userData.discord && (
                    <CopyToClipboard
                      text={`${userData.discord}`}
                      onCopy={() => toast.success("Username copied")}
                    >
                      <button
                        type="button"
                        aria-label="discord"
                        className="cursor-pointer transition-colors hover:text-social-discord active:scale-95"
                      >
                        <DiscordIcon />
                      </button>
                    </CopyToClipboard>
                  )}
                </div>
              </div>
            </div>
          </div>

          {userData.twitch !== null && (
            <LivestreamPlayer twitchName={userData.twitch} />
          )}

          {/* TABLET */}
          {userData.tablet &&
            userData.tabletSettingsFile &&
            userData.tabletFileUploadInfo && (
              <div className="flex w-full flex-col gap-3.5 box-border p-3.5">
                <div className="flex w-full flex-row">
                  <div className="text-[1.4em] font-medium text-[#cee0f6]">
                    Tablet Area
                  </div>
                  {sessionId && (
                    <button
                      type="button"
                      className="ml-auto flex cursor-pointer select-none flex-row items-center justify-center gap-2 rounded-md bg-[#5683c1] px-2.5 py-1 text-[11.2pt] font-normal transition-colors duration-200 hover:bg-accent-blue active:scale-[0.98] max-[1100px]:hidden"
                      onClick={() =>
                        jsDownload(
                          JSON.stringify(userData.tabletSettingsFile),
                          userData.tabletFileUploadInfo.file
                        )
                      }
                    >
                      <Download className="size-4" /> Download Settings
                    </button>
                  )}
                </div>
                <PlaystyleSection
                  tabletInfo={userData.tablet}
                  tabletSettings={userData.tabletSettingsFile}
                />
              </div>
            )}

          {/* KEYBOARD */}
          {userData.keyboard && (
            <div className="flex w-full flex-col gap-3.5 box-border p-3.5">
              <div className="flex w-full flex-row">
                <div className="text-[1.4em] font-medium text-[#cee0f6]">
                  {userData.keyboardDevice
                    ? [
                        userData.keyboardDevice.brand,
                        userData.keyboardDevice.name,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : "Keyboard"}
                </div>
              </div>
              <div className="flex w-full justify-center rounded-md bg-site-primary box-border p-6">
                <KeyboardView
                  device={userData.keyboardDevice}
                  tapKeys={userData.keyboard_keys ?? []}
                />
              </div>
            </div>
          )}

          {/* SKINS */}
          <div className="flex w-full flex-col gap-3.5 box-border p-3.5">
            <div className="flex w-full flex-row">
              <div className="text-[1.4em] font-medium text-[#cee0f6]">
                Skins
              </div>
              <div className="ml-auto flex flex-row items-center justify-center gap-3.5 rounded-md bg-[#1f242b] px-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="List View"
                      onClick={() => setSkinView("list")}
                      className={cn(
                        "flex cursor-pointer items-center transition-colors",
                        skinView === "list"
                          ? "text-[#cee0f6]"
                          : "text-[#636c76] hover:text-[#8793a1]"
                      )}
                    >
                      <List className="size-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Grid View"
                      onClick={() => setSkinView("grid")}
                      className={cn(
                        "flex cursor-pointer items-center transition-colors",
                        skinView === "grid"
                          ? "text-[#cee0f6]"
                          : "text-[#636c76] hover:text-[#8793a1]"
                      )}
                    >
                      <LayoutGrid className="size-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {skinView === "list" ? (
              <div className="flex w-full flex-col gap-2">
                {skinsData.map(
                  (skin: any) =>
                    skin.Tags.includes("current") && renderListItem(skin)
                )}
                {skinsData.map(
                  (skin: any) =>
                    !skin.Tags.includes("current") && renderListItem(skin)
                )}
                {isOwner && (
                  <div
                    className="flex min-h-[60px] cursor-pointer select-none flex-row items-center justify-center rounded-md border-2 border-dashed border-[#414a55] bg-transparent text-[11pt] font-medium uppercase text-[#76818d] transition-colors hover:border-[#545c66] hover:text-[#8b97a6]"
                    onClick={() => setModalIsOpen(true)}
                  >
                    <span>Add Skin</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex w-full flex-row flex-wrap justify-between gap-x-0.5 gap-y-3.5 max-[450px]:flex-col max-[450px]:items-center max-[450px]:justify-center">
                {skinsData.map(
                  (skin: any) =>
                    skin.Tags.includes("current") && renderGridItem(skin)
                )}
                {skinsData.map(
                  (skin: any) =>
                    !skin.Tags.includes("current") && renderGridItem(skin)
                )}
                {isOwner && (
                  <div
                    className="flex h-[calc(14em-4px)] w-[calc(18.8em-4px)] cursor-pointer select-none flex-row items-center justify-center rounded-md border-2 border-dashed border-[#414a55] bg-transparent font-medium uppercase text-[#76818d] transition-colors hover:border-[#545c66] hover:text-[#8b97a6] max-[450px]:w-full"
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
    </>
  );
}
