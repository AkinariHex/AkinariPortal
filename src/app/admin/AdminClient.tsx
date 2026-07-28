"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "react-tooltip";
import {
  createBadge,
  updateBadge,
  deleteBadge,
  grantBadge,
  grantBadgeBatch,
  revokeBadge,
  getUserBadges,
} from "./actions";
import type { BadgeHolder, BadgeHoldersMap } from "./data";
import styles from "./Admin.module.css";

type Badge = { id: string | number; title: string };

type UserBadgeState = {
  hasAccount: boolean;
  assigned: (string | number)[];
  pending: (string | number)[];
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

// Tooltip HTML listing every holder: username if they have an account, else the
// raw osu id; pending grants are marked.
const holdersTooltipHtml = (holders: BadgeHolder[]) => {
  if (!holders.length) return "No players have this badge yet.";
  return holders
    .map((h) => {
      const label = h.name ? escapeHtml(h.name) : `#${escapeHtml(h.id)}`;
      return h.pending ? `${label} <em>(pending)</em>` : label;
    })
    .join("<br>");
};

export default function AdminClient({
  badges,
  holders,
}: {
  badges: Badge[];
  holders: BadgeHoldersMap;
}) {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Admin</h1>
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
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

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
      setMsg({ text: "Pick a badge.", ok: false });
      return;
    }
    const ids = parseIds(raw);
    if (ids.length === 0) {
      setMsg({ text: "Enter at least one osu! user id.", ok: false });
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
        setMsg({ text: parts.join(" · "), ok: res.failed.length === 0 });
        onChanged();
      } else {
        setMsg({ text: `Batch grant failed (${res.status}).`, ok: false });
      }
    });
  };

  const count = parseIds(raw).length;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Batch grant a badge</h2>

      <div className={styles.createRow}>
        <select
          className={styles.input}
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
        >
          {badges.length === 0 && <option value="">No badges</option>}
          {badges.map((b) => (
            <option key={String(b.id)} value={String(b.id)}>
              #{b.id} — {b.title}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className={styles.textarea}
        placeholder="osu! user ids — separated by spaces, commas or new lines"
        rows={5}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      <div className={styles.createRow}>
        <span className={styles.holderCount}>{count} ids</span>
        <button
          className={styles.btnPrimary}
          onClick={handleGrant}
          disabled={pending || badges.length === 0}
        >
          Grant to all
        </button>
      </div>

      {msg && (
        <p className={msg.ok ? styles.msgOk : styles.msgErr}>{msg.text}</p>
      )}
    </section>
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
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [newId, setNewId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const flash = (text: string, ok: boolean) => setMsg({ text, ok });

  const handleCreate = () => {
    if (!newId.trim() || !newTitle.trim()) {
      flash("Both id and title are required.", false);
      return;
    }
    startTransition(async () => {
      const res = await createBadge({ id: newId.trim(), title: newTitle.trim() });
      if (res.status === "done") {
        flash(`Badge "${newTitle.trim()}" created.`, true);
        setNewId("");
        setNewTitle("");
        onChanged();
      } else {
        flash(`Create failed (${res.status}).`, false);
      }
    });
  };

  const handleRename = (id: string | number) => {
    const title = (edits[String(id)] ?? "").trim();
    if (!title) {
      flash("Title cannot be empty.", false);
      return;
    }
    startTransition(async () => {
      const res = await updateBadge({ id, title });
      if (res.status === "done") {
        flash(`Badge #${id} renamed.`, true);
        onChanged();
      } else {
        flash(`Rename failed (${res.status}).`, false);
      }
    });
  };

  const handleDelete = (id: string | number) => {
    startTransition(async () => {
      const res = await deleteBadge(id);
      if (res.status === "done") {
        flash(`Badge #${id} deleted.`, true);
        onChanged();
      } else {
        flash(`Delete failed (${res.status}).`, false);
      }
    });
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Badge definitions</h2>

      <div className={styles.createRow}>
        <input
          className={styles.input}
          placeholder="id (matches image filename)"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button
          className={styles.btnPrimary}
          onClick={handleCreate}
          disabled={pending}
        >
          Create badge
        </button>
      </div>

      {msg && (
        <p className={msg.ok ? styles.msgOk : styles.msgErr}>{msg.text}</p>
      )}

      <ul className={styles.badgeList}>
        {badges.map((b) => (
          <li key={String(b.id)} className={styles.badgeItem}>
            <img
              className={styles.badgeImg}
              src={`/img/badges/${b.id}.webp`}
              alt={b.title}
              width={86}
              height={40}
            />
            <div className={styles.badgeMeta}>
              <span className={styles.badgeId}>#{b.id}</span>
              <input
                className={styles.input}
                defaultValue={b.title}
                onChange={(e) =>
                  setEdits((s) => ({ ...s, [String(b.id)]: e.target.value }))
                }
              />
            </div>
            <div className={styles.badgeActions}>
              {(() => {
                const list = holders[String(b.id)] ?? [];
                return (
                  <span
                    className={styles.holderCount}
                    data-tooltip-id="badge-holders"
                    data-tooltip-html={holdersTooltipHtml(list)}
                  >
                    {list.length} {list.length === 1 ? "player" : "players"}
                  </span>
                );
              })()}
              <button
                className={styles.btnSecondary}
                onClick={() => handleRename(b.id)}
                disabled={pending}
              >
                Rename
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => handleDelete(b.id)}
                disabled={pending}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {badges.length === 0 && (
          <li className={styles.empty}>No badges yet.</li>
        )}
      </ul>

      <Tooltip id="badge-holders" place="left" className={styles.tooltip} />
    </section>
  );
}

function GrantModify({ badges }: { badges: Badge[] }) {
  const [pending, startTransition] = useTransition();
  const [osuId, setOsuId] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [state, setState] = useState<UserBadgeState | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => setMsg({ text, ok });

  const load = (idArg?: string) => {
    const id = (idArg ?? osuId).trim();
    if (!id) {
      flash("Enter an osu! user id.", false);
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
        flash(`Load failed (${res.status}).`, false);
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
        flash(
          present
            ? `Revoked badge #${badgeId}.`
            : `Granted badge #${badgeId}${
                "placement" in res ? ` (${res.placement})` : ""
              }.`,
          true
        );
        load(loadedId);
      } else {
        flash(`Action failed (${res.status}).`, false);
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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Grant / modify user badges</h2>

      <div className={styles.createRow}>
        <input
          className={styles.input}
          placeholder="osu! user id"
          value={osuId}
          onChange={(e) => setOsuId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button
          className={styles.btnPrimary}
          onClick={() => load()}
          disabled={pending}
        >
          Load
        </button>
      </div>

      {msg && (
        <p className={msg.ok ? styles.msgOk : styles.msgErr}>{msg.text}</p>
      )}

      {state && loadedId && (
        <>
          <p className={styles.accountLine}>
            User <strong>{loadedId}</strong>:{" "}
            {state.hasAccount ? (
              <span className={styles.tagActive}>has a site account</span>
            ) : (
              <span className={styles.tagPending}>
                no site account (grants go to pending)
              </span>
            )}
          </p>

          <ul className={styles.badgeList}>
            {badges.map((b) => {
              const st = statusFor(b.id);
              const present = st !== null;
              return (
                <li key={String(b.id)} className={styles.badgeItem}>
                  <img
                    className={styles.badgeImg}
                    src={`/img/badges/${b.id}.webp`}
                    alt={b.title}
                    width={86}
                    height={40}
                  />
                  <div className={styles.badgeMeta}>
                    <span className={styles.badgeId}>#{b.id}</span>
                    <span className={styles.badgeTitle}>{b.title}</span>
                  </div>
                  <div className={styles.badgeActions}>
                    {st === "active" && (
                      <span className={styles.tagActive}>active</span>
                    )}
                    {st === "pending" && (
                      <span className={styles.tagPending}>pending</span>
                    )}
                    <button
                      className={present ? styles.btnDanger : styles.btnPrimary}
                      onClick={() => toggle(b.id)}
                      disabled={pending}
                    >
                      {present ? "Revoke" : "Grant"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
