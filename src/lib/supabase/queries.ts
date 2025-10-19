"use client";

import { createClient } from "./client";
import type { Post, PostWithProfile, Comment, CommentWithProfile } from "@/types/supabase";

// Posts
export async function getPosts(limit = 10, offset = 0) {
  const supabase = createClient();
  
  const { data, error, count } = await supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data as PostWithProfile[] | null, error, count };
}

export async function getPostById(postId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("id", postId)
    .single();

  return { data: data as PostWithProfile | null, error };
}

export async function getPostsByUserId(userId: string, limit = 10, offset = 0) {
  const supabase = createClient();
  
  const { data, error, count } = await supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data as PostWithProfile[] | null, error, count };
}

export async function createPost(content: string, imageUrl?: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content,
      image_url: imageUrl,
    })
    .select("*, profiles(*)")
    .single();

  return { data: data as PostWithProfile | null, error };
}

export async function updatePost(postId: string, content: string, imageUrl?: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("posts")
    .update({
      content,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select("*, profiles(*)")
    .single();

  return { data: data as PostWithProfile | null, error };
}

export async function deletePost(postId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  return { error };
}

// Comments
export async function getCommentsByPostId(postId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return { data: data as CommentWithProfile[] | null, error };
}

export async function createComment(postId: string, content: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select("*, profiles(*)")
    .single();

  // Increment comments count
  await supabase.rpc("increment_comments_count", { post_id: postId });

  return { data: data as CommentWithProfile | null, error };
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  // Decrement comments count
  if (!error) {
    await supabase.rpc("decrement_comments_count", { post_id: postId });
  }

  return { error };
}

// Likes
export async function likePost(postId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("likes")
    .insert({
      post_id: postId,
      user_id: user.id,
    })
    .select()
    .single();

  // Increment likes count
  if (!error) {
    await supabase.rpc("increment_likes_count", { post_id: postId });
  }

  return { data, error };
}

export async function unlikePost(postId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  // Decrement likes count
  if (!error) {
    await supabase.rpc("decrement_likes_count", { post_id: postId });
  }

  return { error };
}

export async function checkIfLiked(postId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: false, error: null };
  }

  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  return { data: !!data, error: error?.code === "PGRST116" ? null : error };
}

// Followers
export async function followUser(followingId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("followers")
    .insert({
      follower_id: user.id,
      following_id: followingId,
    })
    .select()
    .single();

  return { data, error };
}

export async function unfollowUser(followingId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  return { error };
}

export async function checkIfFollowing(followingId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: false, error: null };
  }

  const { data, error } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .single();

  return { data: !!data, error: error?.code === "PGRST116" ? null : error };
}

export async function getFollowers(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("followers")
    .select("follower_id, profiles!followers_follower_id_fkey(*)")
    .eq("following_id", userId);

  return { data, error };
}

export async function getFollowing(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("followers")
    .select("following_id, profiles!followers_following_id_fkey(*)")
    .eq("follower_id", userId);

  return { data, error };
}

