"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSkin, updateSkin } from "@/app/users/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ModalProps {
  openModal: (open: boolean) => void;
  skinToEdit?: any;
  skinToEditStatus: (skin?: any) => void;
  sessionUser?: any;
}

function tagLabel(tag: string) {
  if (tag === "current") return "Currently Using";
  if (tag === "tournaments") return "Using in Tournaments";
  return tag[0].toUpperCase() + tag.substring(1);
}

function SortableTag({
  tag,
  onRemove,
}: {
  tag: string;
  onRemove: (tag: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        "tag cursor-grab touch-none gap-2 active:cursor-grabbing",
        tag,
        isDragging && "z-10 opacity-80 shadow-lg"
      )}
    >
      {tagLabel(tag)}
      <button
        type="button"
        aria-label={`Remove ${tagLabel(tag)}`}
        className="flex cursor-pointer items-center"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(tag);
        }}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

const MODE_ICONS: Record<string, { src: string; rotate?: boolean }> = {
  "osu!standard": { src: "/img/modes/mode-osu.png" },
  "osu!mania": { src: "/img/modes/mode-mania.png" },
  "osu!taiko": { src: "/img/modes/mode-taiko.png" },
  "osu!ctb": { src: "/img/modes/mode-fruits.png", rotate: true },
};

