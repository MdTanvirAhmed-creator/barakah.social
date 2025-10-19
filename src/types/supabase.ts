// Database Types
// These should be generated from your Supabase database schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          content: string;
          image_url: string | null;
          likes_count: number;
          comments_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          likes_count?: number;
          comments_count?: number;
        };
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          post_id: string;
          user_id: string;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          post_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
      };
      followers: {
        Row: {
          id: string;
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific entity types
export type Profile = Tables<"profiles">;
export type Post = Tables<"posts">;
export type Comment = Tables<"comments">;
export type Like = Tables<"likes">;
export type Follower = Tables<"followers">;

// Extended types with relations
export type PostWithProfile = Post & {
  profiles: Profile;
};

export type CommentWithProfile = Comment & {
  profiles: Profile;
};

