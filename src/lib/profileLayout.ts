// Which layout a user's public profile renders with. Stored on users.profile_layout.
export const PROFILE_LAYOUTS = [
  {
    value: "side-panel",
    label: "Side panel",
    description:
      "Your name, socials and gear stay in a panel on the left while your skins scroll beside it.",
    /** Only this layout lets visitors switch between the list and grid views. */
    supportsSkinView: true,
  },
  {
    value: "big-cover",
    label: "Big cover",
    description:
      "A full width cover photo with your name in large type, then tabs for skins and setup.",
    supportsSkinView: false,
  },
] as const;

export type ProfileLayout = (typeof PROFILE_LAYOUTS)[number]["value"];

export const DEFAULT_PROFILE_LAYOUT: ProfileLayout = "side-panel";

export function layoutSupportsSkinView(layout: ProfileLayout) {
  return (
    PROFILE_LAYOUTS.find((l) => l.value === layout)?.supportsSkinView ?? false
  );
}

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
