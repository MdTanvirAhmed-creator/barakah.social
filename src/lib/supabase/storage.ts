"use client";

import { createClient } from "./client";

export interface UploadResult {
  data: { path: string; publicUrl: string } | null;
  error: Error | null;
}

async function upload(file: File, bucket: string, folder: string): Promise<UploadResult> {
  const supabase = createClient();
  try {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (error) return { data: null, error };

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { data: { path: data.path, publicUrl }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error("Unknown error") };
  }
}

export async function uploadAvatar(file: File): Promise<UploadResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("Not authenticated") };
  return upload(file, "avatars", user.id);
}

export async function uploadPostImage(file: File): Promise<UploadResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("Not authenticated") };
  return upload(file, "post-media", user.id);
}

export async function uploadHalaqaAvatar(file: File, halaqaId: string): Promise<UploadResult> {
  return upload(file, "halaqa-avatars", halaqaId);
}

export async function deleteFile(filePath: string, bucket: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error("Unknown error") };
  }
}

export function getPublicUrl(filePath: string, bucket: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
