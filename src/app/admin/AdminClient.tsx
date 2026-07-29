"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  createKeyboard,
  updateKeyboard,
  deleteKeyboard,
  resolveKeyboardRequest,
  deleteKeyboardRequest,
} from "./actions";
import type { BadgeHoldersMap } from "./data";
import KeyboardView, {
  type KeyboardDevice,
} from "@/components/KeyboardView/KeyboardView";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  keyboards = [],
  keyboardRequests = [],
}: {
  badges: Badge[];
  holders: BadgeHoldersMap;
  keyboards?: KeyboardDevice[];
  keyboardRequests?: any[];
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
      <Keyboards keyboards={keyboards} onChanged={() => router.refresh()} />
      <KeyboardRequests
        requests={keyboardRequests}
        onChanged={() => router.refresh()}
      />
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

const keyboardTypeClass = "border-transparent bg-accent-blue/20 text-accent-blue";
const keypadTypeClass = "border-transparent bg-amber-400/20 text-amber-400";

function parseUsbId(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) ? n : null;
}

function parseLayout(raw: string): { ok: true; value: unknown } | { ok: false } {
  const text = raw.trim();
  if (!text) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function KeyboardRow({
  device,
  pending,
  onSave,
  onDelete,
}: {
  device: KeyboardDevice;
  pending: boolean;
  onSave: (input: {
    id: string;
    name: string;
    brand: string;
    type: string;
    layout: unknown;
    model_url: string;
    vendor_id: number | null;
    product_id: number | null;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(device.name ?? "");
  const [brand, setBrand] = useState(device.brand ?? "");
  const [type, setType] = useState(device.type === "keypad" ? "keypad" : "keyboard");
  const [layout, setLayout] = useState(
    device.layout ? JSON.stringify(device.layout, null, 2) : ""
  );
  const [modelUrl, setModelUrl] = useState(device.model_url ?? "");
  const [vendorId, setVendorId] = useState(
    (device as any).vendor_id != null ? String((device as any).vendor_id) : ""
  );
  const [productId, setProductId] = useState(
    (device as any).product_id != null ? String((device as any).product_id) : ""
  );

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const parsed = parseLayout(layout);
    if (!parsed.ok) {
      toast.error("Invalid layout JSON");
      return;
    }
    onSave({
      id: String(device.id),
      name: name.trim(),
      brand: brand.trim(),
      type,
      layout: parsed.value,
      model_url: modelUrl.trim(),
      vendor_id: parseUsbId(vendorId),
      product_id: parseUsbId(productId),
    });
    setEditing(false);
  };

  return (
    <li className="flex flex-col gap-3 rounded-lg bg-site-secondary px-3 py-2.5">
      <div className="flex flex-row flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-medium">
            {device.brand ? `${device.brand} - ${device.name}` : device.name}
          </span>
          <span className="text-xs text-muted-foreground">#{device.id}</span>
        </div>
        <Badge
          variant="secondary"
          className={device.type === "keypad" ? keypadTypeClass : keyboardTypeClass}
        >
          {device.type === "keypad" ? "keypad" : "keyboard"}
        </Badge>
        <Button
          variant="secondary"
          onClick={() => setEditing((s) => !s)}
          disabled={pending}
        >
          {editing ? "Cancel" : "Edit"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => onDelete(String(device.id))}
          disabled={pending}
        >
          Delete
        </Button>
      </div>

      {editing && (
        <div className="flex flex-col gap-2.5 border-t border-white/5 pt-3">
          <div className="flex flex-row flex-wrap items-center gap-2.5">
            <Input
              className="flex-1 basis-40 bg-site-primary"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              className="flex-1 basis-40 bg-site-primary"
              placeholder="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyboard">keyboard</SelectItem>
                <SelectItem value="keypad">keypad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            className="bg-site-primary"
            placeholder="model_url (image)"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
          />
          <div className="flex flex-row flex-wrap items-center gap-2.5">
            <Input
              className="flex-1 basis-40 bg-site-primary"
              type="number"
              inputMode="numeric"
              placeholder="vendor_id (decimal, optional)"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            />
            <Input
              className="flex-1 basis-40 bg-site-primary"
              type="number"
              inputMode="numeric"
              placeholder="product_id (decimal, optional)"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </div>
          <Textarea
            className="resize-y bg-site-primary font-mono text-xs"
            placeholder='layout JSON, e.g. {"rows":[[{"label":"Z"},{"label":"X"}]]}'
            rows={4}
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
          />
          <div className="flex flex-row flex-wrap items-center gap-2.5">
            <Button onClick={handleSave} disabled={pending}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function Keyboards({
  keyboards,
  onChanged,
}: {
  keyboards: KeyboardDevice[];
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("keyboard");
  const [layout, setLayout] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [productId, setProductId] = useState("");

  const previewLayout = useMemo(() => {
    const parsed = parseLayout(layout);
    if (!parsed.ok || !parsed.value) return null;
    return parsed.value as KeyboardDevice["layout"];
  }, [layout]);

  const handleCreate = () => {
    if (!id.trim() || !name.trim()) {
      toast.error("Both id and name are required.");
      return;
    }
    const parsed = parseLayout(layout);
    if (!parsed.ok) {
      toast.error("Invalid layout JSON");
      return;
    }
    startTransition(async () => {
      const res = await createKeyboard({
        id: id.trim(),
        name: name.trim(),
        brand: brand.trim(),
        type,
        layout: parsed.value,
        model_url: modelUrl.trim(),
        vendor_id: parseUsbId(vendorId),
        product_id: parseUsbId(productId),
      });
      if (res.status === "done") {
        toast.success(`Keyboard "${name.trim()}" created.`);
        setId("");
        setName("");
        setBrand("");
        setType("keyboard");
        setLayout("");
        setModelUrl("");
        setVendorId("");
        setProductId("");
        onChanged();
      } else {
        toast.error(`Create failed (${res.status}).`);
      }
    });
  };

  const handleUpdate = (input: {
    id: string;
    name: string;
    brand: string;
    type: string;
    layout: unknown;
    model_url: string;
    vendor_id: number | null;
    product_id: number | null;
  }) => {
    startTransition(async () => {
      const res = await updateKeyboard(input);
      if (res.status === "done") {
        toast.success(`Keyboard #${input.id} updated.`);
        onChanged();
      } else {
        toast.error(`Update failed (${res.status}).`);
      }
    });
  };

  const handleDelete = (deviceId: string) => {
    startTransition(async () => {
      const res = await deleteKeyboard(deviceId);
      if (res.status === "done") {
        toast.success(`Keyboard #${deviceId} deleted.`);
        onChanged();
      } else {
        toast.error(`Delete failed (${res.status}).`);
      }
    });
  };

  return (
    <Section title="Keyboards">
      <div className="flex flex-col gap-2.5 rounded-lg bg-site-secondary p-3">
        <div className="flex flex-row flex-wrap items-center gap-2.5">
          <Input
            className="flex-1 basis-32 bg-site-primary"
            placeholder="id (unique)"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <Input
            className="flex-1 basis-40 bg-site-primary"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="flex-1 basis-40 bg-site-primary"
            placeholder="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keyboard">keyboard</SelectItem>
              <SelectItem value="keypad">keypad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          className="bg-site-primary"
          placeholder="model_url (image, optional)"
          value={modelUrl}
          onChange={(e) => setModelUrl(e.target.value)}
        />
        <div className="flex flex-row flex-wrap items-center gap-2.5">
          <Input
            className="flex-1 basis-40 bg-site-primary"
            type="number"
            inputMode="numeric"
            placeholder="vendor_id (decimal, optional)"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
          />
          <Input
            className="flex-1 basis-40 bg-site-primary"
            type="number"
            inputMode="numeric"
            placeholder="product_id (decimal, optional)"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
        </div>
        <Textarea
          className="resize-y bg-site-primary font-mono text-xs"
          placeholder='layout JSON (optional), e.g. {"rows":[[{"label":"Z"},{"label":"X"}]]}'
          rows={4}
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
        />
        {previewLayout && (
          <div className="rounded-md bg-site-primary p-4">
            <KeyboardView device={{ id: "preview", name, layout: previewLayout }} />
          </div>
        )}
        <div>
          <Button onClick={handleCreate} disabled={pending}>
            Create keyboard
          </Button>
        </div>
      </div>

      <ul className="flex list-none flex-col gap-2 p-0">
        {keyboards.map((k) => (
          <KeyboardRow
            key={String(k.id)}
            device={k}
            pending={pending}
            onSave={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
        {keyboards.length === 0 && (
          <li className="px-0.5 py-2 text-sm text-muted-foreground">
            No keyboards yet.
          </li>
        )}
      </ul>
    </Section>
  );
}

const requestDoneClass = "border-transparent bg-accent-blue/20 text-accent-blue";
const requestPendingClass =
  "border-transparent bg-amber-400/20 text-amber-400";

function slugifyDeviceId(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function KeyboardRequests({
  requests,
  onChanged,
}: {
  requests: any[];
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [addTarget, setAddTarget] = useState<any | null>(null);
  const [addId, setAddId] = useState("");
  const [addName, setAddName] = useState("");
  const [addBrand, setAddBrand] = useState("");
  const [addType, setAddType] = useState("keyboard");

  const handleResolve = (id: number | string) => {
    startTransition(async () => {
      const res = await resolveKeyboardRequest(id);
      if (res.status === "done") {
        toast.success(`Request #${id} marked done.`);
        onChanged();
      } else {
        toast.error(`Action failed (${res.status}).`);
      }
    });
  };

  const handleDelete = (id: number | string) => {
    startTransition(async () => {
      const res = await deleteKeyboardRequest(id);
      if (res.status === "done") {
        toast.success(`Request #${id} deleted.`);
        onChanged();
      } else {
        toast.error(`Delete failed (${res.status}).`);
      }
    });
  };

  const openAddDialog = (r: any) => {
    setAddTarget(r);
    setAddName(r.name ?? "");
    setAddBrand(r.brand ?? "");
    setAddType(r.type === "keypad" ? "keypad" : "keyboard");
    setAddId(
      slugifyDeviceId(`${r.brand ?? ""} ${r.name ?? ""}`) || `kbd-${r.id}`
    );
  };

  const handleAddToCatalog = () => {
    if (!addTarget) return;
    const id = addId.trim();
    const name = addName.trim();
    if (!id || !name) {
      toast.error("Both id and name are required.");
      return;
    }
    startTransition(async () => {
      const createRes = await createKeyboard({
        id,
        name,
        brand: addBrand.trim(),
        type: addType,
        layout: null,
        model_url: "",
        vendor_id: addTarget.vendor_id ?? null,
        product_id: addTarget.product_id ?? null,
      });
      if (createRes.status !== "done") {
        toast.error(`Create failed (${createRes.status}).`);
        return;
      }
      const resolveRes = await resolveKeyboardRequest(addTarget.id);
      if (resolveRes.status !== "done") {
        toast.error("Keyboard created, but marking the request done failed.");
      } else {
        toast.success(`"${name}" added to the catalog.`);
      }
      setAddTarget(null);
      onChanged();
    });
  };

  return (
    <Section title="Keyboard requests">
      <ul className="flex list-none flex-col gap-2 p-0">
        {requests.map((r) => {
          const isDone = r.status === "done";
          return (
            <li
              key={String(r.id)}
              className="flex flex-col gap-3 rounded-lg bg-site-secondary px-3 py-2.5"
            >
              <div className="flex flex-row flex-wrap items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-base font-medium">
                    {r.brand ? `${r.brand} - ${r.name}` : r.name}
                  </span>
                  <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <span>#{r.id}</span>
                    <span>{r.type === "keypad" ? "keypad" : "keyboard"}</span>
                    {r.vendor_id != null && <span>VID {r.vendor_id}</span>}
                    {r.product_id != null && <span>PID {r.product_id}</span>}
                    {r.user_id != null && (
                      <span>{r.username ? `by ${r.username}` : `user ${r.user_id}`}</span>
                    )}
                  </div>
                  {r.note && (
                    <p className="text-sm text-muted-foreground">{r.note}</p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={isDone ? requestDoneClass : requestPendingClass}
                >
                  {isDone ? "done" : r.status || "pending"}
                </Badge>
                <div className="flex shrink-0 flex-row items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => openAddDialog(r)}
                    disabled={pending}
                  >
                    Add to catalog
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleResolve(r.id)}
                    disabled={pending || isDone}
                  >
                    Mark done
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(r.id)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
        {requests.length === 0 && (
          <li className="px-0.5 py-2 text-sm text-muted-foreground">
            No keyboard requests.
          </li>
        )}
      </ul>

      <Dialog
        open={!!addTarget}
        onOpenChange={(open) => {
          if (!open) setAddTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to catalog</DialogTitle>
            <DialogDescription>
              Creates this device in the keyboards table from request #
              {addTarget?.id}, and marks the request done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-kb-id">id (unique slug)</Label>
              <Input
                id="add-kb-id"
                className="bg-site-primary"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-kb-name">Name</Label>
              <Input
                id="add-kb-name"
                className="bg-site-primary"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-kb-brand">Brand</Label>
              <Input
                id="add-kb-brand"
                className="bg-site-primary"
                value={addBrand}
                onChange={(e) => setAddBrand(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-kb-type">Type</Label>
              <Select value={addType} onValueChange={setAddType}>
                <SelectTrigger
                  id="add-kb-type"
                  className="w-full border-border bg-site-primary hover:bg-site-primary/80"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-site-secondary shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
                  <SelectItem value="keyboard">keyboard</SelectItem>
                  <SelectItem value="keypad">keypad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddToCatalog} disabled={pending}>
              Add keyboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
