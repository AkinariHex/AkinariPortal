"use client";

import {
  Download,
  Gamepad2,
  Keyboard as KeyboardIcon,
  LayoutGrid,
  List,
  Plus,
  Search,
  Tablet as TabletIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";
import KeyboardView from "@/components/KeyboardView/KeyboardView";
import LivestreamPlayer from "@/components/LivestreamPlayer/LivestreamPlayer";
import PlaystyleSection from "@/components/PlaystyleSection/PlaystyleSection";
import OsuSettingsCard from "@/components/OsuSettingsCard/OsuSettingsCard";
import ProfileBadges from "@/components/ProfileBadges/ProfileBadges";
import ProfileSocials from "@/components/ProfileSocials/ProfileSocials";
import ProgressiveBlur from "@/components/ProgressiveBlur/ProgressiveBlur";
import SkinActions from "@/components/SkinActions/SkinActions";
import SkinModes from "@/components/SkinModes/SkinModes";
import SkinTags from "@/components/SkinTags/SkinTags";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { hasAnySetting, type OsuSettings } from "@/lib/osuConfig";
import type { ProfileLayoutProps } from "@/lib/profileLayout";
import { cn } from "@/lib/utils";

// Identity and gear live in a persistent left panel; the skin library is the
// page. On phones the panel becomes the header block and everything stacks.

const nf = new Intl.NumberFormat("en-US");

// Shared skin links (#<skinId>) must clear the sticky navbar when jumped to.
const ANCHOR_OFFSET = "scroll-mt-[calc(4.2em+1rem)]";

const deviceLabel = (device: any) =>
  [device?.brand, device?.name].filter(Boolean).join(" ");

function PanelFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-row items-center gap-2.5 rounded-md bg-white/[0.04] px-3 py-2">
      <span className="text-accent-blue">{icon}</span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[0.7rem] uppercase tracking-wide text-[#8fa2b8]">
          {label}
        </span>
        <span className="truncate text-[0.88rem] text-[#cee0f6]">{value}</span>
      </div>
    </div>
  );
}

