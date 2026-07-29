// Which layout a user's public profile renders with. Stored on users.profile_layout.
export const PROFILE_LAYOUTS = [
  {
    value: "rail",
    label: "Rail",
    description:
      "Identity, socials and gear stay pinned in a side rail while your skins scroll.",
  },
  {
    value: "editorial",
    label: "Editorial",
    description:
      "Full-width cover with your name in large type, then tabs for skins and setup.",
  },
] as const;

export type ProfileLayout = (typeof PROFILE_LAYOUTS)[number]["value"];

export const DEFAULT_PROFILE_LAYOUT: ProfileLayout = "rail";

// Contract every profile layout renders against. ProfileClient owns the state
// and the mutations; a layout only decides how it all looks.
export type ProfileLayoutProps = {
  userData: any;
  skinsData: any[];
  isOwner: boolean;
  sessionId: string | null;
  skinView: "list" | "grid";
  setSkinView: (view: "list" | "grid") => void;
  shareUrl: (skinId: any) => string;
  onAddSkin: () => void;
  onEditSkin: (skin: any) => void;
  onDeleteSkin: (id: any) => void;
  onDownloadSkin: (skin: any) => void;
  onDownloadTabletSettings: () => void;
};

export function normalizeProfileLayout(value: unknown): ProfileLayout {
  return PROFILE_LAYOUTS.some((l) => l.value === value)
    ? (value as ProfileLayout)
    : DEFAULT_PROFILE_LAYOUT;
}
