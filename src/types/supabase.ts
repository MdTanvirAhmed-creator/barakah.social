// Database Types — keep in sync with supabase/migrations/
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MadhabType = "hanafi" | "shafi" | "maliki" | "hanbali" | "jafari";
export type PostType = "standard" | "question" | "poll" | "debate";
export type HalaqaRole = "member" | "moderator" | "admin";
export type ContentType = "post" | "comment" | "profile";
export type ReportReason = "ghibah" | "takfir" | "fitna" | "hate_speech" | "misinformation" | "inappropriate" | "spam";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type ConnectionStatus = "pending" | "accepted" | "declined" | "blocked";
export type KnowledgeLevel = "beginner" | "intermediate" | "advanced" | "any";
export type GenderPreference = "same_only" | "educational_mixed" | "any";
export type PartnershipType = "quran_memorization" | "arabic_learning" | "book_study" | "general" | "hadith_study" | "fiqh_study";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          bio: string | null;
          avatar_url: string | null;
          interests: string[];
          madhab_preference: MadhabType | null;
          role: string;
          joined_at: string;
          is_verified_scholar: boolean;
          beneficial_count: number;
          updated_at: string;
          is_available_for_connections: boolean | null;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          interests?: string[];
          madhab_preference?: MadhabType | null;
          role?: string;
          joined_at?: string;
          is_verified_scholar?: boolean;
          beneficial_count?: number;
          updated_at?: string;
          is_available_for_connections?: boolean | null;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          interests?: string[];
          madhab_preference?: MadhabType | null;
          role?: string;
          joined_at?: string;
          is_verified_scholar?: boolean;
          beneficial_count?: number;
          updated_at?: string;
          is_available_for_connections?: boolean | null;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          post_type: PostType;
          media_urls: string[];
          tags: string[];
          beneficial_count: number;
          created_at: string;
          updated_at: string;
          is_pinned: boolean;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          post_type?: PostType;
          media_urls?: string[];
          tags?: string[];
          beneficial_count?: number;
          created_at?: string;
          updated_at?: string;
          is_pinned?: boolean;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          author_id?: string;
          content?: string;
          post_type?: PostType;
          media_urls?: string[];
          tags?: string[];
          beneficial_count?: number;
          created_at?: string;
          updated_at?: string;
          is_pinned?: boolean;
          is_deleted?: boolean;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          beneficial_count: number;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          beneficial_count?: number;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          beneficial_count?: number;
        };
      };
      beneficial_marks: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      halaqas: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          rules: string | null;
          member_count: number;
          is_public: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
          avatar_url: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          rules?: string | null;
          member_count?: number;
          is_public?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          rules?: string | null;
          member_count?: number;
          is_public?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
          is_active?: boolean;
        };
      };
      halaqa_members: {
        Row: {
          halaqa_id: string;
          user_id: string;
          role: HalaqaRole;
          joined_at: string;
        };
        Insert: {
          halaqa_id: string;
          user_id: string;
          role?: HalaqaRole;
          joined_at?: string;
        };
        Update: {
          halaqa_id?: string;
          user_id?: string;
          role?: HalaqaRole;
          joined_at?: string;
        };
      };
      companion_connections: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: ConnectionStatus;
          connection_strength: number;
          last_interaction: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          recipient_id: string;
          status?: ConnectionStatus;
          connection_strength?: number;
          last_interaction?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          recipient_id?: string;
          status?: ConnectionStatus;
          connection_strength?: number;
          last_interaction?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_type: ContentType;
          content_id: string;
          reason: ReportReason;
          description: string | null;
          status: ReportStatus;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          resolution_note: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          content_type: ContentType;
          content_id: string;
          reason: ReportReason;
          description?: string | null;
          status?: ReportStatus;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          resolution_note?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          content_type?: ContentType;
          content_id?: string;
          reason?: ReportReason;
          description?: string | null;
          status?: ReportStatus;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          resolution_note?: string | null;
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
      madhab_type: MadhabType;
      post_type: PostType;
      halaqa_role: HalaqaRole;
      content_type: ContentType;
      report_reason: ReportReason;
      report_status: ReportStatus;
      connection_status: ConnectionStatus;
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

// Entity types
export type Profile = Tables<"profiles">;
export type Post = Tables<"posts">;
export type Comment = Tables<"comments">;
export type BeneficialMark = Tables<"beneficial_marks">;
export type Bookmark = Tables<"bookmarks">;
export type Halaqa = Tables<"halaqas">;
export type HalaqaMember = Tables<"halaqa_members">;
export type CompanionConnection = Tables<"companion_connections">;
export type Report = Tables<"reports">;

// Extended types with relations
export type PostWithProfile = Post & { profiles: Profile };
export type CommentWithProfile = Comment & { profiles: Profile };
