"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Award,
  Filter,
  ChevronRight,
  Loader2,
  Library,
  ScrollText,
  Scale,
  Gem,
  Footprints,
  Sparkles,
  Globe,
  Users,
  LibraryBig,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { LearningPath } from "@/components/knowledge/LearningPath";
import { FilterPanel } from "@/components/knowledge/FilterPanel";
import { StudyTogetherBanner } from "@/components/knowledge/StudyTogetherBanner";
import { GirihPattern, TazhibCorner } from "@/components/ui/girih";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

// Quiet duotone tiles — line icons on teal/lapis tints (no emoji, no gradients)
const CATEGORIES = [
  { id: "quran", name: "Quran", icon: BookOpen, tint: "teal" },
  { id: "hadith", name: "Hadith", icon: ScrollText, tint: "lapis" },
  { id: "fiqh", name: "Fiqh", icon: Scale, tint: "teal" },
  { id: "aqeedah", name: "Aqeedah", icon: Gem, tint: "lapis" },
  { id: "seerah", name: "Seerah", icon: Footprints, tint: "teal" },
  { id: "spirituality", name: "Spirituality", icon: Sparkles, tint: "lapis" },
  { id: "contemporary", name: "Contemporary", icon: Globe, tint: "teal" },
  { id: "family", name: "Family", icon: Users, tint: "lapis" },
] as const;

type ContentType = "all" | "article" | "video" | "book";
type Difficulty = "all" | "beginner" | "intermediate" | "advanced";
type SortBy = "recent" | "popular" | "rating" | "title";

interface LearningPathItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  progress: number;
  totalItems: number;
  completedItems: number;
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  items: Array<{
    id: string;
    title: string;
    type: "video" | "article" | "book";
    duration?: string;
    readingTime?: string;
    completed: boolean;
  }>;
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 40) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const weeks = Math.round(hours / 5);
  return `${weeks} week${weeks !== 1 ? "s" : ""}`;
}

function mapContentType(type: string | null): "video" | "article" | "book" {
  if (type === "video") return "video";
  if (type === "book") return "book";
  return "article";
}

