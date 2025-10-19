"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Grid3X3, List, Plus, Filter, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HalaqaCard } from "@/components/halaqas/HalaqaCard";
import { CreateHalaqa } from "@/components/halaqas/CreateHalaqa";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClient } from "@/lib/supabase/client";

type HalaqaTab = "my-halaqas" | "discover";
type ViewMode = "grid" | "list";

// Mock data for demonstration
const MY_HALAQAS = [
  {
    id: "1",
    name: "Quran Study Circle",
    description: "Weekly study of the Holy Quran with tafsir and reflection. Open to all levels.",
    category: "Quran",
    member_count: 45,
    max_members: 50,
    is_public: true,
    cover_image: null,
    rules: [
      "Respectful discussion only",
      "Come prepared with questions",
      "No controversial topics",
    ],
    created_at: "2024-01-15",
    last_activity: "2024-01-20T10:30:00Z",
    members: [
      { id: "1", name: "Ahmad", avatar: null },
      { id: "2", name: "Fatima", avatar: null },
      { id: "3", name: "Omar", avatar: null },
    ],
    is_member: true,
    role: "admin" as const,
  },
  {
    id: "2",
    name: "Fiqh Discussion Group",
    description: "Deep dive into Islamic jurisprudence and contemporary issues.",
    category: "Fiqh",
    member_count: 23,
    max_members: 30,
    is_public: false,
    cover_image: null,
    rules: [
      "Evidence-based discussions",
      "Respect different madhabs",
      "No takfir or fitna",
    ],
    created_at: "2024-01-10",
    last_activity: "2024-01-19T15:45:00Z",
    members: [
      { id: "4", name: "Yusuf", avatar: null },
      { id: "5", name: "Aisha", avatar: null },
    ],
    is_member: true,
    role: "member" as const,
  },
];

const DISCOVER_HALAQAS = [
  {
    id: "3",
    name: "Hadith Scholars Circle",
    description: "Study authentic hadith collections with qualified teachers and scholars.",
    category: "Hadith",
    member_count: 67,
    max_members: 100,
    is_public: true,
    cover_image: null,
    rules: [
      "Only verified hadith",
      "Proper chain of narration",
      "Respect for scholars",
    ],
    created_at: "2024-01-05",
    last_activity: "2024-01-20T09:15:00Z",
    members: [
      { id: "6", name: "Sheikh", avatar: null },
      { id: "7", name: "Student", avatar: null },
      { id: "8", name: "Teacher", avatar: null },
    ],
    is_member: false,
    role: null,
  },
  {
    id: "4",
    name: "Islamic History & Seerah",
    description: "Exploring the rich history of Islam and the life of Prophet Muhammad (PBUH).",
    category: "History",
    member_count: 89,
    max_members: 150,
    is_public: true,
    cover_image: null,
    rules: [
      "Historical accuracy",
      "Respect for companions",
      "Academic approach",
    ],
    created_at: "2024-01-08",
    last_activity: "2024-01-19T14:20:00Z",
    members: [
      { id: "9", name: "Historian", avatar: null },
      { id: "10", name: "Researcher", avatar: null },
      { id: "11", name: "Student", avatar: null },
      { id: "12", name: "Scholar", avatar: null },
    ],
    is_member: false,
    role: null,
  },
  {
    id: "5",
    name: "Spiritual Development",
    description: "Focus on dhikr, dua, and spiritual growth through Islamic practices.",
    category: "Spirituality",
    member_count: 34,
    max_members: 40,
    is_public: true,
    cover_image: null,
    rules: [
      "Sincere intentions",
      "Regular dhikr practice",
      "Support fellow members",
    ],
    created_at: "2024-01-12",
    last_activity: "2024-01-20T07:30:00Z",
    members: [
      { id: "13", name: "Sufi", avatar: null },
      { id: "14", name: "Seeker", avatar: null },
    ],
    is_member: false,
    role: null,
  },
  {
    id: "6",
    name: "Contemporary Issues",
    description: "Discussing modern challenges facing Muslims with Islamic perspective.",
    category: "Contemporary",
    member_count: 56,
    max_members: 80,
    is_public: true,
    cover_image: null,
    rules: [
      "Islamic framework only",
      "No political discussions",
      "Constructive dialogue",
    ],
    created_at: "2024-01-14",
    last_activity: "2024-01-18T16:45:00Z",
    members: [
      { id: "15", name: "Analyst", avatar: null },
      { id: "16", name: "Writer", avatar: null },
      { id: "17", name: "Thinker", avatar: null },
    ],
    is_member: false,
    role: null,
  },
];

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
  members: { id: string; name: string; avatar?: string }[];
  is_member: boolean;
  role?: 'admin' | 'moderator' | 'member' | null;
}

