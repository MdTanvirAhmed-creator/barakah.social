import { test, expect, Page } from "@playwright/test";

/**
 * Turnstile on signup.
 *
 * Runs against Cloudflare's documented always-passes TEST keys — site key
 * 1x00000000000000000000AA in the app, secret 1x0000000000000000000000000000000AA
 * on the local Supabase stack. Those are public dummy values, not credentials.
 *
 * Gated on the site key being present, because without it the component
 * deliberately renders nothing and there is no challenge to test. CI sets it.
 */
const ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

test.describe("signup bot check", () => {
  test.skip(!ENABLED, "NEXT_PUBLIC_TURNSTILE_SITE_KEY not set");
  test.use({ viewport: { width: 1150, height: 1200 } });

  /** Walk the four-step signup as far as the final step. */
  async function toFinalStep(page: Page, tag: string) {
    await page.goto("/signup");
    await page.getByRole("textbox", { name: "Email Address" }).fill(`ts-${tag}@e2e.local`);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Aa1-strong-pass");
    await page.getByRole("textbox", { name: "Confirm Password" }).fill("Aa1-strong-pass");
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // The Mithaq must be read to the bottom before it can be accepted.
    const covenant = page.locator(".overflow-y-auto").first();
    for (let i = 0; i < 25; i++) {
      await covenant.evaluate((el: HTMLElement) => {
        el.scrollTop = el.scrollHeight;
      }).catch(() => {});
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(150);
      const box = page.locator("#acceptMithaq");
      if ((await box.count()) && (await box.isEnabled().catch(() => false))) break;
    }
    await page.locator("#acceptMithaq").check();
    await page.getByRole("button", { name: /accept & continue/i }).click();
    await page.waitForTimeout(1200);

    for (const [label, value] of [
      ["Full Name", "Turnstile Test"],
      ["Username", `ts${tag}`.slice(0, 20)],
    ] as const) {
      const field = page.getByRole("textbox", { name: new RegExp(label, "i") }).first();
      if ((await field.count()) && (await field.isVisible().catch(() => false))) {
        await field.fill(value).catch(() => {});
      }
    }
    const next = page.getByRole("button", { name: /continue|next/i }).first();
    if ((await next.count()) && (await next.isEnabled().catch(() => false))) {
      await next.click();
      await page.waitForTimeout(1200);
    }
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible({
      timeout: 15000,
    });
  }

  /** Turnstile renders a hidden cf-turnstile-response input, not an iframe. */
  const tokenField = (page: Page) => page.locator('input[name="cf-turnstile-response"]');

  test("the challenge gates the submit button, and survives a remount", async ({ page }) => {
    const tag = Date.now().toString(36);
    await toFinalStep(page, tag);
    const submit = page.getByRole("button", { name: /create account/i });

    // Locked until the challenge yields a token.
    expect(await submit.isDisabled()).toBe(true);

    await expect(tokenField(page)).toBeAttached({ timeout: 25000 });
    await expect
      .poll(async () => (await tokenField(page).inputValue()).length, { timeout: 30000 })
      .toBeGreaterThan(0);
    await expect(submit).toBeEnabled({ timeout: 15000 });

    // Leaving and returning remounts the widget against a script tag that is
    // already in the document and has already fired its load event. Waiting on
    // that event would hang here, leaving the button disabled forever.
    await page.goto("/login");
    await page.waitForTimeout(800);
    await toFinalStep(page, tag + "b");
    await expect(tokenField(page)).toBeAttached({ timeout: 25000 });
    await expect
      .poll(async () => (await tokenField(page).inputValue()).length, { timeout: 30000 })
      .toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: /create account/i })).toBeEnabled({
      timeout: 15000,
    });
  });
});
