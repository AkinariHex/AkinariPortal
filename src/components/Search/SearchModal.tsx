"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  searchSite,
  type SearchResults,
} from "@/app/actions/search";
import styles from "@/components/Search/SearchModal.module.css";

const EMPTY: SearchResults = { skins: [], users: [] };

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    setQuery("");
    setDebounced("");
    setResults(EMPTY);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    if (debounced.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      try {
        const res = await searchSite(debounced);
        if (active) setResults(res);
      } catch {
        if (active) setResults(EMPTY);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [debounced, open]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const hasResults = results.skins.length > 0 || results.users.length > 0;
  const showEmpty =
    !loading && debounced.length >= 2 && !hasResults;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Command
        className={styles.command}
        shouldFilter={false}
        loop
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
      >
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchGlyph}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Command.Input
            ref={inputRef}
            className={styles.input}
            value={query}
            onValueChange={setQuery}
            placeholder="Search skins and players..."
          />
        </div>

        <Command.List className={styles.list}>
          {loading && (
            <div className={styles.state}>Searching...</div>
          )}

          {!loading && debounced.length < 2 && (
            <div className={styles.state}>
              Type at least 2 characters to search.
            </div>
          )}

          {showEmpty && (
            <Command.Empty className={styles.state}>
              No results found.
            </Command.Empty>
          )}

          {!loading && results.skins.length > 0 && (
            <Command.Group className={styles.group} heading="Skins">
              {results.skins.map((skin) => (
                <Command.Item
                  key={`skin-${skin.id}`}
                  value={`skin-${skin.id}`}
                  className={styles.item}
                  onSelect={() => {
                    if (skin.Player?.id != null) {
                      go(`/users/${skin.Player.id}`);
                    }
                  }}
                >
                  {skin.Banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={styles.thumb}
                      src={skin.Banner}
                      alt=""
                    />
                  ) : (
                    <span className={styles.thumb} />
                  )}
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{skin.Name}</span>
                    <span className={styles.itemSub}>
                      by <b>{skin.Player?.username ?? skin.Creator ?? "Unknown"}</b>
                    </span>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {!loading && results.users.length > 0 && (
            <Command.Group className={styles.group} heading="Players">
              {results.users.map((user) => (
                <Command.Item
                  key={`user-${user.id}`}
                  value={`user-${user.id}`}
                  className={styles.item}
                  onSelect={() => go(`/users/${user.id}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.avatar}
                    src={`https://s.ppy.sh/a/${user.id}`}
                    alt=""
                  />
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{user.username}</span>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
