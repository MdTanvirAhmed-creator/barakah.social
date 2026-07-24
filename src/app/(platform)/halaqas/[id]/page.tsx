"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Calendar,
  Lock,
  Globe,
  Crown,
  UserCheck,
  Pin,
  PinOff,
  Plus,
  Settings,
  ChevronDown,
  ChevronUp,
  Activity,
  BookOpen,
  Loader2,
  Trash2,
  Eye,
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { useToast } from "@/hooks/useToast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClient } from "@/lib/supabase/client";
import { signPostMedia } from "@/lib/supabase/storage";
import { CommentSection } from "@/components/comments/CommentSection";
import { CompanionDiscoveryCard } from "@/components/halaqas/CompanionDiscoveryCard";
import { useHalaqaCompanions } from "@/hooks/useHalaqaCompanions";

interface HalaqaDetailPageProps {
  params: { id: string };
}

interface Halaqa {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  max_members: number;
  is_public: boolean;
  cover_image?: string;
  rules: string[];
  created_at: string;
  last_activity: string;
  created_by: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: string;
    joined_at: string;
  }>;
  is_member: boolean;
  role?: string;
}

export default function HalaqaDetailPage({ params }: HalaqaDetailPageProps) {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const { success, error: showError } = useToast();
  const supabase = createClient();
  
  const [halaqa, setHalaqa] = useState<Halaqa | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "members" | "about">("feed");
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoiningCircle, setIsJoiningCircle] = useState(false);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  
  // Load companion matches for this Halaqa
  const { matches: companionMatches, loading: companionsLoading } = useHalaqaCompanions(id as string);

  useEffect(() => {
    loadHalaqa();
    loadPosts();
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.querySelector('[data-manage-dropdown]');
      
      if (showManageDropdown && dropdown && !dropdown.contains(target)) {
        setShowManageDropdown(false);
      }
    };

    if (showManageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManageDropdown]);

  const loadHalaqa = async () => {
    try {
      setLoading(true);

      // The halaqa row itself. RLS: visible when public, or when the viewer
      // belongs to it — an invisible circle correctly renders "not found".
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: halaqaData, error } = await (supabase as any)
        .from('halaqas')
        .select('*')
        .eq('id', id || params.id)
        .maybeSingle();

      if (error || !halaqaData) {
        if (error) console.error("Error loading Halaqa:", error);
        setHalaqa(null);
        setLoading(false);
        return;
      }

      // Membership rows, then identities from the public card view —
      // the private profiles table only returns self + companions, which
      // would blank out most member names.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membersData } = await (supabase as any)
        .from('halaqa_members')
        .select('user_id, role, joined_at')
        .eq('halaqa_id', halaqaData.id);

      const memberRows = (membersData as any[]) ?? [];
      const identityIds = [
        ...new Set([...memberRows.map((m) => m.user_id), halaqaData.created_by]),
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cards } = identityIds.length
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('public_profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', identityIds)
        : { data: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardById = new Map(((cards as any[]) ?? []).map((c) => [c.id, c]));

      const creatorCard = cardById.get(halaqaData.created_by);
      const myRow = memberRows.find((m) => m.user_id === user?.id);

      const transformedHalaqa: Halaqa = {
        id: halaqaData.id,
        name: halaqaData.name,
        description: halaqaData.description,
        category: halaqaData.category,
        member_count: halaqaData.member_count || 0,
        max_members: 50,
        is_public: halaqaData.is_public,
        cover_image: halaqaData.avatar_url,
        rules: halaqaData.rules ? halaqaData.rules.split('\n').filter((r: string) => r.trim()) : [],
        created_at: halaqaData.created_at,
        last_activity: halaqaData.updated_at || halaqaData.created_at,
        created_by: {
          id: halaqaData.created_by,
          username: creatorCard?.username ?? "member",
          full_name: creatorCard?.display_name ?? "A community member",
          avatar_url: creatorCard?.avatar_url ?? null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        members: memberRows.map((m: any) => ({
          id: m.user_id,
          name: cardById.get(m.user_id)?.display_name ?? "A community member",
          avatar: cardById.get(m.user_id)?.avatar_url ?? null,
          role: m.role,
          joined_at: m.joined_at,
        })),
        is_member: !!myRow,
        role: myRow?.role ?? undefined,
      };

      setHalaqa(transformedHalaqa);
    } catch (error) {
      console.error("Error:", error);
      setHalaqa(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHalaqa = async () => {
    if (!user || !halaqa) return;
    try {
      setIsJoiningCircle(true);
      // Always as a plain member — seats of responsibility are granted, not
      // claimed (RLS enforces this regardless).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('halaqa_members')
        .insert({ halaqa_id: halaqa.id, user_id: user.id, role: 'member' });
      if (error) throw error;
      success("Welcome to the circle!");
      await loadHalaqa();
    } catch (err) {
      console.error("Error joining halaqa:", err);
      showError("Could not join this halaqa. Please try again.");
    } finally {
      setIsJoiningCircle(false);
    }
  };

  const handleDeleteHalaqa = async () => {
    if (!confirm("Are you sure you want to delete this Halaqa? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('halaqas')
        .delete()
        .eq('id', halaqa?.id);

      if (error) {
        console.error("Error deleting Halaqa:", error);
        alert(`Failed to delete Halaqa: ${error.message}`);
        return;
      }

      success("Halaqa deleted successfully!");
      router.push('/halaqas');
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete Halaqa. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await (supabase as any)
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        // Posts belonging to this halaqa (RLS already limits to what members
        // may see). Older tag-associated posts are not shown here.
        .eq('halaqa_id', halaqa?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error loading posts:", error);
        return;
      }

      // Private media → signed URLs.
      const rows = (postsData || []) as any[];
      const allPaths = rows.flatMap((p) => (p.media_urls ?? []) as string[]);
      const signed = await signPostMedia(allPaths);
      const urlByPath = new Map<string, string>();
      allPaths.forEach((path, i) => urlByPath.set(path, signed[i]));
      rows.forEach((p) => {
        p.media_urls = ((p.media_urls ?? []) as string[])
          .map((path) => urlByPath.get(path) ?? "")
          .filter(Boolean);
      });

      setPosts(rows);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('posts')
        .update({ is_pinned: !isPinned })
        .eq('id', postId);

      if (error) throw error;

      success(isPinned ? "Post unpinned" : "Post pinned");
      await loadPosts();
    } catch (error) {
      console.error("Error pinning post:", error);
      alert("Failed to pin post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      success("Post deleted successfully");
      await loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      alert("Please write something to share");
      return;
    }

    if (!user) {
      alert("You must be logged in to post");
      return;
    }

    try {
      setIsPosting(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('posts')
        .insert({
          author_id: user.id,
          content: postContent,
          post_type: 'standard',
          tags: [halaqa?.category || ''],
          // Scope the post to this halaqa via the real privacy model: only
          // members may read it (enforced by RLS), not the whole network.
          visibility: 'halaqa',
          halaqa_id: halaqa?.id,
        });

      if (error) {
        console.error("Error creating post:", error);
        alert(`Failed to create post: ${error.message}`);
        return;
      }

      success("Post shared in Halaqa!");
      setPostContent("");
      setShowPostComposer(false);
      // Refresh posts
      await loadPosts();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditHalaqa = async () => {
    if (!halaqa || !editForm.name.trim()) {
      alert("Please enter a halaqa name");
      return;
    }
    
    try {
      console.log("Updating halaqa:", halaqa.id, editForm);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('halaqas')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim()
        })
        .eq('id', halaqa.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Update successful:", data);

      // Update local state
      setHalaqa({
        ...halaqa,
        name: editForm.name.trim(),
        description: editForm.description.trim()
      });

      success("Halaqa updated successfully!");
      setShowEditModal(false);
    } catch (error: any) {
      console.error("Error updating halaqa:", error);
      alert(`Failed to update halaqa: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Halaqa...</p>
        </div>
      </div>
    );
  }

  if (!halaqa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Halaqa not found</h2>
          <p className="text-muted-foreground mb-6">This study circle doesn&apos;t exist or has been removed.</p>
          <Link href="/halaqas">
            <Button>Back to Halaqas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayedMembers = showAllMembers ? halaqa.members : halaqa.members.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/halaqas">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Halaqas
            </Button>
          </Link>
        </div>

        {/* Halaqa Header */}
        <div className="bg-card rounded-lg shadow-md border border-border mb-6">
          {/* Cover */}
          <div className="h-48 bg-gradient-to-br from-emerald-500 to-teal-600 relative rounded-t-lg overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {halaqa.is_public ? (
                <Globe className="w-5 h-5 text-white" />
              ) : (
                <Lock className="w-5 h-5 text-white" />
              )}
              <span className="text-white text-sm font-medium">
                {halaqa.is_public ? "Public" : "Private"}
              </span>
            </div>
            <div className="absolute bottom-4 right-4 text-4xl">
              📖
            </div>
          </div>

          {/* Header Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {halaqa.name}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{halaqa.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{halaqa.member_count} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatRelativeTime(halaqa.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {halaqa.role === "admin" && (
                <div className="relative" data-manage-dropdown>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManageDropdown(!showManageDropdown)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                  
                  {/* Manage Dropdown */}
                  {showManageDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] overflow-visible" style={{minWidth: '240px'}}>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowManageDropdown(false);
                            setEditForm({ name: halaqa.name, description: halaqa.description });
                            setShowEditModal(true);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Settings className="w-4 h-4 inline mr-2" />
                          Edit Halaqa
                        </button>
                        <button
                          onClick={() => {
                            setShowManageDropdown(false);
                            // Copy invite link to clipboard
                            const inviteLink = `${window.location.origin}/halaqas/${id}`;
                            navigator.clipboard.writeText(inviteLink).then(() => {
                              success("Invite link copied to clipboard!");
                            });
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Users className="w-4 h-4 inline mr-2" />
                          Copy Invite Link
                        </button>
                        <button
                          onClick={async () => {
                            setShowManageDropdown(false);
                            if (!halaqa) return;
                            
                            try {
                              const newVisibility = !halaqa.is_public;
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const { error } = await (supabase as any)
                                .from('halaqas')
                                .update({ is_public: newVisibility })
                                .eq('id', halaqa.id);

                              if (error) throw error;

                              setHalaqa({ ...halaqa, is_public: newVisibility });
                              success(`Halaqa is now ${newVisibility ? 'public' : 'private'}`);
                            } catch (error: any) {
                              console.error("Error toggling visibility:", error);
                              alert(`Failed to update visibility: ${error.message || 'Unknown error'}`);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4 inline mr-2" />
                          {halaqa?.is_public ? 'Make Private' : 'Make Public'}
                        </button>
                        <hr className="my-1 border-gray-200 dark:border-gray-600" />
                        <button
                          onClick={() => {
                            setShowManageDropdown(false);
                            handleDeleteHalaqa();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Halaqa"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )}
                {halaqa.is_member && halaqa.role ? (
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    halaqa.role === "admin"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      : halaqa.role === "moderator"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  }`}>
                    {halaqa.role === "admin" && <Crown className="w-4 h-4" />}
                    {halaqa.role === "moderator" && <UserCheck className="w-4 h-4" />}
                    {halaqa.role}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleJoinHalaqa}
                    disabled={isJoiningCircle}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {isJoiningCircle ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Halaqa"
                    )}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-foreground-secondary text-lg leading-relaxed">
              {halaqa.description}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {[
            { id: "feed", label: "Feed", count: posts.length },
            { id: "members", label: "Members", count: halaqa.member_count },
            { id: "about", label: "About", count: halaqa.rules.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                  isActive
                    ? "text-primary-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="halaqa-detail-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "feed" && (
              <div className="space-y-6">
                {/* Sharing into the circle is for its members */}
                {halaqa.is_member && (
                  <div className="bg-card rounded-lg shadow-md border border-border p-4">
                    {!showPostComposer ? (
                      <Button 
                        className="w-full bg-primary-600 hover:bg-primary-700"
                        onClick={() => setShowPostComposer(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Share in this Halaqa
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="Share knowledge with your Halaqa members..."
                          className="w-full min-h-[120px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary-600"
                          disabled={isPosting}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {postContent.length} / 2000
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowPostComposer(false);
                                setPostContent("");
                              }}
                              disabled={isPosting}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCreatePost}
                              disabled={isPosting || !postContent.trim() || postContent.length > 2000}
                              className="bg-primary-600 hover:bg-primary-700"
                            >
                              {isPosting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                "Post"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pinned Posts */}
                {posts.filter(post => post.is_pinned).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Pin className="w-5 h-5 text-secondary-600" />
                      Pinned Posts
                    </h3>
                    <div className="space-y-4">
                      {posts.filter(post => post.is_pinned).map((post) => (
                        <div key={post.id} className="bg-card rounded-lg shadow-md border border-border p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary-100 text-primary-700">
                                {getInitials(post.profiles?.full_name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {post.profiles?.full_name || 'Unknown User'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatRelativeTime(post.created_at)}
                                </span>
                              </div>
                            </div>
                            {halaqa?.role === "admin" && (
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePinPost(post.id, post.is_pinned)}
                                  className="text-muted-foreground hover:text-foreground"
                                  title={post.is_pinned ? "Unpin post" : "Pin post"}
                                >
                                  {post.is_pinned ? (
                                    <PinOff className="w-4 h-4" />
                                  ) : (
                                    <Pin className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-foreground mb-4">{post.content}</p>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 pt-3 border-t border-border">
                            {/* Beneficial (Like) */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                try {
                                  const supabase = createClient();
                                  const { data: { user } } = await supabase.auth.getUser();
                                  
                                  if (!user) {
                                    alert("Please log in to mark as beneficial");
                                    return;
                                  }

                                  const isCurrentlyMarked = post.has_user_marked_beneficial;

                                  if (isCurrentlyMarked) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('beneficial_marks')
                                      .delete()
                                      .eq('post_id', post.id)
                                      .eq('user_id', user.id);

                                    if (error) throw error;

                                    setPosts(posts.map(p =>
                                      p.id === post.id
                                        ? { ...p, beneficial_count: (p.beneficial_count || 1) - 1, has_user_marked_beneficial: false }
                                        : p
                                    ));
                                    success("Removed from beneficial");
                                  } else {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('beneficial_marks')
                                      .insert({ post_id: post.id, user_id: user.id });

                                    if (error) throw error;
                                    
                                    setPosts(posts.map(p => 
                                      p.id === post.id 
                                        ? { ...p, beneficial_count: (p.beneficial_count || 0) + 1, has_user_marked_beneficial: true }
                                        : p
                                    ));
                                    success("Marked as beneficial");
                                  }
                                } catch (error: any) {
                                  console.error("Error toggling beneficial:", error);
                                  alert(`Failed: ${error.message || 'Unknown error'}`);
                                }
                              }}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                post.has_user_marked_beneficial
                                  ? "text-success bg-success-50 dark:bg-success-900/20"
                                  : "text-muted-foreground hover:bg-muted hover:text-success"
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  post.has_user_marked_beneficial ? "fill-success" : ""
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {post.beneficial_count && post.beneficial_count > 0 ? post.beneficial_count : ""}
                              </span>
                              <span className="hidden sm:inline text-sm">
                                {post.has_user_marked_beneficial ? "Beneficial" : "نافع"}
                              </span>
                            </motion.button>

                            {/* Comment */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                expandedComments === post.id
                                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                  : "text-muted-foreground hover:bg-muted hover:text-primary-600"
                              }`}
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {post.comment_count && post.comment_count > 0 ? post.comment_count : ""}
                              </span>
                              <span className="hidden sm:inline text-sm">Comment</span>
                            </motion.button>

                            {/* Share */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: `Post in ${halaqa?.name}`,
                                    text: post.content.slice(0, 100),
                                    url: `${window.location.origin}/halaqas/${id}`,
                                  }).catch(() => {});
                                } else {
                                  navigator.clipboard.writeText(`${window.location.origin}/halaqas/${id}`);
                                  success("Link copied to clipboard");
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Share2 className="w-5 h-5" />
                              <span className="hidden sm:inline text-sm">Share</span>
                            </motion.button>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Bookmark */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                try {
                                  const supabase = createClient();
                                  const { data: { user } } = await supabase.auth.getUser();
                                  
                                  if (!user) {
                                    alert("Please log in to bookmark");
                                    return;
                                  }

                                  const isCurrentlyBookmarked = post.has_user_bookmarked;

                                  if (isCurrentlyBookmarked) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('bookmarks')
                                      .delete()
                                      .eq('post_id', post.id)
                                      .eq('user_id', user.id);

                                    if (error) throw error;

                                    setPosts(posts.map(p =>
                                      p.id === post.id
                                        ? { ...p, has_user_bookmarked: false }
                                        : p
                                    ));
                                    success("Removed bookmark");
                                  } else {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('bookmarks')
                                      .insert({ post_id: post.id, user_id: user.id });

                                    if (error) throw error;
                                    
                                    setPosts(posts.map(p => 
                                      p.id === post.id 
                                        ? { ...p, has_user_bookmarked: true }
                                        : p
                                    ));
                                    success("Bookmarked");
                                  }
                                } catch (error: any) {
                                  console.error("Error toggling bookmark:", error);
                                  alert(`Failed: ${error.message || 'Unknown error'}`);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                post.has_user_bookmarked
                                  ? "text-secondary-600 bg-secondary-50 dark:bg-secondary-900/20"
                                  : "text-muted-foreground hover:bg-muted hover:text-secondary-600"
                              }`}
                              title={post.has_user_bookmarked ? "Remove bookmark" : "Bookmark"}
                            >
                              {post.has_user_bookmarked ? (
                                <BookmarkCheck className="w-5 h-5 fill-secondary-600" />
                              ) : (
                                <Bookmark className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>

                          {/* Comment Section */}
                          {expandedComments === post.id && (
                            <CommentSection 
                              postId={post.id} 
                              commentCount={post.comment_count || 0}
                              isExpanded={true}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Posts */}
                {posts.filter(post => !post.is_pinned).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary-600" />
                      Recent Posts
                    </h3>
                    <div className="space-y-4">
                      {posts.filter(post => !post.is_pinned).map((post) => (
                        <div key={post.id} className="bg-card rounded-lg shadow-md border border-border p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary-100 text-primary-700">
                                {getInitials(post.profiles?.full_name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {post.profiles?.full_name || 'Unknown User'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatRelativeTime(post.created_at)}
                                </span>
                              </div>
                            </div>
                            {halaqa?.role === "admin" && (
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePinPost(post.id, post.is_pinned)}
                                  className="text-muted-foreground hover:text-foreground"
                                  title={post.is_pinned ? "Unpin post" : "Pin post"}
                                >
                                  {post.is_pinned ? (
                                    <PinOff className="w-4 h-4" />
                                  ) : (
                                    <Pin className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-foreground mb-4">{post.content}</p>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 pt-3 border-t border-border">
                            {/* Beneficial (Like) */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                try {
                                  const supabase = createClient();
                                  const { data: { user } } = await supabase.auth.getUser();
                                  
                                  if (!user) {
                                    alert("Please log in to mark as beneficial");
                                    return;
                                  }

                                  const isCurrentlyMarked = post.has_user_marked_beneficial;

                                  if (isCurrentlyMarked) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('beneficial_marks')
                                      .delete()
                                      .eq('post_id', post.id)
                                      .eq('user_id', user.id);

                                    if (error) throw error;

                                    setPosts(posts.map(p =>
                                      p.id === post.id
                                        ? { ...p, beneficial_count: (p.beneficial_count || 1) - 1, has_user_marked_beneficial: false }
                                        : p
                                    ));
                                    success("Removed from beneficial");
                                  } else {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('beneficial_marks')
                                      .insert({ post_id: post.id, user_id: user.id });

                                    if (error) throw error;
                                    
                                    setPosts(posts.map(p => 
                                      p.id === post.id 
                                        ? { ...p, beneficial_count: (p.beneficial_count || 0) + 1, has_user_marked_beneficial: true }
                                        : p
                                    ));
                                    success("Marked as beneficial");
                                  }
                                } catch (error: any) {
                                  console.error("Error toggling beneficial:", error);
                                  alert(`Failed: ${error.message || 'Unknown error'}`);
                                }
                              }}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                post.has_user_marked_beneficial
                                  ? "text-success bg-success-50 dark:bg-success-900/20"
                                  : "text-muted-foreground hover:bg-muted hover:text-success"
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  post.has_user_marked_beneficial ? "fill-success" : ""
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {post.beneficial_count && post.beneficial_count > 0 ? post.beneficial_count : ""}
                              </span>
                              <span className="hidden sm:inline text-sm">
                                {post.has_user_marked_beneficial ? "Beneficial" : "نافع"}
                              </span>
                            </motion.button>

                            {/* Comment */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                expandedComments === post.id
                                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                  : "text-muted-foreground hover:bg-muted hover:text-primary-600"
                              }`}
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {post.comment_count && post.comment_count > 0 ? post.comment_count : ""}
                              </span>
                              <span className="hidden sm:inline text-sm">Comment</span>
                            </motion.button>

                            {/* Share */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: `Post in ${halaqa?.name}`,
                                    text: post.content.slice(0, 100),
                                    url: `${window.location.origin}/halaqas/${id}`,
                                  }).catch(() => {});
                                } else {
                                  navigator.clipboard.writeText(`${window.location.origin}/halaqas/${id}`);
                                  success("Link copied to clipboard");
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Share2 className="w-5 h-5" />
                              <span className="hidden sm:inline text-sm">Share</span>
                            </motion.button>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Bookmark */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                try {
                                  const supabase = createClient();
                                  const { data: { user } } = await supabase.auth.getUser();
                                  
                                  if (!user) {
                                    alert("Please log in to bookmark");
                                    return;
                                  }

                                  const isCurrentlyBookmarked = post.has_user_bookmarked;

                                  if (isCurrentlyBookmarked) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('bookmarks')
                                      .delete()
                                      .eq('post_id', post.id)
                                      .eq('user_id', user.id);

                                    if (error) throw error;

                                    setPosts(posts.map(p =>
                                      p.id === post.id
                                        ? { ...p, has_user_bookmarked: false }
                                        : p
                                    ));
                                    success("Removed bookmark");
                                  } else {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const { error } = await (supabase as any)
                                      .from('bookmarks')
                                      .insert({ post_id: post.id, user_id: user.id });

                                    if (error) throw error;
                                    
                                    setPosts(posts.map(p => 
                                      p.id === post.id 
                                        ? { ...p, has_user_bookmarked: true }
                                        : p
                                    ));
                                    success("Bookmarked");
                                  }
                                } catch (error: any) {
                                  console.error("Error toggling bookmark:", error);
                                  alert(`Failed: ${error.message || 'Unknown error'}`);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                post.has_user_bookmarked
                                  ? "text-secondary-600 bg-secondary-50 dark:bg-secondary-900/20"
                                  : "text-muted-foreground hover:bg-muted hover:text-secondary-600"
                              }`}
                              title={post.has_user_bookmarked ? "Remove bookmark" : "Bookmark"}
                            >
                              {post.has_user_bookmarked ? (
                                <BookmarkCheck className="w-5 h-5 fill-secondary-600" />
                              ) : (
                                <Bookmark className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>

                          {/* Comment Section */}
                          {expandedComments === post.id && (
                            <CommentSection 
                              postId={post.id} 
                              commentCount={post.comment_count || 0}
                              isExpanded={true}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-6">
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Members ({halaqa.member_count})
                    </h3>
                    {halaqa.member_count > 6 && (
                      <button
                        onClick={() => setShowAllMembers(!showAllMembers)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        {showAllMembers ? (
                          <>
                            <ChevronUp className="w-4 h-4 inline mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 inline mr-1" />
                            Show All
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-muted">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{member.name}</span>
                            {member.role === "admin" && (
                              <Crown className="w-4 h-4 text-red-600" />
                            )}
                            {member.role === "moderator" && (
                              <UserCheck className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined {formatRelativeTime(member.joined_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6">
                {/* Rules */}
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Halaqa Rules</h3>
                  <ul className="space-y-3">
                    {halaqa.rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-foreground-secondary">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Created By */}
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Created By</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={halaqa.created_by.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {getInitials(halaqa.created_by.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">
                        {halaqa.created_by.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{halaqa.created_by.username}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Halaqa Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">
                        {halaqa.member_count}
                      </div>
                      <div className="text-sm text-muted-foreground">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">
                        {halaqa.max_members}
                      </div>
                      <div className="text-sm text-muted-foreground">Max Capacity</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-semibold text-foreground">{halaqa.member_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-semibold text-foreground">{halaqa.max_members}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="font-semibold text-foreground">
                    {formatRelativeTime(halaqa.last_activity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Companion Discovery */}
            {!companionsLoading && companionMatches.length > 0 && halaqa && (
              <CompanionDiscoveryCard
                halaqaId={halaqa.id}
                halaqaTopic={halaqa.name}
                matches={companionMatches}
              />
            )}

            {/* Recent Members */}
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Members</h3>
              <div className="space-y-3">
                {halaqa.members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback className="bg-muted text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {member.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {formatRelativeTime(member.joined_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Halaqa Modal */}
      {showEditModal && halaqa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Halaqa</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  placeholder="Enter halaqa name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  placeholder="Enter halaqa description"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => setShowEditModal(false)} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditHalaqa}
                  disabled={!editForm.name.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