export default function KnowledgePage() {
  const { user } = useSupabaseAuth();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [contentType, setContentType] = useState<ContentType>("all");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([]);
  const [pathCount, setPathCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningPaths();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadLearningPaths() {
    setLoading(true);
    try {
      // Load published paths
      const { data: paths, error } = await (supabase as any)
        .from("learning_paths")
        .select("id, title, description, image_url, difficulty, category, estimated_duration, status")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error || !paths) {
        console.error("Error loading learning paths:", error);
        setLearningPaths([]);
        return;
      }

      // Count total published paths
      const { count } = await (supabase as any)
        .from("learning_paths")
        .select("id", { count: "exact", head: true })
        .eq("status", "published");
      setPathCount(count ?? 0);

      const pathIds = (paths as { id: string }[]).map((p) => p.id);

      // Load lessons for all paths
      const { data: allLessons } = pathIds.length
        ? await (supabase as any)
            .from("learning_path_lessons")
            .select("id, path_id, title, content_type, duration, order_index")
            .in("path_id", pathIds)
            .order("order_index", { ascending: true })
        : { data: [] };

      // Load user's progress for these paths
      const progressMap: Record<string, number> = {};
      if (user && pathIds.length) {
        const { data: progresses } = await (supabase as any)
          .from("learning_path_progress")
          .select("path_id, progress_percentage")
          .eq("user_id", user.id)
          .in("path_id", pathIds);
        (progresses as { path_id: string; progress_percentage: number }[] | null)?.forEach((p) => {
          progressMap[p.path_id] = p.progress_percentage ?? 0;
        });
      }

      // Group lessons by path
      const lessonsByPath: Record<string, any[]> = {};
      (allLessons as any[] | null ?? []).forEach((lesson: any) => {
        if (!lessonsByPath[lesson.path_id]) lessonsByPath[lesson.path_id] = [];
        lessonsByPath[lesson.path_id]!.push(lesson);
      });

      const transformed: LearningPathItem[] = (paths as any[]).map((path) => {
        const lessons = lessonsByPath[path.id] ?? [];
        const progress = progressMap[path.id] ?? 0;
        const totalItems = lessons.length;
        const completedItems = Math.round((progress / 100) * totalItems);
        const difficultyVal = (["beginner", "intermediate", "advanced"].includes(path.difficulty)
          ? path.difficulty
          : "beginner") as "beginner" | "intermediate" | "advanced";

        return {
          id: path.id,
          title: path.title,
          description: path.description ?? "",
          thumbnail: path.image_url ?? null,
          progress,
          totalItems,
          completedItems,
          estimatedTime: formatDuration(path.estimated_duration),
          difficulty: difficultyVal,
          category: path.category ?? "general",
          items: lessons.slice(0, 4).map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            type: mapContentType(lesson.content_type),
            duration: lesson.duration ? `${lesson.duration} min` : undefined,
            completed: lessons.indexOf(lesson) < completedItems,
          })),
        };
      });

      setLearningPaths(transformed);
    } finally {
      setLoading(false);
    }
  }

  const filteredPaths = learningPaths.filter((path) => {
    const matchesSearch =
      path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || path.category === selectedCategory;
    const matchesDifficulty = difficulty === "all" || path.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Al-Hikmah</h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Discover and learn from our curated collection of Islamic knowledge
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search learning paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: BookOpen, label: "Articles", count: "—" },
              { icon: Video, label: "Videos", count: "—" },
              { icon: FileText, label: "Books", count: "—" },
              { icon: Award, label: "Learning Paths", count: loading ? "..." : pathCount },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-lg shadow-md border border-border p-4 text-center"
              >
                <stat.icon className="w-8 h-8 text-accent-strong mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The Qur'an — the heart of the reference hub */}
        <div className="mb-12">
          <Link
            href="/knowledge/quran"
            className="relative block overflow-hidden rounded-lg border border-border bg-card p-8 hover:border-primary-600/50 hover:shadow-lg transition-all group"
          >
            <GirihPattern subtle />
            <TazhibCorner corner="top-end" size={44} />
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <span className="flex-shrink-0 w-16 h-16 rotate-45 rounded craft-tile-teal flex items-center justify-center">
                <BookOpen className="-rotate-45 w-7 h-7 text-accent-strong" />
              </span>
              <span className="flex-1 text-center sm:text-start">
                <span className="block font-display text-2xl font-bold text-foreground group-hover:text-primary-600 transition-colors">
                  The Noble Qur&rsquo;an
                </span>
                <span className="block mt-1 text-foreground-secondary">
                  All 114 surahs — verified Uthmani text (Tanzil Project) with the
                  Saheeh International translation, and a link for every ayah.
                </span>
              </span>
              <span className="text-sm font-medium text-accent-strong">Read →</span>
            </div>
          </Link>
        </div>

        {/* Category Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedCategory("all")}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === "all"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-border hover:border-primary-300 hover:shadow-md"
              }`}
            >
              <div className="w-12 h-12 craft-tile-teal rounded-lg flex items-center justify-center mb-3 mx-auto">
                <LibraryBig className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="text-sm font-medium text-foreground mb-1">All</div>
            </motion.button>
            {CATEGORIES.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index + 1) * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                    : "border-border hover:border-primary-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`w-12 h-12 ${
                    category.tint === "teal" ? "craft-tile-teal" : "craft-tile-lapis"
                  } rounded-lg flex items-center justify-center mb-3 mx-auto`}
                >
                  <category.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="text-sm font-medium text-foreground mb-1">{category.name}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Study Together Banner — hidden when no companions */}
        <StudyTogetherBanner
          companions={[]}
          contentTitle="Islamic Knowledge"
          onFormStudyGroup={() => {}}
        />

        {/* Featured Content — coming soon state */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured Content</h2>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <FilterPanel
              contentType={contentType}
              setContentType={setContentType}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClose={() => setShowFilters(false)}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4 bg-card rounded-lg border border-border"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Library className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Content library is being built</h3>
            <p className="text-foreground-secondary max-w-md mx-auto">
              Our scholars and contributors are curating authentic Islamic articles, videos, and books. Check back soon.
            </p>
          </motion.div>
        </div>

        {/* Learning Paths */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Learning Paths</h2>
            <Button variant="outline" className="flex items-center gap-2">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPaths.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-4 bg-card rounded-lg border border-border"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {searchQuery || selectedCategory !== "all" || difficulty !== "all"
                  ? "No learning paths match your filters"
                  : "No learning paths yet"}
              </h3>
              <p className="text-foreground-secondary max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all" || difficulty !== "all"
                  ? "Try adjusting your search or filters."
                  : "Structured learning paths are being developed. Check back soon."}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPaths.map((path, index) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <LearningPath path={path} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="relative bg-card border border-border rounded-lg p-8 text-center overflow-hidden">
          <GirihPattern />
          <TazhibCorner corner="top-start" size={38} />
          <TazhibCorner corner="bottom-end" size={38} />
          <h3 className="relative font-display text-2xl font-medium text-foreground mb-4">Start your learning journey</h3>
          <p className="relative text-foreground-secondary mb-6 max-w-2xl mx-auto">
            Join thousands of Muslims worldwide who are deepening their understanding of Islam through our curated content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="relative">
              <BookOpen className="w-5 h-5 mr-2" />
              Browse All Content
            </Button>
            <Button size="lg" variant="quiet" className="relative">
              <Award className="w-5 h-5 mr-2" />
              View Learning Paths
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
