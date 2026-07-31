// Keypads whose keycaps carry no legend are stored with blank labels in
// `keyboards.layout` (e.g. the Wooting UwU RGB: three blank keys). Those are
// positional slots: the letter comes from the user's tap keys, bound by order.
// A blank tap key is a slot the user deliberately left unset.

type LayoutKey = { label: string; w?: number };
type LayoutDevice = { layout?: { rows: LayoutKey[][] } | null } | null | undefined;

export function layoutKeysOf(device: LayoutDevice): LayoutKey[] {
  return (device?.layout?.rows ?? []).flat();
}

export function namedLabelsOf(device: LayoutDevice): string[] {
  return layoutKeysOf(device)
    .map((k) => k.label.trim().toLowerCase())
    .filter(Boolean);
}

export function slotCountOf(device: LayoutDevice): number {
  return layoutKeysOf(device).filter((k) => !k.label.trim()).length;
}

// Positions in `tapKeys` that feed the blank slots, in slot order.
export function slotTargets(tapKeys: string[], named: string[]): number[] {
  return tapKeys
    .map((label, index) => ({ label, index }))
    .filter(({ label }) => !named.includes(label.trim().toLowerCase()))
    .map(({ index }) => index);
}

export function slotValues(
  tapKeys: string[],
  named: string[],
  slotCount: number
): string[] {
  const targets = slotTargets(tapKeys, named);
  return Array.from({ length: slotCount }, (_, slot) => {
    const at = targets[slot];
    return at === undefined ? "" : tapKeys[at].trim();
  });
}

// Returns a new tap key list with `slot` set to `label` ("" clears it).
export function writeSlot(
  tapKeys: string[],
  named: string[],
  slot: number,
  label: string
): string[] {
  const next = [...tapKeys];
  const at = slotTargets(next, named)[slot];

  if (at === undefined) {
    while (slotTargets(next, named).length < slot) next.push("");
    next.push(label);
  } else {
    next[at] = label;
  }

  // Trailing unset slots carry no meaning, so they are not stored.
  while (next.length > 0 && !next[next.length - 1].trim()) next.pop();
  return next;
}
