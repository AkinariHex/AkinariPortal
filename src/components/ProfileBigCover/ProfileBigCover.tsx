"use client";

import { Download, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import KeyboardView from "@/components/KeyboardView/KeyboardView";
import LivestreamPlayer from "@/components/LivestreamPlayer/LivestreamPlayer";
import OsuSettingsCard from "@/components/OsuSettingsCard/OsuSettingsCard";
import {
  useNavbarOverlay,
  useNavbarSurface,
} from "@/components/Navbar/NavbarSurface";
import PlaystyleSection from "@/components/PlaystyleSection/PlaystyleSection";
import ProfileBadges from "@/components/ProfileBadges/ProfileBadges";
import ProfileSocials from "@/components/ProfileSocials/ProfileSocials";
import SkinActions from "@/components/SkinActions/SkinActions";
import SkinModes from "@/components/SkinModes/SkinModes";
import SkinTags from "@/components/SkinTags/SkinTags";
import { hasAnySetting, type OsuSettings } from "@/lib/osuConfig";
import type { ProfileLayoutProps } from "@/lib/profileLayout";
import { cn } from "@/lib/utils";

// One cinematic hero, then tabs: the page shows a single thing at a time
// instead of a scroll of stacked sections.

const nf = new Intl.NumberFormat("en-US");

const deviceLabel = (device: any) =>
  [device?.brand, device?.name].filter(Boolean).join(" ");

export default function ProfileBigCover({
  userData,
  skinsData,
  isOwner,
  sessionId,
  shareUrl,
  onAddSkin,
  onEditSkin,
  onDeleteSkin,
  onDownloadSkin,
  onDownloadTabletSettings,
}: ProfileLayoutProps) {
  const reduce = useReducedMotion();

  // The cover runs under the navbar, so the navbar borrows this layout's
  // surface: the cover scrim at rest, the tab bar's glass once they meet.
  const tabsSentinelRef = useNavbarOverlay();
  const { docked } = useNavbarSurface();

  const hasTablet =
    userData.tablet && userData.tabletSettingsFile && userData.tabletFileUploadInfo;
  const hasKeyboard = Boolean(userData.keyboard);
  const osuSettings = (userData.osu_settings ?? null) as OsuSettings | null;
  const hasOsuSettings = hasAnySetting(osuSettings);
  const hasSetup = hasTablet || hasKeyboard || hasOsuSettings;

  const tabs = hasSetup ? (["Skins", "Setup"] as const) : (["Skins"] as const);
  const [tab, setTab] = useState<"Skins" | "Setup">("Skins");

  const skins = useMemo(
    () => [
      ...skinsData.filter((s: any) => s.Tags.includes("current")),
      ...skinsData.filter((s: any) => !s.Tags.includes("current")),
    ],
    [skinsData]
  );

  const totalDownloads = useMemo(
    () => skinsData.reduce((sum: number, s: any) => sum + Number(s.Downloads ?? 0), 0),
    [skinsData]
  );

  const tabletArea =
    userData.tabletSettingsFile?.Profiles?.[0]?.AbsoluteModeSettings?.Tablet;

  return (
    <div className="-mt-[4.2em] min-h-screen w-full bg-site-users pb-24">
      {/* HERO */}
      <header className="relative isolate flex h-[19rem] w-full flex-col justify-end overflow-hidden pt-[4.2em] sm:h-[26rem]">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${userData.banner})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-site-users via-site-users/75 to-black/25"
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex w-full max-w-[72rem] flex-col gap-3 px-4 pb-5 sm:px-8"
        >
          <div className="flex flex-row items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://s.ppy.sh/a/${userData.id}`}
              alt={`${userData.username}'s propic`}
              className="size-[4.5rem] shrink-0 rounded-2xl border border-white/15 object-cover sm:size-[6.5rem]"
            />
            <div className="flex min-w-0 flex-col gap-1 pb-1">
              <div className="flex flex-row items-center gap-2 text-[0.85rem] text-[#9fb2c9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://raw.githubusercontent.com/ppy/osu-resources/master/osu.Game.Resources/Textures/Flags/${userData.country?.code}.png`}
                  alt={userData.country?.name}
                  className="h-4 rounded-[2px] outline outline-1 outline-white/10"
                />
                {userData.country?.name}
              </div>
              <h1 className="text-[2.4rem] font-medium leading-[1.05] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.5)] sm:text-[3.6rem]">
                {userData.username}
              </h1>
            </div>
          </div>

          <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex flex-row items-baseline gap-1.5 text-[#9fb2c9]">
              <span className="text-[1.05rem] font-medium tabular-nums text-[#cee0f6]">
                {skinsData.length}
              </span>
              <span className="text-[0.82rem]">skins</span>
              <span className="px-1 text-[#4d5865]">/</span>
              <span className="text-[1.05rem] font-medium tabular-nums text-[#cee0f6]">
                {nf.format(totalDownloads)}
              </span>
              <span className="text-[0.82rem]">downloads</span>
            </div>

            <ProfileSocials user={userData} />
            <ProfileBadges badges={userData.badges} size={34} />
          </div>
        </motion.div>
      </header>

      {userData.twitch !== null && (
        <div className="mx-auto w-full max-w-[72rem] px-4 sm:px-8">
          <LivestreamPlayer twitchName={userData.twitch} />
        </div>
      )}

      {/* TABS */}
      <div ref={tabsSentinelRef} aria-hidden className="h-px w-full" />

      <nav className="sticky top-0 z-30 border-b border-white/[0.07] md:top-[4.2em]">
        {/* The bar's surface lives on its own layer so that, once docked, it can
            reach up behind the navbar and cover both with a single blur. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 top-0 bg-site-users/85 backdrop-blur-md",
            docked && "md:-top-[4.2em]"
          )}
        />
        <div className="relative mx-auto flex w-full max-w-[72rem] flex-row items-center gap-1 px-4 sm:px-8">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              className={cn(
                "relative cursor-pointer px-3 py-3 text-[0.95rem] transition-colors max-sm:flex-1",
                tab === t
                  ? "text-[#cee0f6]"
                  : "text-[#7d8b9c] hover:text-[#a9b8ca]"
              )}
            >
              {t}
              {tab === t && (
                <motion.span
                  layoutId="profile-big-cover-tab"
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-accent-blue"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              )}
            </button>
          ))}
          {tab === "Skins" && isOwner && (
            <button
              type="button"
              onClick={onAddSkin}
              className="ml-auto flex cursor-pointer select-none flex-row items-center gap-1.5 rounded-md bg-[#5683c1] px-2.5 py-1 text-[0.85rem] transition-colors hover:bg-accent-blue active:scale-[0.98]"
            >
              <Plus className="size-4" /> Add Skin
            </button>
          )}
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[72rem] px-4 py-6 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "Skins" ? (
              skins.length === 0 ? (
                <div className="rounded-xl bg-site-secondary px-4 py-14 text-center text-[0.9rem] text-[#8fa2b8]">
                  No skins here yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {skins.map((skin: any) => (
                    <article
                      key={skin.id}
                      id={skin.id}
                      className="group relative flex h-[16rem] scroll-mt-[calc(4.2em+4rem)] flex-col justify-end overflow-hidden rounded-xl target:[outline:2px_solid_#6ba2ed]"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        style={{ backgroundImage: `url('${skin.Banner}')` }}
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20"
                      />
                      <SkinTags
                        tags={skin.Tags}
                        grid
                        className="relative z-[1] mb-auto w-full p-2"
                      />
                      <div className="relative z-[1] flex flex-col gap-2 p-4">
                        <div className="flex flex-col [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
                          <span className="text-[1.35rem] font-medium leading-tight tracking-tight text-white">
                            {skin.Name}
                          </span>
                          <span className="text-[0.85rem] text-[#cee0f6]">
                            by {skin.Creator}
                          </span>
                        </div>
                        <div className="flex flex-row flex-wrap items-center justify-between gap-2">
                          <SkinModes modes={skin.Modes} />
                          <div className="flex select-none flex-row items-center gap-1.5 text-[0.85rem] tabular-nums text-[#cee0f6]">
                            <Download className="size-[16px]" />
                            {nf.format(Number(skin.Downloads ?? 0))}
                          </div>
                        </div>
                        <SkinActions
                          skin={skin}
                          isOwner={isOwner}
                          shareUrl={shareUrl(skin.id)}
                          onEdit={onEditSkin}
                          onDelete={onDeleteSkin}
                          onDownload={onDownloadSkin}
                          variant="wide"
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col gap-4">
              <div
                className={cn(
                  "grid grid-cols-1 gap-4",
                  hasTablet && hasKeyboard && "lg:grid-cols-2"
                )}
              >
                {hasTablet && (
                  <section className="flex flex-col gap-3 rounded-xl bg-site-secondary p-5">
                    <div className="flex flex-row flex-wrap items-center gap-2.5">
                      <h2 className="text-[1.3rem] font-medium tracking-tight text-[#cee0f6]">
                        {userData.tablet.name}
                      </h2>
                      {sessionId && (
                        <button
                          type="button"
                          onClick={onDownloadTabletSettings}
                          className="ml-auto flex cursor-pointer select-none flex-row items-center gap-1.5 rounded-md bg-white/[0.06] px-2.5 py-1 text-[0.8rem] text-[#cee0f6] transition-colors hover:bg-white/[0.12] active:scale-[0.98]"
                        >
                          <Download className="size-3.5" /> Settings
                        </button>
                      )}
                    </div>
                    {tabletArea && (
                      <p className="text-[0.85rem] text-[#8fa2b8]">
                        Area {tabletArea.Width}x{tabletArea.Height}mm on a{" "}
                        {userData.tablet.width}x{userData.tablet.height}mm surface.
                      </p>
                    )}
                    <div className="rounded-lg bg-site-primary px-3 py-2">
                      <PlaystyleSection
                        tabletInfo={userData.tablet}
                        tabletSettings={userData.tabletSettingsFile}
                      />
                    </div>
                  </section>
                )}

                {hasKeyboard && (
                  <section className="flex flex-col gap-3 rounded-xl bg-site-secondary p-5">
                    <div className="flex flex-row flex-wrap items-center gap-2.5">
                      <h2 className="text-[1.3rem] font-medium tracking-tight text-[#cee0f6]">
                        {deviceLabel(userData.keyboardDevice) || "Keyboard"}
                      </h2>
                      {(userData.keyboard_keys ?? []).length > 0 && (
                        <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[0.8rem] text-[#cee0f6]">
                          {userData.keyboard_keys.join(" / ")}
                        </span>
                      )}
                    </div>
                    <p className="text-[0.85rem] text-[#8fa2b8]">
                      Tap keys used in game.
                    </p>
                    <div className="flex min-h-[13rem] items-center justify-center overflow-x-auto rounded-lg bg-site-primary p-4">
                      <KeyboardView
                        device={userData.keyboardDevice}
                        tapKeys={userData.keyboard_keys ?? []}
                      />
                    </div>
                  </section>
                )}
              </div>

              {hasOsuSettings && osuSettings && (
                <section className="flex flex-col gap-3 rounded-xl bg-site-secondary p-5">
                  <div className="flex flex-row flex-wrap items-center gap-2.5">
                    <h2 className="text-[1.3rem] font-medium tracking-tight text-[#cee0f6]">
                      osu! settings
                    </h2>
                    {osuSettings.source && (
                      <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[0.8rem] text-[#cee0f6]">
                        {osuSettings.source === "manual"
                          ? "manual"
                          : `osu! ${osuSettings.source}`}
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg bg-site-primary px-4 py-3">
                    <OsuSettingsCard settings={osuSettings} />
                  </div>
                </section>
              )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
