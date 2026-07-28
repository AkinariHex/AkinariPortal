"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Copy, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";
import moment from "moment/moment";
import ConnectionField from "@/components/ConnectionField/ConnectionField";
import LoadingIcon from "@/components/LoadingIcon/LoadingIcon";
import KeyboardView, {
  type KeyboardDevice,
} from "@/components/KeyboardView/KeyboardView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  generateApiKey,
  destroyApiKey,
  saveSkinView as saveSkinViewAction,
  saveSocials,
  saveTablet,
  saveKeyboard,
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

  const [skinview, setSkinview] = useState<any>(data.skin_view);

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

  const uploadTabletSettings = async (tabletFile: File) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const dataNow = Date.now();
        const uploadInfo = {
          file: tabletFile.name,
          date: dataNow,
        };
        const jsonFile = JSON.parse(e.target!.result as string);
        const tabletName = jsonFile.Profiles[0].Tablet;
        setTabletSettingsInfo(uploadInfo);

        const result = await saveTablet({
          tablet: tabletName,
          tabletSettingsFile: jsonFile,
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
      } catch {
        setTabletUploadError(true);
        toast.error("Invalid tablet settings file.");
      }
    };
    reader.readAsText(tabletFile);
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
            the exported .json file.
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
            <Select value={keyboardId} onValueChange={onSelectKeyboard}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Select your keyboard or keypad" />
              </SelectTrigger>
              <SelectContent>
                {keypads.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Keypads</SelectLabel>
                    {keypads.map((k) => (
                      <SelectItem key={String(k.id)} value={String(k.id)}>
                        {deviceLabel(k)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {fullKeyboards.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Keyboards</SelectLabel>
                    {fullKeyboards.map((k) => (
                      <SelectItem key={String(k.id)} value={String(k.id)}>
                        {deviceLabel(k)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
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

          {selectedDevice && (
            <>
              {hasLayout ? (
                <p className="text-sm text-muted-foreground">
                  Click the keys you tap on to highlight them.
                </p>
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

        {/* Skin View */}
        <section
          id="skinview"
          className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Skin View</h2>
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
          <p className="text-sm text-muted-foreground">
            Default view for skins of your userpage
          </p>
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
