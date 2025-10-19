"use client";

import { createClient } from "./client";
import type { Profile } from "@/types/supabase";

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResult<T = any> {
  data: T | null;
  error: AuthError | null;
  loading: boolean;
}

// Get current session
export async function getSession(): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data: data.session,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data: user,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Get user profile
export async function getUserProfile(
  userId: string
): Promise<AuthResult<Profile>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<AuthResult<Profile>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { full_name?: string; username?: string }
): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Sign in with OAuth provider
export async function signInWithOAuth(
  provider: "google" | "github" | "twitter"
): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Sign out
export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data: { success: true },
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

// Update password
export async function updatePassword(
  newPassword: string
): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message },
        loading: false,
      };
    }

    return {
      data,
      error: null,
      loading: false,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      loading: false,
    };
  }
}

