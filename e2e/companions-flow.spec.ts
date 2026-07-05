/**
 * Phase 2 acceptance — the full companions loop through the real UI,
 * with two real accounts, against a LOCAL Supabase stack.
 *
 * Run with:
 *   supabase start
 *   npm run dev:local          (or let this spec reuse an existing :3000)
 *   E2E_LOCAL_SUPABASE=1 npx playwright test e2e/companions-flow.spec.ts --project=chromium
 *
 * Covers:
 *   - A posts (companions visibility by default), finds B, sends request
 *   - B accepts; A's post appears in B's feed
 *   - B blocks A; A disappears from B's search; A cannot re-send a request
 */
import { test, expect, Page } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
// Standard local-dev demo keys (`supabase start`) — not secrets.
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const PASSWORD = "e2e-test-password-1";
const stamp = Date.now().toString(36);
const userA = {
  email: `amina-${stamp}@e2e.local`,
  username: `amina_${stamp}`,
  fullName: "Amina E2E",
  id: "",
};
const userB = {
  email: `bilal-${stamp}@e2e.local`,
  username: `bilal_${stamp}`,
  fullName: "Bilal E2E",
  id: "",
};

async function adminCreateUser(u: typeof userA): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: u.username, full_name: u.fullName },
    }),
  });
  const body = (await res.json()) as { id?: string; msg?: string };
  if (!res.ok || !body.id) throw new Error(`admin createUser failed: ${JSON.stringify(body)}`);
  return body.id;
}

async function adminDeleteUser(id: string) {
  if (!id) return;
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/feed/, { timeout: 20000 });
}

test.describe("companions flow (local stack)", () => {
  test.skip(
    process.env.E2E_LOCAL_SUPABASE !== "1",
    "requires a local Supabase stack; set E2E_LOCAL_SUPABASE=1"
  );

  test.beforeAll(async () => {
    userA.id = await adminCreateUser(userA);
    userB.id = await adminCreateUser(userB);
  });

  test.afterAll(async () => {
    await adminDeleteUser(userA.id);
    await adminDeleteUser(userB.id);
  });

  test("request → accept → feed; block → hidden + cannot re-request", async ({
    browser,
  }) => {
    test.setTimeout(120000);
    const postText = `Companions-only post from Amina ${stamp}`;

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();

    // --- A: sign in, publish a (companions-visibility) post
    await signIn(a, userA.email);
    await a.getByRole("button", { name: "Share beneficial knowledge..." }).click();
    await a.getByPlaceholder("Share beneficial knowledge...").fill(postText);
    await a.getByRole("button", { name: /^post$/i }).click();
    await expect(a.getByText("Post shared successfully!")).toBeVisible({ timeout: 15000 });

    // --- A: find B and send a companionship request
    await a.goto("/companions");
    await a.getByRole("button", { name: "Find", exact: true }).click();
    await a.getByPlaceholder("Search by username or name…").fill(userB.username);
    await a.getByRole("button", { name: /^search$/i }).click();
    await expect(a.getByText(`@${userB.username}`)).toBeVisible();
    await a.getByRole("button", { name: /send request/i }).click();
    await expect(a.getByText("Request sent")).toBeVisible();

    // --- B: before accepting, A's post must be invisible
    await signIn(b, userB.email);
    await expect(b.getByText(postText)).not.toBeVisible();

    // --- B: accept the request
    await b.goto("/companions");
    await b.getByRole("button", { name: /requests/i }).click();
    await expect(b.getByText(`@${userA.username}`)).toBeVisible();
    await b.getByRole("button", { name: /^accept$/i }).click();
    await expect(b.getByText(/you are now companions/i)).toBeVisible();

    // --- B: A's companions-only post now appears in the feed
    await b.goto("/feed");
    await expect(b.getByText(postText)).toBeVisible({ timeout: 15000 });

    // --- B: block A from the companions list
    await b.goto("/companions");
    await b.getByRole("button", { name: /^block$/i }).click();
    await expect(b.getByText("User blocked")).toBeVisible();

    // --- B: A no longer shows up in search
    await b.getByRole("button", { name: "Find", exact: true }).click();
    await b.getByPlaceholder("Search by username or name…").fill(userA.username);
    await b.getByRole("button", { name: /^search$/i }).click();
    await expect(b.getByText("No results. Try a different name.")).toBeVisible();

    // --- A: B has disappeared from A's search too, so no re-request is possible
    await a.getByPlaceholder("Search by username or name…").fill(userB.username);
    await a.getByRole("button", { name: /^search$/i }).click();
    await expect(a.getByText("No results. Try a different name.")).toBeVisible();

    // --- A: even a direct API insert (same session, anon key) is rejected by RLS
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: userA.email, password: PASSWORD }),
    });
    const { access_token } = (await tokenRes.json()) as { access_token: string };
    const forgeRes = await fetch(`${SUPABASE_URL}/rest/v1/companionships`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requester_id: userA.id, addressee_id: userB.id }),
    });
    expect([401, 403]).toContain(forgeRes.status);

    await ctxA.close();
    await ctxB.close();
  });
});