function Modal({
  openModal,
  skinToEdit,
  skinToEditStatus,
  sessionUser,
}: ModalProps) {
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [inputNameError, setInputNameError] = useState(false);
  const [inputAuthorError, setInputAuthorError] = useState(false);
  const [inputURLError, setInputURLError] = useState(false);
  const [inputURLNot, setInputURLNot] = useState(false);
  const [inputBgURLNot] = useState(false);

  const [skinName, setSkinName] = useState(
    skinToEdit != null ? skinToEdit?.Name : ""
  );
  const [skinNameLength, setSkinNameLength] = useState(
    skinToEdit != null ? skinToEdit?.Name.length : 0
  );
  const [skinAuthor, setSkinAuthor] = useState(
    skinToEdit != null ? skinToEdit?.Creator : ""
  );
  const [skinAuthorLength, setSkinAuthorLength] = useState(
    skinToEdit != null ? skinToEdit?.Creator.length : 0
  );
  const [skinURL, setSkinURL] = useState(
    skinToEdit != null ? skinToEdit?.URL : ""
  );
  const [skinBgURL, setSkinBgURL] = useState(
    skinToEdit != null ? skinToEdit?.Banner : ""
  );

  const [selectedTags, setSelectedTags] = useState<any[]>(
    skinToEdit != null ? JSON.parse(skinToEdit?.Tags) : []
  );
  const [availableTags, setAvailableTags] = useState([
    "lazer",
    "current",
    "tournaments",
    "casual",
    "old",
    "aim",
    "stream",
    "tech",
    "reading",
    "speed",
    "highAR",
    "lowAR",
    "highCS",
    "lowCS",
    "troll",
    "NM",
    "HD",
    "HR",
    "DT",
    "EZ",
    "FL",
  ]);

  const [selectedModes, setSelectedModes] = useState<any[]>(
    skinToEdit != null ? JSON.parse(skinToEdit?.Modes) : []
  );
  const [availableModes, setAvailableModes] = useState([
    "osu!standard",
    "osu!mania",
    "osu!taiko",
    "osu!ctb",
  ]);

  async function postSkinToDB() {
    skinName === "" ? setInputNameError(true) : setInputNameError(false);
    skinAuthor === "" ? setInputAuthorError(true) : setInputAuthorError(false);
    skinURL === "" ? setInputURLError(true) : setInputURLError(false);

    const matchURL = skinURL.match(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );

    !matchURL ? setInputURLNot(true) : setInputURLNot(false);

    if (
      skinName !== "" &&
      skinNameLength <= 45 &&
      skinAuthor !== "" &&
      skinAuthorLength <= 25 &&
      skinURL !== "" &&
      matchURL
    ) {
      // Owner is NOT sent: the server action derives it from the session.
      const values = {
        name: skinName,
        creator: skinAuthor,
        bg: skinBgURL,
        modes: JSON.stringify(selectedModes),
        tags: JSON.stringify(selectedTags),
        url: skinURL,
      };

      try {
        const submit =
          skinToEdit != null
            ? await updateSkin({ ...values, id: skinToEdit.id })
            : await createSkin(values);

        if (submit.status === "done") {
          openModal(false);
          skinToEditStatus();
          router.refresh();
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      return;
    }
  }

  useEffect(() => {
    if (skinToEdit != null) {
      JSON.parse(skinToEdit?.Tags).forEach((tag: string) => {
        setAvailableTags((prev) => prev.filter((item) => item !== tag));
      });
      JSON.parse(skinToEdit?.Modes).forEach((tag: string) => {
        setAvailableModes((prev) => prev.filter((item) => item !== tag));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    openModal(false);
    skinToEditStatus();
  }

  function addTag(tag: string) {
    setSelectedTags((prev) => [...prev, tag]);
    setAvailableTags((prev) => prev.filter((item) => item !== tag));
  }

  function removeTag(tag: string) {
    setAvailableTags((prev) => [...prev, tag]);
    setSelectedTags((prev) => prev.filter((item) => item !== tag));
  }

  function handleTagDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedTags((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] gap-3 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {skinToEdit != null ? "Edit skin" : "Add a new skin"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill in the skin details, tags and gamemodes, then submit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Name + Author */}
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="skinName">
                Name *
                {inputNameError && (
                  <span className="text-[8pt] font-normal text-destructive">
                    Cannot be empty
                  </span>
                )}
              </Label>
              <div className="flex flex-row">
                <Input
                  id="skinName"
                  name="skinName"
                  value={skinName}
                  className="rounded-r-none"
                  onChange={(e) => {
                    setSkinName(e.target.value);
                    setSkinNameLength(e.target.value.length);
                  }}
                />
                <div className="flex h-9 w-[4.5em] shrink-0 items-center justify-center gap-1 rounded-r-md bg-[#4a5868] text-[9.2pt] tabular-nums text-[#bedcff]">
                  <span
                    className={cn(skinNameLength > 45 && "text-[#ffbedc]")}
                  >
                    {skinNameLength}
                  </span>
                  <span>/45</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="skinAuthor">
                Author *
                {inputAuthorError && (
                  <span className="text-[8pt] font-normal text-destructive">
                    Cannot be empty
                  </span>
                )}
              </Label>
              <div className="flex flex-row">
                <Input
                  id="skinAuthor"
                  name="skinAuthor"
                  value={skinAuthor}
                  className="rounded-r-none"
                  onChange={(e) => {
                    setSkinAuthor(e.target.value);
                    setSkinAuthorLength(e.target.value.length);
                  }}
                />
                <div className="flex h-9 w-[4.5em] shrink-0 items-center justify-center gap-1 rounded-r-md bg-[#4a5868] text-[9.2pt] tabular-nums text-[#bedcff]">
                  <span
                    className={cn(skinAuthorLength > 25 && "text-[#ffbedc]")}
                  >
                    {skinAuthorLength}
                  </span>
                  <span>/25</span>
                </div>
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="skinURL">
                Download URL *
                {inputURLError && (
                  <span className="text-[8pt] font-normal text-destructive">
                    Cannot be empty
                  </span>
                )}
                {inputURLNot && !inputURLError && (
                  <span className="text-[8pt] font-normal text-destructive">
                    Invalid URL
                  </span>
                )}
              </Label>
              <Input
                id="skinURL"
                name="skinURL"
                type="url"
                value={skinURL}
                onChange={(e) => setSkinURL(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="skinBgURL" className="flex-wrap">
                Background Image URL
                <span className="text-[8pt] font-normal text-muted-foreground">
                  (Preferably in-game screen)
                </span>
                {inputBgURLNot && (
                  <span className="text-[8pt] font-normal text-destructive">
                    Invalid URL
                  </span>
                )}
              </Label>
              <Input
                id="skinBgURL"
                name="skinBgURL"
                type="url"
                value={skinBgURL}
                onChange={(e) => setSkinBgURL(e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="skinTags" className="flex-wrap">
              Tags
              <span className="text-[8pt] font-normal text-muted-foreground">
                (Make sure to use &quot;Currently Using&quot; tag only with one
                skin)
              </span>
            </Label>
            <div className="flex flex-col gap-2 rounded-md bg-[#2c343e] p-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8pt] font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected
                  <span className="ml-1 font-normal normal-case">
                    (drag to reorder)
                  </span>
                </span>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleTagDragEnd}
                >
                  <SortableContext
                    items={selectedTags}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex min-h-9 flex-row flex-wrap items-center gap-2 gap-y-2 py-2">
                      {selectedTags.length === 0 && (
                        <span className="text-[8pt] text-muted-foreground/70">
                          No tags selected yet
                        </span>
                      )}
                      {selectedTags.map((tag) => (
                        <SortableTag key={tag} tag={tag} onRemove={removeTag} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
              <div className="flex flex-col gap-1 border-t border-white/5 pt-1">
                <span className="text-[8pt] font-semibold uppercase tracking-wide text-muted-foreground">
                  Available
                </span>
                <div className="flex min-h-9 flex-row flex-wrap items-center gap-2 gap-y-2 py-2">
                  {availableTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={cn(
                        "tag cursor-pointer opacity-70 ring-1 ring-inset ring-white/10 transition-opacity hover:opacity-100",
                        tag
                      )}
                      onClick={() => addTag(tag)}
                    >
                      {tagLabel(tag)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modes */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="skinModes">Modes *</Label>
            <div className="flex flex-col rounded-md bg-[#2c343e]">
              <div className="flex min-h-9 flex-row flex-wrap items-center gap-2 px-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]">
                {selectedModes.map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    className="tag skinMode cursor-pointer gap-[5px]"
                    onClick={() => {
                      setAvailableModes((prev) => [...prev, mode]);
                      setSelectedModes(
                        selectedModes.filter((item) => item !== mode)
                      );
                    }}
                  >
                    {MODE_ICONS[mode] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={MODE_ICONS[mode].src}
                        alt={mode}
                        className="w-[18px] brightness-100"
                        style={
                          MODE_ICONS[mode].rotate
                            ? { rotate: "-90deg" }
                            : undefined
                        }
                      />
                    )}
                    {mode}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
              <div className="flex flex-row flex-wrap items-center gap-2 p-2">
                {availableModes.map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    className="tag skinMode cursor-pointer gap-[5px]"
                    onClick={() => {
                      setSelectedModes((prev) => [...prev, mode]);
                      setAvailableModes(
                        availableModes.filter((item) => item !== mode)
                      );
                    }}
                  >
                    {MODE_ICONS[mode] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={MODE_ICONS[mode].src}
                        alt={mode}
                        className="w-[18px] brightness-100"
                        style={
                          MODE_ICONS[mode].rotate
                            ? { rotate: "-90deg" }
                            : undefined
                        }
                      />
                    )}
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={postSkinToDB}
            className="mt-1 h-9 w-full bg-[#40618e] font-medium text-[#ddd] hover:bg-[#46699a] active:scale-[0.99]"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
