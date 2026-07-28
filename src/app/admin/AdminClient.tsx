"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBadge,
  updateBadge,
  deleteBadge,
  reorderBadges,
  grantBadge,
  grantBadgeBatch,
  revokeBadge,
  getUserBadges,
} from "./actions";
import type { BadgeHoldersMap } from "./data";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

type Badge = { id: string | number; title: string };

type UserBadgeState = {
  hasAccount: boolean;
  assigned: (string | number)[];
  pending: (string | number)[];
};

const activeBadgeClass = "border-transparent bg-accent-blue/20 text-accent-blue";
const pendingBadgeClass = "border-transparent bg-amber-400/20 text-amber-400";

export default function AdminClient({
  badges,
  holders,
}: {
  badges: Badge[];
  holders: BadgeHoldersMap;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 pt-24 pb-16 text-foreground">
      <h1 className="text-3xl font-bold">Admin</h1>
      <BadgeDefinitions
        badges={badges}
        holders={holders}
        onChanged={() => router.refresh()}
      />
      <GrantModify badges={badges} />
      <BatchGrant badges={badges} onChanged={() => router.refresh()} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5 rounded-xl bg-site-primary p-[18px] shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function BatchGrant({
  badges,
  onChanged,
}: {
  badges: Badge[];
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [badgeId, setBadgeId] = useState<string>("");
  const [raw, setRaw] = useState("");

  const parseIds = (text: string) =>
    Array.from(
      new Set(
        text
          .split(/[\s,;]+/)
          .map((x) => x.trim())
          .filter(Boolean)
      )
    );

  const handleGrant = () => {
    const id = badgeId || (badges[0] ? String(badges[0].id) : "");
    if (!id) {
      toast.error("Pick a badge.");
      return;
    }
    const ids = parseIds(raw);
    if (ids.length === 0) {
      toast.error("Enter at least one osu! user id.");
      return;
    }
    startTransition(async () => {
      const res = await grantBadgeBatch(ids, id);
      if (res.status === "done") {
        const parts = [
          `${res.granted}/${res.results.length} granted`,
          `${res.active} active`,
          `${res.pending} pending`,
        ];
        if (res.failed.length) parts.push(`failed: ${res.failed.join(", ")}`);
        const text = parts.join(" / ");
        if (res.failed.length) toast.error(text);
        else toast.success(text);
        onChanged();
      } else {
        toast.error(`Batch grant failed (${res.status}).`);
      }
    });
  };

  const count = parseIds(raw).length;

  return (
    <Section title="Batch grant a badge">
      <div className="flex flex-row flex-wrap items-center gap-2.5">
        <Select value={badgeId} onValueChange={setBadgeId}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[240px]">
            <SelectValue
              placeholder={
                badges[0]
                  ? `#${badges[0].id} - ${badges[0].title}`
                  : "No badges"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {badges.map((b) => (
              <SelectItem key={String(b.id)} value={String(b.id)}>
                #{b.id} - {b.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="osu! user ids separated by spaces, commas or new lines"
        rows={5}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="resize-y"
      />

      <div className="flex flex-row flex-wrap items-center gap-2.5">
        <Badge variant="secondary" className="cursor-default">
          {count} ids
        </Badge>
        <Button
          onClick={handleGrant}
          disabled={pending || badges.length === 0}
        >
          Grant to all
        </Button>
      </div>
    </Section>
  );
}

function SortableBadgeRow({
  badge,
  holders,
  pending,
  onEditTitle,
  onRename,
  onDelete,
}: {
  badge: Badge;
  holders: BadgeHoldersMap;
  pending: boolean;
  onEditTitle: (id: string | number, value: string) => void;
  onRename: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(badge.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 1 : undefined,
  };

  const list = holders[String(badge.id)] ?? [];

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-row flex-wrap items-center gap-3 rounded-lg bg-site-secondary px-3 py-2.5"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="h-10 w-[86px] shrink-0 rounded bg-black/20 object-contain"
        src={`/img/badges/${badge.id}.webp`}
        alt={badge.title}
        width={86}
        height={40}
      />
      <div className="flex min-w-0 flex-1 flex-row items-center gap-2.5 max-sm:order-2 max-sm:basis-full">
        <span className="shrink-0 text-sm font-semibold text-accent-blue">
          #{badge.id}
        </span>
        <Input
          className="bg-site-primary"
          defaultValue={badge.title}
          onChange={(e) => onEditTitle(badge.id, e.target.value)}
        />
      </div>
      <div className="flex shrink-0 flex-row items-center gap-2 max-sm:order-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-default bg-site-primary">
              {list.length} {list.length === 1 ? "player" : "players"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[280px] text-left">
            {list.length === 0 ? (
              "No players have this badge yet."
            ) : (
              <div className="flex flex-col gap-0.5">
                {list.map((h) => (
                  <span key={h.id}>
                    {h.name ?? `#${h.id}`}
                    {h.pending && (
                      <em className="ml-1 opacity-70">(pending)</em>
                    )}
                  </span>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
        <Button
          variant="secondary"
          onClick={() => onRename(badge.id)}
          disabled={pending}
        >
          Rename
        </Button>
        <Button
          variant="destructive"
          onClick={() => onDelete(badge.id)}
          disabled={pending}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

function BadgeDefinitions({
  badges,
  holders,
  onChanged,
}: {
  badges: Badge[];
  holders: BadgeHoldersMap;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [newId, setNewId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [ordered, setOrdered] = useState<Badge[]>(badges);

  useEffect(() => {
    setOrdered(badges);
  }, [badges]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((b) => String(b.id) === String(active.id));
    const newIndex = ordered.findIndex((b) => String(b.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    const newIds = next.map((b) => b.id);
    startTransition(async () => {
      const res = await reorderBadges(newIds);
      if (res.status !== "done") {
        toast.error("Reorder failed");
        onChanged();
      } else {
        toast.success("Order saved");
      }
    });
  };

  const handleCreate = () => {
    if (!newId.trim() || !newTitle.trim()) {
      toast.error("Both id and title are required.");
      return;
    }
    startTransition(async () => {
      const res = await createBadge({ id: newId.trim(), title: newTitle.trim() });
      if (res.status === "done") {
        toast.success(`Badge "${newTitle.trim()}" created.`);
        setNewId("");
        setNewTitle("");
        onChanged();
      } else {
        toast.error(`Create failed (${res.status}).`);
      }
    });
  };

  const handleRename = (id: string | number) => {
    const title = (edits[String(id)] ?? "").trim();
    if (!title) {
      toast.error("Title cannot be empty.");
      return;
    }
    startTransition(async () => {
      const res = await updateBadge({ id, title });
      if (res.status === "done") {
        toast.success(`Badge #${id} renamed.`);
        onChanged();
      } else {
        toast.error(`Rename failed (${res.status}).`);
      }
    });
  };

  const handleDelete = (id: string | number) => {
    startTransition(async () => {
      const res = await deleteBadge(id);
      if (res.status === "done") {
        toast.success(`Badge #${id} deleted.`);
        onChanged();
      } else {
        toast.error(`Delete failed (${res.status}).`);
      }
    });
  };

  return (
    <Section title="Badge definitions">
      <div className="flex flex-row flex-wrap items-center gap-2.5">
        <Input
          className="flex-1 basis-40 bg-site-secondary"
          placeholder="id (matches image filename)"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <Input
          className="flex-1 basis-40 bg-site-secondary"
          placeholder="title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button onClick={handleCreate} disabled={pending}>
          Create badge
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ordered.map((b) => String(b.id))}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex list-none flex-col gap-2 p-0">
            {ordered.map((b) => (
              <SortableBadgeRow
                key={String(b.id)}
                badge={b}
                holders={holders}
                pending={pending}
                onEditTitle={(id, value) =>
                  setEdits((s) => ({ ...s, [String(id)]: value }))
                }
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
            {ordered.length === 0 && (
              <li className="px-0.5 py-2 text-sm text-muted-foreground">
                No badges yet.
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </Section>
  );
}

function GrantModify({ badges }: { badges: Badge[] }) {
  const [pending, startTransition] = useTransition();
  const [osuId, setOsuId] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [state, setState] = useState<UserBadgeState | null>(null);

  const load = (idArg?: string) => {
    const id = (idArg ?? osuId).trim();
    if (!id) {
      toast.error("Enter an osu! user id.");
      return;
    }
    startTransition(async () => {
      const res = await getUserBadges(id);
      if (res.status === "done") {
        setState({
          hasAccount: res.hasAccount,
          assigned: res.assigned,
          pending: res.pending,
        });
        setLoadedId(id);
      } else {
        toast.error(`Load failed (${res.status}).`);
      }
    });
  };

  const isPresent = (badgeId: string | number) =>
    !!state &&
    (state.assigned.some((x) => String(x) === String(badgeId)) ||
      state.pending.some((x) => String(x) === String(badgeId)));

  const toggle = (badgeId: string | number) => {
    if (!loadedId) return;
    const present = isPresent(badgeId);
    startTransition(async () => {
      const res = present
        ? await revokeBadge(loadedId, badgeId)
        : await grantBadge(loadedId, badgeId);
      if (res.status === "done") {
        toast.success(
          present
            ? `Revoked badge #${badgeId}.`
            : `Granted badge #${badgeId}${
                "placement" in res ? ` (${res.placement})` : ""
              }.`
        );
        load(loadedId);
      } else {
        toast.error(`Action failed (${res.status}).`);
      }
    });
  };

  const statusFor = (badgeId: string | number): "active" | "pending" | null => {
    if (!state) return null;
    if (state.assigned.some((x) => String(x) === String(badgeId))) return "active";
    if (state.pending.some((x) => String(x) === String(badgeId))) return "pending";
    return null;
  };

  return (
    <Section title="Grant / modify user badges">
      <div className="flex flex-row flex-wrap items-center gap-2.5">
        <Input
          className="flex-1 basis-40 bg-site-secondary"
          placeholder="osu! user id"
          value={osuId}
          onChange={(e) => setOsuId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <Button onClick={() => load()} disabled={pending}>
          Load
        </Button>
      </div>

      {state && loadedId && (
        <>
          <p className="text-sm">
            User <strong>{loadedId}</strong>:{" "}
            {state.hasAccount ? (
              <Badge variant="secondary" className={activeBadgeClass}>
                has a site account
              </Badge>
            ) : (
              <Badge variant="secondary" className={pendingBadgeClass}>
                no site account (grants go to pending)
              </Badge>
            )}
          </p>

          <ul className="flex list-none flex-col gap-2 p-0">
            {badges.map((b) => {
              const st = statusFor(b.id);
              const present = st !== null;
              return (
                <li
                  key={String(b.id)}
                  className="flex flex-row flex-wrap items-center gap-3 rounded-lg bg-site-secondary px-3 py-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="h-10 w-[86px] shrink-0 rounded bg-black/20 object-contain"
                    src={`/img/badges/${b.id}.webp`}
                    alt={b.title}
                    width={86}
                    height={40}
                  />
                  <div className="flex min-w-0 flex-1 flex-row items-center gap-2.5">
                    <span className="shrink-0 text-sm font-semibold text-accent-blue">
                      #{b.id}
                    </span>
                    <span className="text-base">{b.title}</span>
                  </div>
                  <div className="flex shrink-0 flex-row items-center gap-2">
                    {st === "active" && (
                      <Badge variant="secondary" className={activeBadgeClass}>
                        active
                      </Badge>
                    )}
                    {st === "pending" && (
                      <Badge variant="secondary" className={pendingBadgeClass}>
                        pending
                      </Badge>
                    )}
                    <Button
                      variant={present ? "destructive" : "default"}
                      onClick={() => toggle(b.id)}
                      disabled={pending}
                    >
                      {present ? "Revoke" : "Grant"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Section>
  );
}
