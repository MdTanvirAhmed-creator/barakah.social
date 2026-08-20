#!/usr/bin/env node
/**
 * The daily digest — the sending half of the notification decision made in
 * Phase 3: a quiet inbox in the app, and at most one calm email a day.
 *
 * Reads daily_notification_digest() (service-role only, and already skipping
 * anyone who has turned the digest off), resolves each reader's address
 * through the auth admin API, and sends through Resend.
 *
 * Deliberately plain: it says what is waiting and links to the inbox. No
 * counts of anything else, no re-engagement copy, no "you're missing out",
 * no tracking pixel. If there is nothing unread, nobody is emailed at all.
 *
 * Usage:
 *   node scripts/send-digest.mjs             # send
 *   node scripts/send-digest.mjs --dry-run   # print what would be sent
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   required
 *   RESEND_API_KEY                            required unless --dry-run
 *   DIGEST_FROM                               e.g. "Barakah.social <salam@barakah.social>"
 *   APP_URL                                   e.g. https://www.barakah.social
 */
const DRY = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DIGEST_FROM ?? "Barakah.social <salam@barakah.social>";
const APP_URL = process.env.APP_URL ?? "https://www.barakah.social";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
if (!RESEND_API_KEY && !DRY) {
  console.log("RESEND_API_KEY is not set — nothing to send. Exiting cleanly.");
  process.exit(0);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function digestRows() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/daily_notification_digest`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`digest rpc: ${res.status} ${await res.text()}`);
  return res.json();
}

async function emailFor(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { headers });
  if (!res.ok) return null;
  const u = await res.json();
  // Never mail an address that was never confirmed.
  return u?.email_confirmed_at ? u.email : null;
}

/** Plain, quiet, and honest about how little it is saying. */
function body({ requests, acceptances }) {
  const lines = [];
  if (requests > 0) {
    lines.push(
      requests === 1
        ? "Someone would like to be your companion."
        : `${requests} people would like to be your companions.`
    );
  }
  if (acceptances > 0) {
    lines.push(
      acceptances === 1
        ? "Someone accepted your companionship."
        : `${acceptances} people accepted your companionship.`
    );
  }
  const text = `${lines.join("\n")}

They are waiting in your inbox whenever you next visit — nothing is urgent.

${APP_URL}/companions

To stop these daily emails: ${APP_URL}/settings`;

  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#2a2620;max-width:34rem">
  ${lines.map((l) => `<p style="margin:0 0 12px">${l}</p>`).join("")}
  <p style="margin:0 0 20px;color:#615948">They are waiting in your inbox whenever you next visit — nothing is urgent.</p>
  <p style="margin:0 0 24px"><a href="${APP_URL}/companions" style="color:#17685e">Open Barakah.social</a></p>
  <p style="margin:0;font-size:12px;color:#615948">
    One email a day at most. <a href="${APP_URL}/settings" style="color:#615948">Turn these off</a>.
  </p>
</div>`;
  return { text, html };
}

async function send(to, subject, { text, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, text, html }),
  });
  if (!res.ok) throw new Error(`resend: ${res.status} ${await res.text()}`);
}

async function main() {
  const rows = await digestRows();
  if (!rows.length) {
    console.log("Nothing unread in the last day. No email sent.");
    return;
  }
  console.log(`${rows.length} reader(s) have something waiting.`);

  let sent = 0;
  let skipped = 0;
  for (const row of rows) {
    const to = await emailFor(row.user_id);
    if (!to) {
      skipped += 1;
      continue;
    }
    const content = body(row);
    if (DRY) {
      console.log(`\n--- would send to ${to} ---\n${content.text}`);
      sent += 1;
      continue;
    }
    await send(to, "Waiting for you on Barakah.social", content);
    sent += 1;
    // Resend's default allowance is modest; stay well inside it.
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`${DRY ? "Would send" : "Sent"}: ${sent}. Skipped (unconfirmed): ${skipped}.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