export default function HalaqasPage() {
  const { user } = useSupabaseAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<HalaqaTab>("my-halaqas");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHalaqas();
  }, [activeTab, user]);

  const loadHalaqas = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('halaqas')
        .select(`
          *,
          profiles!halaqas_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `);

      if (activeTab === "my-halaqas") {
        // Get Halaqas where user is a member
        const { data: memberData } = await supabase
          .from('halaqa_members')
          .select('halaqa_id')
          .eq('user_id', user.id);

        const halaqaIds = memberData?.map(m => m.halaqa_id) || [];
        
        if (halaqaIds.length > 0) {
          query = query.in('id', halaqaIds);
        } else {
          setHalaqas([]);
          setLoading(false);
          return;
        }
      } else {
        // Get all public Halaqas for discovery
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading Halaqas:", error);
        // Fallback to mock data
        setHalaqas(activeTab === "my-halaqas" ? MY_HALAQAS as any : DISCOVER_HALAQAS as any);
        return;
      }

      // Transform the data
      const transformedHalaqas = data?.map((halaqa: any) => ({
        id: halaqa.id,
        name: halaqa.name,
        description: halaqa.description,
        category: halaqa.category,
        member_count: halaqa.member_count || 0,
        max_members: 50, // Default, as it's not in the schema
        is_public: halaqa.is_public,
        cover_image: halaqa.avatar_url,
        rules: halaqa.rules ? halaqa.rules.split('\n').filter((r: string) => r.trim()) : [],
        created_at: halaqa.created_at,
        last_activity: halaqa.updated_at || halaqa.created_at,
        members: [], // TODO: Load members
        is_member: activeTab === "my-halaqas",
        role: activeTab === "my-halaqas" ? ('admin' as const) : undefined,
      })) || [];

      setHalaqas(transformedHalaqas);
    } catch (error) {
      console.error("Error:", error);
      // Fallback to mock data
      setHalaqas(activeTab === "my-halaqas" ? MY_HALAQAS as any : DISCOVER_HALAQAS as any);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadHalaqas(); // Refresh the list
  };

  const filteredHalaqas = halaqas.filter((halaqa) => {
    const matchesSearch = halaqa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         halaqa.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || halaqa.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Halaqas
              </h1>
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
              { id: "my-halaqas", label: "My Halaqas", count: MY_HALAQAS.length },
              { id: "discover", label: "Discover", count: DISCOVER_HALAQAS.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as HalaqaTab)}
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
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Halaqas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-md bg-background text-sm"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <span className="text-sm text-muted-foreground">
                {filteredHalaqas.length} Halaqa{filteredHalaqas.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Halaqas Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Halaqas...</p>
          </div>
        ) : filteredHalaqas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {searchQuery || selectedCategory !== "All" ? "No Halaqas found" : "No Halaqas yet"}
            </h3>
            <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search or filters to find more Halaqas."
                : activeTab === "my-halaqas"
                ? "You haven't joined any Halaqas yet. Discover some interesting circles!"
                : "No Halaqas available in this category yet."}
            </p>
            {activeTab === "discover" && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create the First Halaqa
              </Button>
            )}
          </div>
        ) : (
          <div className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }`}>
            {filteredHalaqas.map((halaqa, index) => (
              <motion.div
                key={halaqa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <HalaqaCard halaqa={halaqa} viewMode={viewMode} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Halaqa Modal */}
        {showCreateModal && (
          <CreateHalaqa
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
}