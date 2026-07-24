"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Grid3X3, List, Plus, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GirihEmptyState, GirihLoader } from "@/components/ui/girih";
import { Input } from "@/components/ui/input";
import { HalaqaCard } from "@/components/halaqas/HalaqaCard";
import { CreateHalaqa } from "@/components/halaqas/CreateHalaqa";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClient } from "@/lib/supabase/client";

type HalaqaTab = "my-halaqas" | "discover";
type ViewMode = "grid" | "list";

const CATEGORIES = [
  "All",
  "Quran",
  "Hadith",
  "Fiqh",
  "History",
  "Spirituality",
  "Contemporary",
  "Family",
  "Finance",
];

export interface HalaqaItem {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_public: boolean;
  avatar_url: string | null;
  rules: string[];
  created_at: string;
  updated_at: string;
  members: Array<{ id: string; name: string; avatar: string | null }>;
  is_member: boolean;
  role: "admin" | "moderator" | "member" | null;
}

export default function HalaqasPage() {
  const { user } = useSupabaseAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<HalaqaTab>("my-halaqas");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [halaqas, setHalaqas] = useState<HalaqaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHalaqas();
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadHalaqas() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "my-halaqas") {
        // Get user's memberships with roles
        const { data: memberships, error: memberError } = await (supabase as any)
          .from("halaqa_members")
          .select("halaqa_id, role")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Error loading memberships:", memberError);
          setHalaqas([]);
          return;
        }

        if (!memberships?.length) {
          setHalaqas([]);
          return;
        }

        const roleMap = Object.fromEntries(
          (memberships as { halaqa_id: string; role: string }[]).map((m) => [m.halaqa_id, m.role])
        );
        const halaqaIds = Object.keys(roleMap);

        const { data, error } = await (supabase as any)
          .from("halaqas")
          .select("id, name, description, category, member_count, is_public, avatar_url, rules, created_at, updated_at")
          .in("id", halaqaIds)
          .eq("is_active", true)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error loading halaqas:", error);
          setHalaqas([]);
          return;
        }

        // Batch-load preview members for all halaqas
        const memberPreviews = await loadMemberPreviews(halaqaIds);

        const transformed: HalaqaItem[] = (data as any[]).map((h) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category,
          member_count: h.member_count ?? 0,
          is_public: h.is_public,
          avatar_url: h.avatar_url,
          rules: h.rules ? h.rules.split("\n").filter((r: string) => r.trim()) : [],
          created_at: h.created_at,
          updated_at: h.updated_at,
          members: memberPreviews[h.id] ?? [],
          is_member: true,
          role: (roleMap[h.id] as HalaqaItem["role"]) ?? "member",
        }));

        setHalaqas(transformed);
      } else {
        // Discover: all public active halaqas
        const { data, error } = await (supabase as any)
          .from("halaqas")
          .select("id, name, description, category, member_count, is_public, avatar_url, rules, created_at, updated_at")
          .eq("is_public", true)
          .eq("is_active", true)
          .order("member_count", { ascending: false });

        if (error) {
          console.error("Error loading halaqas:", error);
          setHalaqas([]);
          return;
        }

        // Check which ones user is already in
        const { data: memberships } = await (supabase as any)
          .from("halaqa_members")
          .select("halaqa_id, role")
          .eq("user_id", user.id);

        const roleMap = Object.fromEntries(
          (memberships as { halaqa_id: string; role: string }[] | null ?? []).map((m) => [m.halaqa_id, m.role])
        );

        const allIds = (data as any[]).map((h) => h.id);
        const memberPreviews = await loadMemberPreviews(allIds);

        const transformed: HalaqaItem[] = (data as any[]).map((h) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category,
          member_count: h.member_count ?? 0,
          is_public: h.is_public,
          avatar_url: h.avatar_url,
          rules: h.rules ? h.rules.split("\n").filter((r: string) => r.trim()) : [],
          created_at: h.created_at,
          updated_at: h.updated_at,
          members: memberPreviews[h.id] ?? [],
          is_member: !!roleMap[h.id],
          role: (roleMap[h.id] as HalaqaItem["role"]) ?? null,
        }));

        setHalaqas(transformed);
      }
    } catch (err) {
      console.error("Error loading halaqas:", err);
      setHalaqas([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMemberPreviews(
    halaqaIds: string[]
  ): Promise<Record<string, Array<{ id: string; name: string; avatar: string | null }>>> {
    if (!halaqaIds.length) return {};

    // Identities via the public card view — the private profiles table only
    // returns self + companions, which would blank most previews.
    const { data } = await (supabase as any)
      .from("halaqa_members")
      .select("halaqa_id, user_id")
      .in("halaqa_id", halaqaIds)
      .limit(halaqaIds.length * 3); // up to 3 per halaqa

    const rows = (data as any[] | null) ?? [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const { data: cards } = ids.length
      ? await (supabase as any)
          .from("public_profiles")
          .select("id, display_name, avatar_url")
          .in("id", ids)
      : { data: [] };
    const cardById = new Map(((cards as any[]) ?? []).map((c) => [c.id, c]));

    const grouped: Record<string, Array<{ id: string; name: string; avatar: string | null }>> = {};
    rows.forEach((row) => {
      const hid = row.halaqa_id;
      if (!grouped[hid]) grouped[hid] = [];
      const card = cardById.get(row.user_id);
      if (grouped[hid].length < 3 && card) {
        grouped[hid].push({
          id: card.id,
          name: card.display_name ?? "Member",
          avatar: card.avatar_url,
        });
      }
    });
    return grouped;
  }

  const filteredHalaqas = halaqas.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || h.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const myCount = halaqas.filter((h) => h.is_member).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Halaqas</h1>
              <p className="text-foreground-secondary">
                Join study circles and connect with fellow believers
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Halaqa
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "my-halaqas" as HalaqaTab, label: "My Halaqas", count: activeTab === "my-halaqas" ? filteredHalaqas.length : null },
              { id: "discover" as HalaqaTab, label: "Discover", count: activeTab === "discover" ? filteredHalaqas.length : null },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                    isActive
                      ? "text-accent-strong"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && !loading && tab.count !== null && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="halaqas-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Halaqas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-md bg-background text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredHalaqas.length} Halaqa{filteredHalaqas.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(["grid", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={`${mode} view`}
                >
                  {mode === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <GirihLoader size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Halaqas...</p>
          </div>
        ) : filteredHalaqas.length === 0 ? (
          <GirihEmptyState
            className="my-8"
            title={
              searchQuery || selectedCategory !== "All" ? "No Halaqas found" : "Your circles await."
            }
            description={
              searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search or filters."
                : activeTab === "my-halaqas"
                ? "Join a circle of study — discover Halaqas gathering around what you love."
                : "No public Halaqas yet — be the first to gather one."
            }
            action={
              activeTab === "my-halaqas" && !searchQuery && selectedCategory === "All" ? (
                <Button onClick={() => setActiveTab("discover")}>Discover Halaqas</Button>
              ) : activeTab === "discover" && !searchQuery && selectedCategory === "All" ? (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 me-2" />
                  Create the first Halaqa
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredHalaqas.map((halaqa, index) => (
              <motion.div
                key={halaqa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <HalaqaCard
                  halaqa={halaqa}
                  viewMode={viewMode}
                  onMembershipChange={loadHalaqas}
                />
              </motion.div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateHalaqa
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              setActiveTab("my-halaqas");
              loadHalaqas();
            }}
          />
        )}
      </div>
    </div>
  );
}
