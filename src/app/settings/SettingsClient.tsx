"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Copy,
  Upload,
  X,
  Plus,
  Check,
  ChevronsUpDown,
  ScanLine,
  Send,
  Keyboard as KeyboardIcon,
  ShieldCheck,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment/moment";
import { cn } from "@/lib/utils";
import ConnectionField from "@/components/ConnectionField/ConnectionField";
import LoadingIcon from "@/components/LoadingIcon/LoadingIcon";
import KeyboardView, {
  type KeyboardDevice,
} from "@/components/KeyboardView/KeyboardView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OsuSettingsForm from "@/components/OsuSettingsForm/OsuSettingsForm";
import ProfileLayoutPicker from "@/components/ProfileLayoutPicker/ProfileLayoutPicker";
import {
  compactSettings,
  detectConfigKind,
  hasAnySetting,
  mergeSettings,
  parseLazerFramework,
  parseLazerGame,
  parseStableConfig,
  NEVER_READ_FIELDS,
  PUBLISHED_FIELDS,
  type ConfigKind,
  type OsuSettings,
} from "@/lib/osuConfig";
import {
  layoutSupportsSkinView,
  normalizeProfileLayout,
  type ProfileLayout,
} from "@/lib/profileLayout";
import {
  generateApiKey,
  destroyApiKey,
  saveOsuSettings as saveOsuSettingsAction,
  saveProfileLayout as saveProfileLayoutAction,
  saveSkinView as saveSkinViewAction,
  saveSocials,
  saveTablet,
  saveKeyboard,
  requestKeyboard,
} from "@/app/settings/actions";

moment.locale("en");

const NO_KEY = "You haven't generated any secret key!";

const select_options = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
];

