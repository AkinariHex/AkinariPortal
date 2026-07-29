"use client";

import { Download, Pencil, Share2, Trash2 } from "lucide-react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  skin: any;
  isOwner: boolean;
  shareUrl: string;
  onEdit: (skin: any) => void;
  onDelete: (id: any) => void;
  onDownload: (skin: any) => void;
  /**
   * "icons" - equal icon buttons, used where space is tight.
   * "wide"  - labelled download button plus icon buttons on a glass surface.
   */
  variant?: "icons" | "wide";
  className?: string;
};

const ICON_BTN =
  "flex cursor-pointer items-center justify-center rounded-md transition-colors active:scale-95";

export default function SkinActions({
  skin,
  isOwner,
  shareUrl,
  onEdit,
  onDelete,
  onDownload,
  variant = "icons",
  className,
}: Props) {
  const wide = variant === "wide";
  const surface = wide
    ? "bg-white/[0.14] backdrop-blur-sm hover:bg-white/[0.24]"
    : "bg-white/[0.05] hover:bg-white/[0.12]";

  return (
    <div className={cn("flex flex-row items-center gap-1.5", className)}>
      <button
        type="button"
        aria-label="Download skin"
        onClick={() => onDownload(skin)}
        className={cn(
          ICON_BTN,
          surface,
          wide
            ? "flex-1 gap-1.5 py-2 text-[0.85rem] text-white"
            : "flex-1 py-1.5 text-[#a9b8ca]"
        )}
      >
        <Download className="size-4" />
        {wide && "Download"}
      </button>

      <CopyToClipboard text={shareUrl} onCopy={() => toast.success("Link copied")}>
        <button
          type="button"
          aria-label="Share skin"
          className={cn(
            ICON_BTN,
            surface,
            wide ? "p-2 text-white" : "flex-1 py-1.5 text-[#a9b8ca]"
          )}
        >
          <Share2 className="size-4" />
        </button>
      </CopyToClipboard>

      {isOwner && (
        <>
          <button
            type="button"
            aria-label="Edit skin"
            onClick={() => onEdit(skin)}
            className={cn(
              ICON_BTN,
              surface,
              "text-[#fee7ad]",
              wide ? "p-2" : "flex-1 py-1.5"
            )}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Delete skin"
            onClick={() => onDelete(skin.id)}
            className={cn(
              ICON_BTN,
              surface,
              "text-[#ffb2b2]",
              wide ? "p-2" : "flex-1 py-1.5"
            )}
          >
            <Trash2 className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
