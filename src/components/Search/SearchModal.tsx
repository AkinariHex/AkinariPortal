"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { searchSite, type SearchResults } from "@/app/actions/search";

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
  const showEmpty = !loading && debounced.length >= 2 && !hasResults;

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-start bg-black/55 px-4 pt-[12vh] pb-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Command
        className="flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-site-primary text-foreground shadow-2xl shadow-black/45"
        shouldFilter={false}
        loop
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
      >
        <div className="flex flex-row items-center gap-2.5 border-b border-site-secondary px-[18px] py-3.5">
          <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <Command.Input
            ref={inputRef}
            className="w-full flex-1 bg-transparent text-lg font-normal text-foreground outline-none placeholder:text-muted-foreground"
            value={query}
            onValueChange={setQuery}
            placeholder="Search skins and players..."
          />
        </div>

        <Command.List className="max-h-[calc(70vh-60px)] overflow-x-hidden overflow-y-auto p-1.5">
          {loading && (
            <div className="select-none px-4 py-7 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!loading && debounced.length < 2 && (
            <div className="select-none px-4 py-7 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </div>
          )}

          {showEmpty && (
            <Command.Empty className="select-none px-4 py-7 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
          )}

          {!loading && results.skins.length > 0 && (
            <Command.Group
              className="py-1 [&_[cmdk-group-heading]]:select-none [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
              heading="Skins"
            >
              {results.skins.map((skin) => (
                <Command.Item
                  key={`skin-${skin.id}`}
                  value={`skin-${skin.id}`}
                  className="flex cursor-pointer select-none flex-row items-center gap-3 rounded-lg px-2.5 py-2 text-foreground data-[selected=true]:bg-site-secondary"
                  onSelect={() => {
                    if (skin.Player?.id != null) {
                      go(`/users/${skin.Player.id}`);
                    }
                  }}
                >
                  {skin.Banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="h-[30px] w-[54px] shrink-0 rounded-md bg-site-users object-cover"
                      src={skin.Banner}
                      alt=""
                    />
                  ) : (
                    <span className="h-[30px] w-[54px] shrink-0 rounded-md bg-site-users" />
                  )}
                  <span className="flex min-w-0 flex-col gap-px">
                    <span className="truncate text-[15px] font-medium">
                      {skin.Name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      by{" "}
                      <b className="font-medium text-accent-blue">
                        {skin.Player?.username ?? skin.Creator ?? "Unknown"}
                      </b>
                    </span>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {!loading && results.users.length > 0 && (
            <Command.Group
              className="py-1 [&_[cmdk-group-heading]]:select-none [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
              heading="Players"
            >
              {results.users.map((user) => (
                <Command.Item
                  key={`user-${user.id}`}
                  value={`user-${user.id}`}
                  className="flex cursor-pointer select-none flex-row items-center gap-3 rounded-lg px-2.5 py-2 text-foreground data-[selected=true]:bg-site-secondary"
                  onSelect={() => go(`/users/${user.id}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="size-[34px] shrink-0 rounded-full bg-site-users object-cover"
                    src={`https://s.ppy.sh/a/${user.id}`}
                    alt=""
                  />
                  <span className="flex min-w-0 flex-col gap-px">
                    <span className="truncate text-[15px] font-medium">
                      {user.username}
                    </span>
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