export default function SettingsClient({
  session,
  userData,
  keyboards = [],
}: {
  session: any;
  userData: any;
  keyboards?: KeyboardDevice[];
}) {
  const router = useRouter();
  const data: any = userData ?? {};

  const [hideAPI, setHideAPI] = useState(true);
  const [apikey, setApikey] = useState(
    data.secret_key === null || data.secret_key === undefined
      ? ""
      : data.secret_key
  );

  const [tabletSettingsInfo, setTabletSettingsInfo] = useState<any>(
    data.tabletFileUploadInfo !== null && data.tabletFileUploadInfo !== undefined
      ? data.tabletFileUploadInfo
      : { file: "", date: "" }
  );
  const [tabletUploadError, setTabletUploadError] = useState(false);
  const [pendingTabletFile, setPendingTabletFile] = useState<{
    file: File;
    json: any;
  } | null>(null);

  const [skinview, setSkinview] = useState<any>(data.skin_view);
  const [profileLayout, setProfileLayout] = useState<ProfileLayout>(
    normalizeProfileLayout(data.profile_layout)
  );

  const [prevTwitchData, setPrevTwitchData] = useState(data.twitch);
  const [prevGithubData, setPrevGithubData] = useState(data.github);
  const [prevTwitterData, setPrevTwitterData] = useState(data.twitter);
  const [prevDiscordData, setPrevDiscordData] = useState(data.discord);
  const [prevYoutubeData, setPrevYoutubeData] = useState(data.youtube);

  const [twitchData, setTwitchData] = useState(data.twitch);
  const [githubData, setGithubData] = useState(data.github);
  const [twitterData, setTwitterData] = useState(data.twitter);
  const [discordData, setDiscordData] = useState(data.discord);
  const [youtubeData, setYoutubeData] = useState(data.youtube);

  /* isSaving refer to Socials saving */
  const [isSaving, setIsSaving] = useState(false);

  const [keyboardId, setKeyboardId] = useState<string>(
    data.keyboard ? String(data.keyboard) : ""
  );
  const [tapKeys, setTapKeys] = useState<string[]>(
    Array.isArray(data.keyboard_keys) ? data.keyboard_keys : []
  );
  const [keyInput, setKeyInput] = useState("");
  const [savingKeyboard, setSavingKeyboard] = useState(false);

  const [osuDraft, setOsuDraft] = useState<OsuSettings>(
    (data.osu_settings as OsuSettings) ?? { source: "manual" }
  );
  const [osuSaved, setOsuSaved] = useState<OsuSettings | null>(
    (data.osu_settings as OsuSettings) ?? null
  );
  const [savingOsu, setSavingOsu] = useState(false);
  const [osuImportError, setOsuImportError] = useState(false);
  const [pendingTapKeys, setPendingTapKeys] = useState<string[] | null>(null);
  const [sentFieldsOpen, setSentFieldsOpen] = useState(false);
  const [capturingKeys, setCapturingKeys] = useState(false);

  const [comboOpen, setComboOpen] = useState(false);
  const [hidSupported, setHidSupported] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqBrand, setReqBrand] = useState("");
  const [reqType, setReqType] = useState<"keyboard" | "keypad">("keyboard");
  const [reqNote, setReqNote] = useState("");
  const [reqVendorId, setReqVendorId] = useState<number | null>(null);
  const [reqProductId, setReqProductId] = useState<number | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setHidSupported(
      typeof navigator !== "undefined" && "hid" in navigator
    );
  }, []);

  useEffect(() => {
    if (!capturingKeys) return;

    const ignoredKeys = new Set([
      "Shift",
      "Control",
      "Alt",
      "AltGraph",
      "Meta",
      "CapsLock",
      "Tab",
    ]);

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCapturingKeys(false);
        return;
      }
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if (ignoredKeys.has(e.key)) return;

      e.preventDefault();
      const label = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      setTapKeys((prev) =>
        prev.some((k) => k.toLowerCase() === label.toLowerCase())
          ? prev
          : [...prev, label]
      );
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [capturingKeys]);

  const selectedDevice = useMemo(
    () => keyboards.find((k) => String(k.id) === keyboardId) ?? null,
    [keyboards, keyboardId]
  );
  const hasLayout = !!selectedDevice?.layout?.rows?.length;

  const keypads = useMemo(
    () => keyboards.filter((k) => k.type === "keypad"),
    [keyboards]
  );
  const fullKeyboards = useMemo(
    () => keyboards.filter((k) => k.type !== "keypad"),
    [keyboards]
  );

  const deviceLabel = (k: KeyboardDevice) =>
    k.brand ? `${k.brand} - ${k.name}` : k.name;

  const toggleTapKey = (label: string) => {
    setTapKeys((prev) =>
      prev.some((k) => k.toLowerCase() === label.toLowerCase())
        ? prev.filter((k) => k.toLowerCase() !== label.toLowerCase())
        : [...prev, label]
    );
  };

  const addTapKey = () => {
    const label = keyInput.trim();
    if (!label) return;
    if (tapKeys.some((k) => k.toLowerCase() === label.toLowerCase())) {
      toast.error(`"${label}" is already added.`);
      setKeyInput("");
      return;
    }
    setTapKeys((prev) => [...prev, label]);
    setKeyInput("");
  };

  const removeTapKey = (label: string) => {
    setTapKeys((prev) => prev.filter((k) => k !== label));
  };

  const onSelectKeyboard = (value: string) => {
    setKeyboardId(value);
    setTapKeys([]);
    setKeyInput("");
    setComboOpen(false);
    setCapturingKeys(false);
  };

  const openRequestDialog = (vendorId?: number, productId?: number) => {
    setReqName("");
    setReqBrand("");
    setReqType("keyboard");
    setReqNote("");
    setReqVendorId(vendorId ?? null);
    setReqProductId(productId ?? null);
    setRequestOpen(true);
  };

  const detectDevice = async () => {
    if (detecting) return;
    setDetecting(true);
    try {
      const hid = (navigator as any).hid;
      const devices = await hid.requestDevice({
        filters: [{ usagePage: 0xff60 }, { vendorId: 0x31e3 }],
      });
      const device = devices?.[0];
      if (!device) {
        toast("No device selected.");
        return;
      }
      const vendorId: number = device.vendorId;
      const productId: number = device.productId;
      const match = keyboards.find(
        (k) =>
          (k as any).vendor_id != null &&
          (k as any).product_id != null &&
          Number((k as any).vendor_id) === vendorId &&
          Number((k as any).product_id) === productId
      );
      if (match) {
        onSelectKeyboard(String(match.id));
        toast.success(`Detected: ${match.name}`);
      } else {
        toast("Device not in catalog yet. Request it below.");
        openRequestDialog(vendorId, productId);
      }
    } catch {
      toast("Detection cancelled or unavailable.");
    } finally {
      setDetecting(false);
    }
  };

  const submitRequest = async () => {
    if (requesting) return;
    if (!reqName.trim()) {
      toast.error("Name is required.");
      return;
    }
    setRequesting(true);
    try {
      const result = await requestKeyboard({
        name: reqName.trim(),
        brand: reqBrand.trim() || undefined,
        type: reqType,
        vendor_id: reqVendorId,
        product_id: reqProductId,
        note: reqNote.trim() || undefined,
      });
      if (result.status === "done") {
        toast.success("Keyboard requested. Thanks!");
        setRequestOpen(false);
      } else {
        toast.error("Failed to send request.");
      }
    } catch {
      toast.error("Failed to send request.");
    } finally {
      setRequesting(false);
    }
  };

  // The config file is read and reduced to the allowlist here in the browser;
  // it is never uploaded. Only the object the parser returns can be saved.
  const importOsuStable = async (file: File) => {
    try {
      const { settings, tapKeys: importedKeys } = parseStableConfig(
        await file.text()
      );
      setOsuDraft(settings);
      setOsuImportError(false);
      if (importedKeys.length > 0) setPendingTapKeys(importedKeys);
      toast.success("Settings imported. Review them, then save.");
    } catch {
      setOsuImportError(true);
      toast.error("That doesn't look like an osu! stable config file.");
    }
  };

  // lazer splits its settings across framework.ini (window, frame limiter,
  // volumes) and game.ini (cursor, dim, storyboard, offset), so both can be
  // picked at once. game.ini is folded over framework.ini, because where the
  // two overlap game.ini is what the player sees in the options.
  const importOsuLazer = async (files: File[]) => {
    try {
      const parsed: { kind: ConfigKind; settings: OsuSettings }[] = [];

      for (const file of files) {
        const text = await file.text();
        const kind = detectConfigKind(file.name, text);
        if (kind === "lazer-game") {
          parsed.push({ kind, settings: parseLazerGame(text) });
        } else if (kind === "lazer-framework") {
          parsed.push({ kind, settings: parseLazerFramework(text) });
        }
      }

      if (parsed.length === 0) throw new Error("nothing recognised");

      const framework = parsed.find((p) => p.kind === "lazer-framework");
      const game = parsed.find((p) => p.kind === "lazer-game");
      const merged =
        framework && game
          ? mergeSettings(framework.settings, game.settings)
          : (game ?? framework)!.settings;

      setOsuDraft(merged);
      setOsuImportError(false);
      toast.success(
        game && framework
          ? "Both lazer files imported. Review them, then save."
          : game
            ? "game.ini imported. Add framework.ini for window and volume settings."
            : "framework.ini imported. Add game.ini for cursor, dim and offset."
      );

      // Fullscreen in lazer means "the desktop resolution", stored as the
      // 9999x9999 sentinel, so there is no number to import. Say so instead of
      // leaving a silently empty field.
      const fullscreenish =
        merged.display?.windowMode === "fullscreen" ||
        merged.display?.windowMode === "borderless";
      if (fullscreenish && !merged.display?.resolution) {
        toast("Set your resolution below: lazer does not store it in fullscreen.");
      }
    } catch {
      setOsuImportError(true);
      toast.error("Those don't look like osu! lazer config files.");
    }
  };

  const saveOsuSettings = async () => {
    if (savingOsu) return;
    setSavingOsu(true);
    try {
      const payload = compactSettings({
        ...osuDraft,
        source: osuDraft.source ?? "manual",
        updatedAt: undefined,
      });
      const result = await saveOsuSettingsAction(payload);
      if (result.message === "done") {
        // The server stamps updatedAt; mirror it so the status box is right
        // straight away instead of after a full page load.
        setOsuSaved({ ...payload, updatedAt: new Date().toISOString() });
        setOsuImportError(false);
        toast.success("osu! settings saved.");
        router.refresh();
      } else {
        toast.error("Failed to save osu! settings.");
      }
    } catch {
      toast.error("Failed to save osu! settings.");
    } finally {
      setSavingOsu(false);
    }
  };

  const clearOsuSettings = async () => {
    if (savingOsu) return;
    setSavingOsu(true);
    try {
      const result = await saveOsuSettingsAction(null);
      if (result.message === "done") {
        setOsuDraft({ source: "manual" });
        setOsuSaved(null);
        setOsuImportError(false);
        toast.success("osu! settings removed.");
        router.refresh();
      } else {
        toast.error("Failed to remove osu! settings.");
      }
    } catch {
      toast.error("Failed to remove osu! settings.");
    } finally {
      setSavingOsu(false);
    }
  };

  const applyImportedTapKeys = async () => {
    if (!pendingTapKeys) return;
    const keys = pendingTapKeys;
    setPendingTapKeys(null);
    setTapKeys(keys);
    const result = await saveKeyboard({
      keyboard: keyboardId || null,
      keyboard_keys: keys,
    });
    if (result.message === "done") {
      toast.success("Tap keys updated.");
      router.refresh();
    } else {
      toast.error("Failed to save tap keys.");
    }
  };

  const saveKeyboardSettings = async () => {
    if (savingKeyboard) return;
    setSavingKeyboard(true);
    try {
      const result = await saveKeyboard({
        keyboard: keyboardId || null,
        keyboard_keys: tapKeys,
      });
      if (result.message === "done") {
        toast.success("Keyboard saved.");
        router.refresh();
      } else {
        toast.error("Failed to save keyboard.");
      }
    } catch {
      toast.error("Failed to save keyboard.");
    } finally {
      setSavingKeyboard(false);
    }
  };

  const finalizeTabletUpload = async (
    tabletFile: File,
    jsonFile: any,
    profileIndex: number
  ) => {
    const uploadInfo = {
      file: tabletFile.name,
      date: Date.now(),
    };
    const chosenProfile = jsonFile.Profiles[profileIndex];
    // Keep just the chosen profile so the rest of the app (profile preview)
    // can keep reading Profiles[0] without knowing about the other saves.
    const filteredFile = { ...jsonFile, Profiles: [chosenProfile] };
    setTabletSettingsInfo(uploadInfo);

    const result = await saveTablet({
      tablet: chosenProfile.Tablet,
      tabletSettingsFile: filteredFile,
      tabletFileUploadInfo: uploadInfo,
    });

    const failed = result.message !== "done";
    setTabletUploadError(failed);
    if (failed) {
      toast.error("Failed to upload tablet settings.");
    } else {
      toast.success("Tablet settings uploaded.");
      router.refresh();
    }
  };

  const uploadTabletSettings = async (tabletFile: File) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const jsonFile = JSON.parse(e.target!.result as string);
        const profiles = jsonFile?.Profiles;
        if (!Array.isArray(profiles) || profiles.length === 0) {
          throw new Error("No tablet profiles in file");
        }

        if (profiles.length > 1) {
          // The exported file has multiple tablet saves - let the user pick
          // which one shows on their profile instead of always using [0].
          setPendingTabletFile({ file: tabletFile, json: jsonFile });
          return;
        }

        await finalizeTabletUpload(tabletFile, jsonFile, 0);
      } catch {
        setTabletUploadError(true);
        toast.error("Invalid tablet settings file.");
      }
    };
    reader.readAsText(tabletFile);
  };

  const chooseTabletProfile = async (profileIndex: number) => {
    if (!pendingTabletFile) return;
    const { file, json } = pendingTabletFile;
    setPendingTabletFile(null);
    await finalizeTabletUpload(file, json, profileIndex);
  };

  const deleteTabletSettings = async () => {
    const result = await saveTablet({
      tablet: null,
      tabletSettingsFile: null,
      tabletFileUploadInfo: null,
    });

    if (result.message !== "done") {
      toast.error("Failed to delete tablet settings.");
      return;
    }

    setTabletSettingsInfo({ file: "", date: "" });
    setTabletUploadError(false);
    toast.success("Tablet settings removed.");
    router.refresh();
  };

  const saveSkinView = async (changedView: any) => {
    const result = await saveSkinViewAction(changedView);

    if (result.message === "done") {
      toast.success("Skin view saved.");
      router.refresh();
    } else {
      toast.error("Failed to save skin view.");
    }
  };

  const changeProfileLayout = async (layout: ProfileLayout) => {
    const previous = profileLayout;
    setProfileLayout(layout);

    const result = await saveProfileLayoutAction(layout);

    if (result.message === "done") {
      toast.success("Profile layout saved.");
      router.refresh();
    } else {
      setProfileLayout(previous);
      toast.error("Failed to save profile layout.");
    }
  };

  const saveConnectionsInputs = async () => {
    if (!isSaving) {
      setIsSaving(true);
      const result = await saveSocials({
        twitch: twitchData,
        github: githubData,
        twitter: twitterData,
        discord: discordData,
        youtube: youtubeData,
      });

      if (result.message === "done") {
        setPrevTwitchData(twitchData);
        setPrevGithubData(githubData);
        setPrevTwitterData(twitterData);
        setPrevDiscordData(discordData);
        setPrevYoutubeData(youtubeData);
        setIsSaving(false);
        toast.success("Socials saved.");
        router.refresh();
      } else {
        setIsSaving(false);
        toast.error("Failed to save socials.");
      }
    }
  };

  const resetConnectionsInputs = () => {
    setTwitchData(data.twitch);
    setGithubData(data.github);
    setTwitterData(data.twitter);
    setDiscordData(data.discord);
    setYoutubeData(data.youtube);
  };

  function copyToClipboard() {
    navigator.clipboard.writeText(apikey);
    toast.success("Secret key copied to clipboard.");
  }

  async function createApikey() {
    const result = await generateApiKey();
    if (result.status === "success") {
      setApikey(result.secret_key);
      toast.success("Secret key generated.");
    } else {
      toast.error("Failed to generate secret key.");
    }
  }

  async function destroyApikey() {
    const result = await destroyApiKey();
    if (result.status === "success") {
      setApikey(NO_KEY);
      setHideAPI(false);
      toast.success("Secret key destroyed.");
      router.refresh();
    } else {
      toast.error("Failed to destroy secret key.");
    }
  }

  const hasKey = apikey !== "" && apikey !== NO_KEY;
  const connectionsChanged =
    twitchData !== prevTwitchData ||
    twitterData !== prevTwitterData ||
    youtubeData !== prevYoutubeData ||
    discordData !== prevDiscordData ||
    githubData !== prevGithubData;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        {/* Secret Key */}
        <section
          id="secretkey"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">Secret Key</h2>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={NO_KEY}
              value={hasKey && hideAPI ? "*".repeat(45) : apikey}
              disabled
              className="flex-1 font-mono"
            />
            {hasKey && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setHideAPI((prev) => !prev)}
                  aria-label={hideAPI ? "Show secret key" : "Hide secret key"}
                >
                  {hideAPI ? <Eye /> : <EyeOff />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  aria-label="Copy secret key"
                >
                  <Copy />
                </Button>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={createApikey}>
              Generate Apikey
            </Button>
            <Button type="button" variant="destructive" onClick={destroyApikey}>
              Destroy Apikey
            </Button>
          </div>
        </section>

        {/* Tablet Settings */}
        <section
          id="tabletSettings"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            Tablet Settings
            <Badge variant="secondary" className="text-accent-blue">
              BETA
            </Badge>
          </h2>

          <div className="flex items-center gap-3">
            <div
              className={`flex flex-1 flex-col rounded-md border px-4 py-3 ${
                tabletUploadError
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border bg-site-primary"
              }`}
            >
              <span className="text-sm font-medium text-foreground">
                {tabletSettingsInfo.file === ""
                  ? "No settings uploaded"
                  : tabletSettingsInfo.file}
              </span>
              {tabletSettingsInfo.date && (
                <span className="text-xs text-muted-foreground">
                  {moment(tabletSettingsInfo.date).format("DD MMM YYYY, kk:mm")}
                </span>
              )}
            </div>
            {tabletSettingsInfo.file !== "" && tabletSettingsInfo.date !== "" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={deleteTabletSettings}
                    aria-label="Delete Tablet Settings"
                  >
                    <X />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Tablet Settings</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div>
            <Button asChild type="button" variant="secondary">
              <label htmlFor="tabletSettingsJSON" className="cursor-pointer">
                <Upload />
                Import Tablet Settings
                <input
                  type="file"
                  name="tabletSettingsJSON"
                  id="tabletSettingsJSON"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && uploadTabletSettings(e.target.files[0])
                  }
                />
              </label>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Show on your profile the tablet area you are currently using! Upload
            the exported .json file. If it contains settings for more than one
            tablet, you&apos;ll be asked which one to use.
            <br />
            It supports only the .json file made by{" "}
            <a
              href="https://opentabletdriver.net/"
              target="_blank"
              rel="noreferrer"
              className="text-accent-blue hover:underline"
            >
              OpenTabletDriver
            </a>
            .{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-accent-blue hover:underline"
                >
                  How to export the tablet settings?
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="flex flex-col gap-2">
                  <span>
                    To export the settings on OpenTabletDriver go to
                    <br />
                    <b>File</b> &gt; <b>Save settings as...</b>
                  </span>
                  <img
                    src="https://akinariosu.s-ul.eu/KUl8xGrI"
                    alt="export example"
                    className="max-w-full rounded"
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </p>
        </section>

        {/* Keyboard */}
        <section
          id="keyboard"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            Keyboard
            <Badge variant="secondary" className="text-accent-blue">
              BETA
            </Badge>
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal sm:w-80"
                >
                  <span
                    className={cn(
                      "truncate",
                      !selectedDevice && "text-muted-foreground"
                    )}
                  >
                    {selectedDevice
                      ? deviceLabel(selectedDevice)
                      : "Select a keyboard"}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0"
              >
                <Command>
                  <CommandInput placeholder="Search keyboards..." />
                  <CommandList className="max-h-72 overflow-y-auto">
                    <CommandEmpty>No device found.</CommandEmpty>
                    {keypads.length > 0 && (
                      <CommandGroup heading="Keypads">
                        {keypads.map((k) => (
                          <CommandItem
                            key={String(k.id)}
                            value={`${deviceLabel(k)} ${k.id}`}
                            onSelect={() => onSelectKeyboard(String(k.id))}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                keyboardId === String(k.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {deviceLabel(k)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {fullKeyboards.length > 0 && (
                      <CommandGroup heading="Keyboards">
                        {fullKeyboards.map((k) => (
                          <CommandItem
                            key={String(k.id)}
                            value={`${deviceLabel(k)} ${k.id}`}
                            onSelect={() => onSelectKeyboard(String(k.id))}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                keyboardId === String(k.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {deviceLabel(k)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {keyboardId && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onSelectKeyboard("")}
                aria-label="Clear keyboard"
              >
                <X />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hidSupported && (
              <Button
                type="button"
                variant="secondary"
                onClick={detectDevice}
                disabled={detecting}
              >
                {detecting ? <LoadingIcon /> : <ScanLine />}
                Detect device
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => openRequestDialog()}
            >
              <Send />
              Request a keyboard
            </Button>
          </div>

          {selectedDevice && (
            <>
              {hasLayout ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Click the keys you tap on to highlight them, or press them
                    on your keyboard.
                  </p>
                  <Button
                    type="button"
                    variant={capturingKeys ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCapturingKeys((v) => !v)}
                  >
                    {capturingKeys ? (
                      <>
                        <Square className="animate-pulse" />
                        Listening... (Esc to stop)
                      </>
                    ) : (
                      <>
                        <KeyboardIcon />
                        Press keys
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTapKey();
                      }
                    }}
                    placeholder="Add a key (e.g. Z)"
                    maxLength={12}
                    className="w-full sm:w-56"
                  />
                  <Button type="button" variant="secondary" onClick={addTapKey}>
                    <Plus />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant={capturingKeys ? "default" : "outline"}
                    onClick={() => setCapturingKeys((v) => !v)}
                  >
                    {capturingKeys ? (
                      <>
                        <Square className="animate-pulse" />
                        Listening... (Esc to stop)
                      </>
                    ) : (
                      <>
                        <KeyboardIcon />
                        Press keys
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!hasLayout && tapKeys.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tapKeys.map((k) => (
                    <Badge
                      key={k}
                      variant="secondary"
                      className="flex items-center gap-1 bg-site-primary"
                    >
                      {k}
                      <button
                        type="button"
                        aria-label={`Remove ${k}`}
                        onClick={() => removeTapKey(k)}
                        className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="rounded-md border border-border bg-site-primary p-6">
                <KeyboardView
                  device={selectedDevice}
                  tapKeys={tapKeys}
                  interactive={hasLayout}
                  onToggleKey={toggleTapKey}
                />
              </div>
            </>
          )}

          <div>
            <Button
              type="button"
              onClick={saveKeyboardSettings}
              disabled={savingKeyboard}
            >
              {savingKeyboard ? <LoadingIcon /> : "Save Keyboard"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Show the keyboard or keypad you play on, and the keys you tap with, on
            your profile.
          </p>
        </section>

        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request a keyboard</DialogTitle>
              <DialogDescription>
                Can&apos;t find your device? Tell us about it and we&apos;ll add
                it to the catalog.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="req-name">Name</Label>
                <Input
                  id="req-name"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="e.g. Wooting 60HE"
                  maxLength={100}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="req-brand">Brand</Label>
                <Input
                  id="req-brand"
                  value={reqBrand}
                  onChange={(e) => setReqBrand(e.target.value)}
                  placeholder="e.g. Wooting"
                  maxLength={60}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="req-type">Type</Label>
                <Select
                  value={reqType}
                  onValueChange={(value) =>
                    setReqType(value === "keypad" ? "keypad" : "keyboard")
                  }
                >
                  <SelectTrigger id="req-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="keypad">Keypad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="req-note">Note</Label>
                <Textarea
                  id="req-note"
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="Anything that helps us find it (optional)"
                  rows={3}
                  maxLength={500}
                  className="resize-y"
                />
              </div>
              {(reqVendorId != null || reqProductId != null) && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  Detected ids will be included
                  {reqVendorId != null && ` - VID ${reqVendorId}`}
                  {reqProductId != null && ` - PID ${reqProductId}`}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRequestOpen(false)}
                disabled={requesting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitRequest}
                disabled={requesting}
              >
                {requesting ? <LoadingIcon /> : "Send request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!pendingTabletFile}
          onOpenChange={(open) => {
            if (!open) setPendingTabletFile(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a tablet profile</DialogTitle>
              <DialogDescription>
                This file has settings saved for multiple tablets. Pick the
                one you want shown on your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {pendingTabletFile?.json.Profiles.map((profile: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => chooseTabletProfile(i)}
                  className="flex flex-col items-start rounded-md border border-border bg-site-primary px-4 py-3 text-left transition-colors hover:bg-site-primary/70"
                >
                  <span className="font-medium text-foreground">
                    {profile?.Tablet || `Profile ${i + 1}`}
                  </span>
                  {profile?.AbsoluteModeSettings?.Tablet && (
                    <span className="text-xs text-muted-foreground">
                      Area: {profile.AbsoluteModeSettings.Tablet.Width}mm x{" "}
                      {profile.AbsoluteModeSettings.Tablet.Height}mm
                    </span>
                  )}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* osu! Settings */}
        <section
          id="osuSettings"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            osu! Settings
            <Badge variant="secondary" className="text-accent-blue">
              BETA
            </Badge>
          </h2>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex flex-1 flex-col rounded-md border px-4 py-3",
                osuImportError
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border bg-site-primary"
              )}
            >
              <span className="text-sm font-medium text-foreground">
                {!hasAnySetting(osuSaved)
                  ? "No settings saved"
                  : osuSaved?.source === "stable"
                    ? "Imported from osu! stable"
                    : osuSaved?.source === "lazer"
                      ? "Imported from osu! lazer"
                      : "Set manually"}
              </span>
              {osuSaved?.updatedAt && (
                <span className="text-xs text-muted-foreground">
                  {moment(osuSaved.updatedAt).format("DD MMM YYYY, kk:mm")}
                </span>
              )}
            </div>
            {hasAnySetting(osuSaved) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={clearOsuSettings}
                    disabled={savingOsu}
                    aria-label="Delete osu! settings"
                  >
                    <X />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete osu! Settings</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="secondary">
              <label htmlFor="osuStableCfg" className="cursor-pointer">
                <Upload />
                Import from osu! stable
                <input
                  type="file"
                  id="osuStableCfg"
                  name="osuStableCfg"
                  accept=".cfg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void importOsuStable(file);
                  }}
                />
              </label>
            </Button>
            <Button asChild type="button" variant="secondary">
              <label htmlFor="osuLazerIni" className="cursor-pointer">
                <Upload />
                Import from osu! lazer
                <input
                  type="file"
                  id="osuLazerIni"
                  name="osuLazerIni"
                  accept=".ini"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    if (files.length > 0) void importOsuLazer(files);
                  }}
                />
              </label>
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-accent-blue/30 bg-accent-blue/5 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="size-4 shrink-0 text-accent-blue" />
              Your osu! login never leaves the file
            </p>
            <p className="text-sm text-muted-foreground">
              Two of these files hold credentials:{" "}
              <code>osu!.&lt;username&gt;.cfg</code> on stable stores your osu!
              username and password, and <code>game.ini</code> on lazer stores
              your username and a live session token. This page reads the files
              in your browser, keeps only the settings listed below, and sends
              nothing else. Nothing is uploaded, nothing is saved, the file names
              are never shown, and those keys are never read at all.
            </p>
            <p className="text-sm font-medium text-foreground">
              Want to be completely sure? Make a copy of the file, delete the
              lines you would rather not hand over (<code>Username</code>,{" "}
              <code>Password</code>, <code>Token</code>,{" "}
              <code>BeatmapDirectory</code>), and import the copy. Only the
              settings lines are needed, so a stripped file imports just as well.
            </p>
            <p className="text-sm text-muted-foreground">
              By choosing a file you confirm you have checked what is in it, and
              you take responsibility for having uploaded it and for anything
              that follows.
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSentFieldsOpen(true)}
              >
                See exactly what is sent
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <p>
              osu! stable: <code>osu!.&lt;username&gt;.cfg</code>, inside your
              osu! folder.
            </p>
            <p>
              osu! lazer: <code>framework.ini</code> and <code>game.ini</code>,
              inside <code>%APPDATA%/osu</code>. Pick both at once. The first
              holds window, frame limiter and volume settings, the second holds
              cursor, dim, storyboard and offset.
            </p>
          </div>

          <OsuSettingsForm value={osuDraft} onChange={setOsuDraft} />

          <p className="text-sm text-muted-foreground">
            Controls you never touch stay unset and are not published.
          </p>

          <div>
            <Button type="button" onClick={saveOsuSettings} disabled={savingOsu}>
              {savingOsu ? <LoadingIcon /> : "Save osu! Settings"}
            </Button>
          </div>
        </section>

        <Dialog open={sentFieldsOpen} onOpenChange={setSentFieldsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>What is sent from your config file</DialogTitle>
              <DialogDescription>
                Only these settings. Everything else in the file is dropped
                while reading it, in your browser, before anything is sent.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              {PUBLISHED_FIELDS.map((group) => (
                <div key={group.group} className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {group.group}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {group.fields}
                  </span>
                </div>
              ))}

              <div className="flex flex-col gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                <span className="text-sm font-medium text-foreground">
                  Never read
                </span>
                <span className="text-sm text-muted-foreground">
                  {NEVER_READ_FIELDS.join(", ")}, the file name, and every other
                  key binding.
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-md border border-border bg-site-primary px-3 py-2">
                <span className="text-sm font-medium text-foreground">
                  If you want a guarantee that does not depend on us
                </span>
                <span className="text-sm text-muted-foreground">
                  Copy the file, delete the <code>Username</code>,{" "}
                  <code>Password</code>, <code>Token</code> and{" "}
                  <code>BeatmapDirectory</code> lines from the copy, and import
                  that instead. The import reads only the settings lines, so
                  nothing is lost.
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                Choosing a file is your decision: you confirm you have checked
                its contents and you take responsibility for having uploaded it
                and for anything that follows.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => setSentFieldsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={pendingTapKeys !== null}
          onOpenChange={(open) => !open && setPendingTapKeys(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Use these keys for your keyboard?</DialogTitle>
              <DialogDescription>
                Your osu! stable config lists these gameplay keys. They can
                replace the tap keys shown on your profile.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              {(pendingTapKeys ?? []).map((key) => (
                <Badge
                  key={key}
                  variant="secondary"
                  className="bg-site-primary text-accent-blue"
                >
                  {key}
                </Badge>
              ))}
            </div>

            {!keyboardId && (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t picked a device in the Keyboard section yet, so
                the keys won&apos;t show on your profile until you do.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingTapKeys(null)}
              >
                Keep current
              </Button>
              <Button type="button" onClick={applyImportedTapKeys}>
                Use these keys
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Layout */}
        <section
          id="profilelayout"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">
              Profile Layout
            </h2>
            <p className="text-sm text-muted-foreground">
              How your userpage is arranged for everyone who visits it
            </p>
          </div>
          <ProfileLayoutPicker
            value={profileLayout}
            onChange={changeProfileLayout}
          />

          {/* Only the side panel layout offers list and grid; big cover always
              uses its large cards, so the control is hidden rather than shown
              doing nothing. */}
          {layoutSupportsSkinView(profileLayout) && (
            <div
              id="skinview"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground">
                  Skin View
                </h3>
                <p className="text-sm text-muted-foreground">
                  Default view for the skins on your userpage
                </p>
              </div>
              <Select
                value={skinview?.value}
                onValueChange={(value) => {
                  const option =
                    select_options.find((o) => o.value === value) ?? null;
                  if (option) {
                    setSkinview(option);
                    saveSkinView(option);
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  {select_options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>

        {/* Socials */}
        <section
          id="connections"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">Socials</h2>
          <div className="flex flex-col gap-3">
            <ConnectionField
              name="twitch_connection"
              id="twitch_connection"
              social="twitch"
              inputValue={twitchData}
              setInputValue={setTwitchData}
              readOnly={isSaving}
            />
            <ConnectionField
              name="twitter_connection"
              id="twitter_connection"
              social="twitter"
              inputValue={twitterData}
              setInputValue={setTwitterData}
              readOnly={isSaving}
            />
            <ConnectionField
              name="youtube_connection"
              id="youtube_connection"
              social="youtube"
              inputValue={youtubeData}
              setInputValue={setYoutubeData}
              readOnly={isSaving}
            />
            <ConnectionField
              name="github_connection"
              id="github_connection"
              social="github"
              inputValue={githubData}
              setInputValue={setGithubData}
              readOnly={isSaving}
            />
            <ConnectionField
              name="discord_connection"
              id="discord_connection"
              social="discord"
              inputValue={discordData}
              setInputValue={setDiscordData}
              readOnly={isSaving}
            />
          </div>

          {connectionsChanged && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={saveConnectionsInputs}
                disabled={isSaving}
              >
                {isSaving ? <LoadingIcon /> : "Save Socials"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetConnectionsInputs}
                disabled={isSaving}
              >
                Reset Socials
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
