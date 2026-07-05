import { execSync } from "child_process";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Connection details for the LOCAL Supabase stack (`supabase start`).
 *
 * Resolution order:
 *   1. SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY env vars
 *      (used in CI, where the workflow exports them from `supabase status`)
 *   2. `supabase status -o env` (local dev convenience)
 *
 * These tests create and delete real users, so they refuse to run against a
 * non-local URL unless RLS_TESTS_ALLOW_REMOTE=true is set explicitly.
 */
export interface SupabaseTestEnv {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

let cachedEnv: SupabaseTestEnv | null = null;

export function getTestEnv(): SupabaseTestEnv {
  if (cachedEnv) return cachedEnv;

  let url = process.env.SUPABASE_URL;
  let anonKey = process.env.SUPABASE_ANON_KEY;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    let output: string;
    try {
      output = execSync("supabase status -o env", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      throw new Error(
        "Could not resolve Supabase connection details. Either export " +
          "SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY, or " +
          "run `supabase start` so `supabase status` works.\n" +
          `Underlying error: ${(err as Error).message}`
      );
    }
    const parsed: Record<string, string> = {};
    for (const line of output.split("\n")) {
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      parsed[line.slice(0, eq).trim()] = line
        .slice(eq + 1)
        .trim()
        .replace(/^"|"$/g, "");
    }
    url = url || parsed.API_URL;
    anonKey = anonKey || parsed.ANON_KEY;
    serviceRoleKey = serviceRoleKey || parsed.SERVICE_ROLE_KEY;
  }

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Incomplete Supabase test environment (url/anon/service_role).");
  }

  const host = new URL(url).hostname;
  const isLocal = host === "127.0.0.1" || host === "localhost";
  if (!isLocal && process.env.RLS_TESTS_ALLOW_REMOTE !== "true") {
    throw new Error(
      `Refusing to run RLS tests against non-local Supabase URL "${url}". ` +
        "These tests create and delete users. Set RLS_TESTS_ALLOW_REMOTE=true to override."
    );
  }

  cachedEnv = { url, anonKey, serviceRoleKey };
  return cachedEnv;
}

/** Service-role client. Bypasses RLS — use only for fixtures and cleanup. */
export function createAdminClient(): SupabaseClient {
  const { url, serviceRoleKey } = getTestEnv();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TestUser {
  id: string;
  email: string;
  /** A supabase-js client with this user's session — subject to RLS. */
  client: SupabaseClient;
}

const TEST_PASSWORD = "rls-test-password-1234";

/**
 * Creates a confirmed user via the admin API and returns a client signed in
 * as that user. The on_auth_user_created trigger creates their profile row.
 */
export async function createTestUser(
  admin: SupabaseClient,
  label: string
): Promise<TestUser> {
  // Alphanumeric only — profiles.username has a username_format check constraint.
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const email = `rls-${label}-${unique}@rls-tests.local`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: `rls_${label}_${unique}`.slice(0, 30),
      full_name: `RLS Test ${label}`,
    },
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create test user ${label}: ${createError?.message}`);
  }

  const { url, anonKey } = getTestEnv();
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signInError) {
    throw new Error(`Failed to sign in test user ${label}: ${signInError.message}`);
  }

  return { id: created.user.id, email, client };
}

/** Deletes a test user; profile and owned rows cascade. */
export async function deleteTestUser(admin: SupabaseClient, user: TestUser | undefined) {
  if (!user) return;
  await user.client.auth.signOut();
  await admin.auth.admin.deleteUser(user.id);
}