export default function ProfileSidePanel({
  userData,
  skinsData,
  isOwner,
  sessionId,
  skinView,
  setSkinView,
  shareUrl,
  onAddSkin,
  onEditSkin,
  onDeleteSkin,
  onDownloadSkin,
  onDownloadTabletSettings,
}: ProfileLayoutProps) {
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();

  const hasTablet =
    userData.tablet && userData.tabletSettingsFile && userData.tabletFileUploadInfo;
  const hasKeyboard = Boolean(userData.keyboard);
  const isKeypad = userData.keyboardDevice?.type === "keypad";
  const osuSettings = (userData.osu_settings ?? null) as OsuSettings | null;
  const hasOsuSettings = hasAnySetting(osuSettings);

  const skins = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? skinsData.filter(
          (s: any) =>
            s.Name?.toLowerCase().includes(q) ||
            s.Creator?.toLowerCase().includes(q)
        )
      : skinsData;
    return [
      ...matched.filter((s: any) => s.Tags.includes("current")),
      ...matched.filter((s: any) => !s.Tags.includes("current")),
    ];
  }, [skinsData, query]);

  const totalDownloads = useMemo(
    () => skinsData.reduce((sum: number, s: any) => sum + Number(s.Downloads ?? 0), 0),
    [skinsData]
  );

  const actionProps = {
    isOwner,
    onEdit: onEditSkin,
    onDelete: onDeleteSkin,
    onDownload: onDownloadSkin,
  };

  return (
    <div className="-mt-[4.2em] min-h-screen w-full bg-site-users px-3 pb-24 pt-[calc(4.2em+1.25rem)] sm:px-5">
      <div className="mx-auto grid w-full max-w-[76rem] grid-cols-1 gap-4 lg:grid-cols-[19rem_1fr]">
        {/* SIDE PANEL */}
        <motion.aside
          initial={reduce ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3 lg:sticky lg:top-[calc(4.2em+1rem)] lg:self-start"
        >
          <div className="overflow-hidden rounded-[16px] bg-site-secondary">
            <div
              className="h-[6.5rem] w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${userData.banner})` }}
            >
              <div className="h-full w-full bg-black/55" />
            </div>
            <div className="flex flex-col items-center gap-2 px-4 pb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://s.ppy.sh/a/${userData.id}`}
                alt={`${userData.username}'s propic`}
                className="-mt-[2.6rem] size-[5.2rem] rounded-full border-2 border-accent-blue object-cover outline outline-1 outline-white/10"
              />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[1.35rem] font-medium leading-tight text-[#cee0f6]">
                  {userData.username}
                </span>
                <span className="flex flex-row items-center gap-1.5 text-[0.82rem] text-[#9fb2c9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://raw.githubusercontent.com/ppy/osu-resources/master/osu.Game.Resources/Textures/Flags/${userData.country?.code}.png`}
                    alt={userData.country?.name}
                    className="h-4 rounded-[2px] outline outline-1 outline-white/10"
                  />
                  {userData.country?.name}
                </span>
              </div>

              <ProfileBadges
                badges={userData.badges}
                size={32}
                className="mt-1 justify-center"
              />

              <ProfileSocials user={userData} className="mt-1 justify-center" />

              <div className="mt-2 grid w-full grid-cols-2 gap-2">
                <div className="flex flex-col items-center rounded-md bg-white/[0.04] py-2 leading-tight">
                  <span className="text-[1rem] font-medium tabular-nums text-[#cee0f6]">
                    {skinsData.length}
                  </span>
                  <span className="text-[0.7rem] text-[#8fa2b8]">skins</span>
                </div>
                <div className="flex flex-col items-center rounded-md bg-white/[0.04] py-2 leading-tight">
                  <span className="text-[1rem] font-medium tabular-nums text-[#cee0f6]">
                    {nf.format(totalDownloads)}
                  </span>
                  <span className="text-[0.7rem] text-[#8fa2b8]">downloads</span>
                </div>
              </div>
            </div>
          </div>

          {(hasTablet || hasKeyboard) && (
            <div className="flex flex-col gap-2 rounded-[16px] bg-site-secondary p-3">
              {hasTablet && (
                <PanelFact
                  icon={<TabletIcon className="size-4" />}
                  label="Tablet"
                  value={userData.tablet.name}
                />
              )}
              {hasKeyboard && (
                <PanelFact
                  icon={<KeyboardIcon className="size-4" />}
                  label={isKeypad ? "Keypad" : "Keyboard"}
                  value={deviceLabel(userData.keyboardDevice) || "-"}
                />
              )}
              {hasTablet && sessionId && (
                <button
                  type="button"
                  onClick={onDownloadTabletSettings}
                  className="flex cursor-pointer select-none flex-row items-center justify-center gap-2 rounded-md bg-[#5683c1] px-3 py-1.5 text-[0.85rem] transition-colors hover:bg-accent-blue active:scale-[0.98]"
                >
                  <Download className="size-4" /> Tablet settings
                </button>
              )}
            </div>
          )}
        </motion.aside>

        {/* MAIN */}
        <motion.main
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-w-0 flex-col gap-4"
        >
          {userData.twitch !== null && (
            <div className="overflow-hidden rounded-[16px] bg-site-secondary empty:hidden">
              <LivestreamPlayer twitchName={userData.twitch} />
            </div>
          )}

          {(hasTablet || hasKeyboard || hasOsuSettings) && (
            <div className="flex flex-col gap-3 rounded-[16px] bg-site-secondary p-4">
              <h2 className="text-[1.2rem] font-medium text-[#cee0f6]">Setup</h2>
              <div
                className={cn(
                  "grid grid-cols-1 gap-3",
                  hasTablet && hasKeyboard && "xl:grid-cols-2"
                )}
              >
                {hasTablet && (
                  <div className="rounded-md bg-site-primary px-3 py-2">
                    <PlaystyleSection
                      tabletInfo={userData.tablet}
                      tabletSettings={userData.tabletSettingsFile}
                    />
                  </div>
                )}
                {hasKeyboard && (
                  <div className="flex min-h-[13rem] flex-col gap-3 rounded-md bg-site-primary p-4">
                    <div className="flex flex-row flex-wrap items-center gap-2">
                      <KeyboardIcon className="size-[1.05rem] shrink-0 text-accent-blue" />
                      <span className="text-[1rem] font-medium text-[#cee0f6]">
                        {deviceLabel(userData.keyboardDevice) ||
                          (isKeypad ? "Keypad" : "Keyboard")}
                      </span>
                      {(userData.keyboard_keys ?? []).length > 0 && (
                        <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[0.78rem] text-[#9fb2c9]">
                          {userData.keyboard_keys.join(" / ")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-center overflow-x-auto">
                      <KeyboardView
                        device={userData.keyboardDevice}
                        tapKeys={userData.keyboard_keys ?? []}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Full width under the two device cards: four groups of rows
                  need the room, and they read badly in a narrow column. */}
              {hasOsuSettings && osuSettings && (
                <div className="flex flex-col gap-3 rounded-md bg-site-primary p-4">
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    <Gamepad2 className="size-[1.05rem] shrink-0 text-accent-blue" />
                    <span className="text-[1rem] font-medium text-[#cee0f6]">
                      osu! settings
                    </span>
                    {osuSettings.source && (
                      <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[0.78rem] text-[#9fb2c9]">
                        {osuSettings.source === "manual"
                          ? "manual"
                          : `osu! ${osuSettings.source}`}
                      </span>
                    )}
                  </div>
                  <OsuSettingsCard settings={osuSettings} />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-[16px] bg-site-secondary p-4">
            <div className="flex flex-row flex-wrap items-center gap-2.5">
              <h2 className="text-[1.2rem] font-medium text-[#cee0f6]">Skins</h2>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.75rem] tabular-nums text-[#8fa2b8]">
                {skins.length}
              </span>
              {isOwner && (
                <button
                  type="button"
                  onClick={onAddSkin}
                  className="flex cursor-pointer select-none flex-row items-center gap-1.5 rounded-md bg-[#5683c1] px-2.5 py-1 text-[0.85rem] transition-colors hover:bg-accent-blue active:scale-[0.98]"
                >
                  <Plus className="size-4" /> Add Skin
                </button>
              )}

              <div className="ml-auto flex flex-row items-center gap-2 max-sm:w-full">
                <label className="flex flex-1 flex-row items-center gap-2 rounded-md bg-[#1f242b] px-2.5 py-1.5 sm:w-[13rem] sm:flex-none">
                  <Search className="size-4 shrink-0 text-[#636c76]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter skins"
                    aria-label="Filter skins"
                    className="w-full bg-transparent text-[0.85rem] text-[#cee0f6] outline-none placeholder:text-[#636c76]"
                  />
                </label>
                <div className="flex flex-row items-center gap-1 rounded-md bg-[#1f242b] p-1">
                  {(
                    [
                      ["list", List, "List View"],
                      ["grid", LayoutGrid, "Grid View"],
                    ] as const
                  ).map(([key, Icon, label]) => (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={label}
                          onClick={() => setSkinView(key)}
                          className={cn(
                            "flex cursor-pointer items-center rounded px-2 py-1 transition-colors",
                            skinView === key
                              ? "bg-white/[0.08] text-[#cee0f6]"
                              : "text-[#636c76] hover:text-[#8793a1]"
                          )}
                        >
                          <Icon className="size-[18px]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>

            {skins.length === 0 ? (
              <div className="rounded-md bg-site-primary px-4 py-10 text-center text-[0.9rem] text-[#8fa2b8]">
                {query
                  ? `No skin matches "${query}".`
                  : "No skins here yet."}
              </div>
            ) : skinView === "list" ? (
              <div className="flex w-full flex-col gap-2">
                {skins.map((skin: any) => (
                  <div
                    key={skin.id}
                    id={skin.id}
                    className={cn(
                      "flex min-h-[60px] w-full flex-row overflow-hidden rounded-md bg-site-primary",
                      ANCHOR_OFFSET,
                      "target:[outline:2px_solid_#6ba2ed]"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
                      <div className="flex flex-row flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[0.95rem] font-medium text-accent-blue">
                          {skin.Name}
                        </span>
                        <span className="text-[0.78rem] text-[#9fb2c9]">
                          by {skin.Creator}
                        </span>
                      </div>
                      <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1">
                        <SkinModes modes={skin.Modes} />
                        <div className="flex select-none flex-row items-center gap-1 text-[0.8rem] tabular-nums text-[#9fb2c9]">
                          <Download className="size-[16px]" />
                          {nf.format(Number(skin.Downloads ?? 0))}
                        </div>
                        <SkinTags tags={skin.Tags} />
                      </div>
                    </div>
                    <SkinActions
                      {...actionProps}
                      skin={skin}
                      shareUrl={shareUrl(skin.id)}
                      className="shrink-0 px-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {skins.map((skin: any) => (
                  <div
                    key={skin.id}
                    id={skin.id}
                    className={cn(
                      "relative flex h-full min-h-[15rem] flex-col overflow-hidden rounded-md bg-site-primary bg-cover bg-center",
                      ANCHOR_OFFSET,
                      "target:[outline:2px_solid_#6ba2ed]"
                    )}
                    style={{ backgroundImage: `url('${skin.Banner}')` }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-black/25"
                    />

                    <SkinTags
                      tags={skin.Tags}
                      grid
                      className="relative z-[1] w-full p-[3px]"
                    />

                    {/* Bottom-anchored, so titles of different heights still
                        leave the stats and the action row on the same line
                        across the whole grid. */}
                    <div className="relative z-[1] mt-auto">
                      <ProgressiveBlur className="rounded-b-md" />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-site-primary/70"
                      />
                      <div className="relative flex flex-col gap-1.5 px-3 pb-3 pt-2.5">
                        <div className="flex flex-col">
                          <span className="text-[0.95rem] font-medium leading-tight text-accent-blue">
                            {skin.Name}
                          </span>
                          <span className="text-[0.78rem] text-[#cee0f6]">
                            by {skin.Creator}
                          </span>
                        </div>
                        <div className="flex flex-row items-center justify-between">
                          <SkinModes modes={skin.Modes} />
                          <div className="flex select-none flex-row items-center gap-1 text-[0.8rem] tabular-nums text-[#cee0f6]">
                            {nf.format(Number(skin.Downloads ?? 0))}
                            <Download className="size-[16px]" />
                          </div>
                        </div>
                        <SkinActions
                          {...actionProps}
                          skin={skin}
                          shareUrl={shareUrl(skin.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
