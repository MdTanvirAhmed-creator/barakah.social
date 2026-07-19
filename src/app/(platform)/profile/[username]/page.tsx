"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Edit,
  MapPin,
  Calendar,
  MessageCircle,
  Bookmark,
  Users,
  BookOpen,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/PostCard";
import { BookmarksList } from "@/components/profile/BookmarksList";
import { EditProfile } from "@/components/profile/EditProfile";
import { formatRelativeTime } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import { signPostMedia } from "@/lib/supabase/storage";

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_verified_scholar: boolean;
  madhab_preference?: string | null;
  interests: string[];
  joined_at: string;
  beneficial_count: number;
}

interface PostData {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    is_verified_scholar: boolean;
  };
  created_at: string;
  beneficial_count?: number;
  is_own_post: boolean;
  comment_count: number;
  tags: string[];
  media_urls: string[];
  has_user_marked_beneficial: boolean;
  has_user_bookmarked: boolean;
}

interface Stats {
  postCount: number;
  halaqaCount: number;
}

const MADHABS: Record<string, string> = {
  hanafi: "Hanafi",
  shafi: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
  jafari: "Ja'fari",
};

type TabType = "posts" | "about" | "bookmarks";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [stats, setStats] = useState<Stats>({ postCount: 0, halaqaCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (username) loadProfile();
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [{ data: profileData, error: profileError }, { data: { user } }] = await Promise.all([
        sb
          .from("profiles")
          .select("id, username, full_name, bio, avatar_url, is_verified_scholar, madhab_preference, interests, joined_at, beneficial_count")
          .eq("username", username)
          .single(),
        supabase.auth.getUser(),
      ]);

      if (profileError || !profileData) {
        console.error("Profile not found:", profileError);
        router.push("/404");
        return;
      }

      const p = profileData as ProfileData;
      setProfile(p);
      setIsOwnProfile(user?.id === p.id);

      // Load posts + stats in parallel
      const [postsResult, postCount, halaqaCount] = await Promise.all([
        sb
          .from("posts")
          .select(
            `id, content, tags, media_urls, created_at,
             profiles!posts_author_id_fkey(id, username, full_name, avatar_url, is_verified_scholar),
             comments!comments_post_id_fkey(count)`
          )
          .eq("author_id", p.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(20),
        sb.from("posts").select("id", { count: "exact", head: true }).eq("author_id", p.id).eq("is_deleted", false),
        sb.from("halaqa_members").select("id", { count: "exact", head: true }).eq("user_id", p.id),
      ]);

      setStats({
        postCount: postCount.count ?? 0,
        halaqaCount: halaqaCount.count ?? 0,
      });

      if (!postsResult.data) return;

      const postIds = (postsResult.data as { id: string }[]).map((pp) => pp.id);
      const viewingOwn = user?.id === p.id;
      const markedIds = new Set<string>();
      const bookmarkedIds = new Set<string>();
      const ownCounts = new Map<string, number>();

      if (user && postIds.length) {
        const [{ data: marks }, { data: bkmarks }, { data: authorMarks }] = await Promise.all([
          sb.from("beneficial_marks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
          sb.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
          // The true per-post tally is visible only to the author, so only
          // worth fetching when you are looking at your own profile.
          viewingOwn
            ? sb.from("beneficial_marks").select("post_id").in("post_id", postIds)
            : Promise.resolve({ data: [] as { post_id: string }[] }),
        ]);
        (marks as { post_id: string }[] | null)?.forEach((m) => markedIds.add(m.post_id));
        (bkmarks as { post_id: string }[] | null)?.forEach((b) => bookmarkedIds.add(b.post_id));
        (authorMarks as { post_id: string }[] | null)?.forEach((m) =>
          ownCounts.set(m.post_id, (ownCounts.get(m.post_id) ?? 0) + 1)
        );
      }

      // Private media → short-lived signed URLs, one batch.
      const allPaths = (postsResult.data as any[]).flatMap(
        (post) => (post.media_urls ?? []) as string[]
      );
      const signed = await signPostMedia(allPaths);
      const urlByPath = new Map<string, string>();
      allPaths.forEach((path, i) => urlByPath.set(path, signed[i]));

      const transformed: PostData[] = (postsResult.data as any[]).map((post) => ({
        id: post.id,
        content: post.content,
        author: {
          id: post.profiles.id,
          username: post.profiles.username,
          full_name: post.profiles.full_name,
          avatar_url: post.profiles.avatar_url,
          is_verified_scholar: post.profiles.is_verified_scholar,
        },
        created_at: post.created_at,
        is_own_post: viewingOwn,
        beneficial_count: viewingOwn ? ownCounts.get(post.id) ?? 0 : undefined,
        comment_count: post.comments?.[0]?.count ?? 0,
        tags: post.tags ?? [],
        media_urls: ((post.media_urls ?? []) as string[])
          .map((path) => urlByPath.get(path) ?? "")
          .filter(Boolean),
        has_user_marked_beneficial: markedIds.has(post.id),
        has_user_bookmarked: bookmarkedIds.has(post.id),
      }));

      setPosts(transformed);
    } finally {
      setIsLoading(false);
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 relative">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="container-custom">
        {/* Profile Header */}
        <div className="relative -mt-20 md:-mt-24 mb-6">
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-xl">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-4xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.full_name}</h1>
                      {profile.is_verified_scholar && (
                        <Check className="w-6 h-6 text-primary-500 fill-primary-500" />
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-foreground-secondary leading-relaxed max-w-2xl">{profile.bio}</p>
                    )}
                  </div>

                  {isOwnProfile && (
                    <Button onClick={() => setShowEditModal(true)} className="mt-4 md:mt-0">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatRelativeTime(profile.joined_at)}</span>
                  </div>
                  {profile.madhab_preference && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{MADHABS[profile.madhab_preference] ?? profile.madhab_preference} Madhab</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.postCount}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  {isOwnProfile && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{profile.beneficial_count}</div>
                      <div className="text-sm text-muted-foreground">Beneficial</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.halaqaCount}</div>
                    <div className="text-sm text-muted-foreground">Halaqas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex gap-1">
              {([
                { id: "posts", label: "Posts", icon: MessageCircle },
                { id: "about", label: "About", icon: Users },
                ...(isOwnProfile ? [{ id: "bookmarks" as const, label: "Bookmarks", icon: Bookmark }] : []),
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-primary-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="profileTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === "posts" && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No posts yet.</p>
                </div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="bg-card rounded-lg shadow-md border border-border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">About</h3>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <p className="text-foreground-secondary mt-1">{profile.bio || "No bio added yet."}</p>
              </div>

              {profile.madhab_preference && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Madhab</label>
                  <p className="text-foreground-secondary mt-1">
                    {MADHABS[profile.madhab_preference] ?? profile.madhab_preference}
                  </p>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interests</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <p className="text-foreground-secondary mt-1">
                  {new Date(profile.joined_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}

          {activeTab === "bookmarks" && isOwnProfile && <BookmarksList />}
        </div>
      </div>

      {showEditModal && isOwnProfile && (
        <EditProfile
          profile={{
            ...profile,
            bio: profile.bio || "",
            avatar_url: profile.avatar_url || null,
            madhab_preference: profile.madhab_preference || null,
            cover_url: null,
            location: "",
          } as any}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setProfile((prev) => prev ? { ...prev, ...(updated as Partial<ProfileData>) } : prev);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
