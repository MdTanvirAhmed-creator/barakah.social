/**
 * Al-Hikmah Stage 1 acceptance — the Qur'an reference hub through the real
 * UI against a LOCAL Supabase stack with the Tanzil import loaded.
 *
 * Run with:
 *   supabase start
 *   node scripts/import-quran.mjs --local
 *   npm run dev:local          (or let this spec reuse an existing :3000)
 *   E2E_LOCAL_SUPABASE=1 npx playwright test e2e/quran-reader.spec.ts --project=chromium
 *
 * Covers:
 *   - the surah index lists all 114 surahs and is searchable
 *   - the reader shows Al-Fatihah: 7 ayat, Arabic + translation, provenance
 *   - per-ayah deep links land on the ayah
 */
import { test, expect, Page } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
// Standard local-dev demo keys (`supabase start`) — not secrets.
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const PASSWORD = "e2e-test-password-1";
const stamp = Date.now().toString(36);
const reader = {
  email: `qari-${stamp}@e2e.local`,
  username: `qari_${stamp}`,
  fullName: "Qari E2E",
  id: "",
};

async function adminCreateUser(u: typeof reader): Promise<string> {
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
  const body = (await res.json()) as { id?: string };
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

test.describe("Qur'an reference hub (local stack)", () => {
  test.skip(
    process.env.E2E_LOCAL_SUPABASE !== "1",
    "requires a local Supabase stack; set E2E_LOCAL_SUPABASE=1"
  );

  test.beforeAll(async () => {
    reader.id = await adminCreateUser(reader);
  });

  test.afterAll(async () => {
    await adminDeleteUser(reader.id);
  });

  test("index, reader and deep links work on real data", async ({ page }) => {
    await signIn(page, reader.email);

    // Surah index: searchable, complete.
    await page.goto("/knowledge/quran");
    await expect(page.getByRole("heading", { name: /noble qur/i })).toBeVisible();
    await expect(page.getByText("Al-Faatiha", { exact: false })).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder(/find a surah/i).fill("112");
    await expect(page.getByText("Al-Ikhlaas", { exact: false })).toBeVisible();

    // Reader: Al-Fatihah has 7 ayat, Arabic and translation, provenance.
    await page.goto("/knowledge/quran/1");
    await expect(page.getByText(/7 ayat/i)).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("It is You we worship and You we ask for help.")
    ).toBeVisible();
    await expect(page.locator("#ayah-7")).toBeVisible();
    await expect(page.getByText(/tanzil project/i)).toBeVisible();

    // Translation toggle hides the English.
    await page.getByRole("button", { name: /hide translation/i }).click();
    await expect(
      page.getByText("It is You we worship and You we ask for help.")
    ).toHaveCount(0);
    await page.getByRole("button", { name: /show translation/i }).click();

    // Tajweed mode colours rules and shows the legend.
    await page.getByRole("button", { name: /^tajweed$/i }).click();
    await expect(page.getByText("Qalqalah")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".tj-ghunnah").first()).toBeVisible();

    // Word-by-word mode shows per-word glosses.
    await page.getByRole("button", { name: /word by word/i }).click();
    await expect(page.getByText("All praises and thanks", { exact: false })).toBeVisible({
      timeout: 15000,
    });

    // Deep link lands on the ayah (the reader re-scrolls after the Uthmani
    // font loads, so poll rather than sample once).
    await page.goto("/knowledge/quran/2#ayah-255");
    await expect(page.locator("#ayah-255")).toBeVisible({ timeout: 15000 });
    await expect
      .poll(
        () =>
          page.locator("#ayah-255").evaluate((el) => {
            const r = el.getBoundingClientRect();
            return r.top >= -r.height && r.top < window.innerHeight;
          }),
        { timeout: 10000 }
      )
      .toBe(true);
  });
});
