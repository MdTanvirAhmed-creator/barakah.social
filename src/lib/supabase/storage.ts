"use client";

import { createClient } from "./client";

const STORAGE_BUCKET = "uploads";

export interface UploadResult {
  data: {
    path: string;
    publicUrl: string;
  } | null;
  error: Error | null;
}

// Upload file to Supabase Storage
export async function uploadFile(
  file: File,
  bucket: string = STORAGE_BUCKET
): Promise<UploadResult> {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: new Error("Not authenticated"),
      };
    }

    // Create unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { data: null, error };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      data: {
        path: data.path,
        publicUrl,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Delete file from Supabase Storage
export async function deleteFile(
  filePath: string,
  bucket: string = STORAGE_BUCKET
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    return { error };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Upload avatar
export async function uploadAvatar(file: File): Promise<UploadResult> {
  return uploadFile(file, "avatars");
}

// Upload post image
export async function uploadPostImage(file: File): Promise<UploadResult> {
  return uploadFile(file, "posts");
}

// Get public URL for a file
export function getPublicUrl(filePath: string, bucket: string = STORAGE_BUCKET) {
  const supabase = createClient();
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

