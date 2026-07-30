import "server-only";

type EmbedField = { name: string; value: string; inline?: boolean };

type Embed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: EmbedField[];
  footer?: { text: string };
  timestamp?: string;
};

const ACCENT_BLUE = 0x6ba2ed;

/**
 * Post an embed to a Discord webhook. Never throws and never blocks the caller's
 * own result: a notification failing is not a reason for the user's action to
 * fail. A missing webhook URL simply turns the notification off.
 */
async function postEmbed(webhookUrl: string | undefined, embed: Embed) {
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      console.error(`Discord webhook responded ${res.status}`);
    }
  } catch (error) {
    console.error(error);
  }
}

export type KeyboardRequestNotification = {
  name: string;
  brand?: string | null;
  type: "keyboard" | "keypad";
  note?: string | null;
  vendorId?: number | null;
  productId?: number | null;
  userId?: string | null;
  username?: string | null;
  requestedAt: string;
};

export async function notifyKeyboardRequest(req: KeyboardRequestNotification) {
  const siteUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");

  const fields: EmbedField[] = [
    { name: "Device", value: [req.brand, req.name].filter(Boolean).join(" "), inline: true },
    { name: "Type", value: req.type === "keypad" ? "Keypad" : "Keyboard", inline: true },
  ];

  if (req.vendorId != null || req.productId != null) {
    fields.push({
      name: "USB ids",
      value: [
        req.vendorId != null ? `VID ${req.vendorId}` : null,
        req.productId != null ? `PID ${req.productId}` : null,
      ]
        .filter(Boolean)
        .join(" - "),
      inline: true,
    });
  }

  const requester = req.username ?? (req.userId ? `user ${req.userId}` : null);
  if (requester) {
    fields.push({
      name: "Requested by",
      value:
        siteUrl && req.userId
          ? `[${requester}](${siteUrl}/users/${req.userId})`
          : requester,
      inline: true,
    });
  }

  await postEmbed(process.env.DISCORD_KEYBOARD_WEBHOOK_URL, {
    title: `New ${req.type} request`,
    description: req.note || undefined,
    url: siteUrl ? `${siteUrl}/admin` : undefined,
    color: ACCENT_BLUE,
    fields,
    footer: { text: "Akinari Portal" },
    timestamp: req.requestedAt,
  });
}
