/**
 * Public-page smoke tests — no Supabase data required, so these run on every
 * CI push.
 *
 * The previous version of this file (and feed.spec.ts, now deleted) tested a
 * mock-era UI that no longer exists: placeholder-based selectors, a
 * multi-step signup wizard, and feed features such as "like a post" that
 * were deliberately removed as vanity metrics. They failed 18 of 24 and were
 * masked by a config error that stopped the suite running at all, so they
 * quietly described a product we no longer ship.
 */
import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("renders a usable, labelled sign-in form", async ({ page }) => {
    await page.goto("/login");

    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password");

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();

    // Labelled and correctly typed — the basis of both accessibility and
    // password-manager support.
    await expect(email).toHaveAttribute("type", "email");
    await expect(password).toHaveAttribute("type", "password");
  });

  test("the form accepts input", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByLabel("Password").fill("a-password");
    await expect(page.getByLabel("Email")).toHaveValue("someone@example.com");
  });

  test("offers a route to create an account", async ({ page }) => {
    await page.goto("/login");
    const signup = page.getByRole("link", { name: /sign up|create account/i });
    await expect(signup.first()).toBeVisible();
  });
});

test.describe("Signup page", () => {
  test("renders and asks for an email", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Email").first()).toBeVisible();
  });
});
