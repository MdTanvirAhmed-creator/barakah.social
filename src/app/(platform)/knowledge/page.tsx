"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Award,
  Clock,
  User,
  Star,
  Filter,
  ChevronRight,
  Play,
  Download,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentCard } from "@/components/knowledge/ContentCard";
import { LearningPath } from "@/components/knowledge/LearningPath";
import { FilterPanel } from "@/components/knowledge/FilterPanel";
import { StudyTogetherBanner } from "@/components/knowledge/StudyTogetherBanner";
import { useCompanionData } from "@/hooks/useCompanionData";

// Mock data for demonstration
const CATEGORIES = [
  { id: "quran", name: "Quran", icon: "📖", count: 156, color: "from-emerald-500 to-teal-600" },
  { id: "hadith", name: "Hadith", icon: "📜", count: 89, color: "from-blue-500 to-indigo-600" },
  { id: "fiqh", name: "Fiqh", icon: "⚖️", count: 124, color: "from-purple-500 to-violet-600" },
  { id: "aqeedah", name: "Aqeedah", icon: "🕌", count: 67, color: "from-amber-500 to-orange-600" },
  { id: "seerah", name: "Seerah", icon: "📚", count: 45, color: "from-rose-500 to-pink-600" },
  { id: "spirituality", name: "Spirituality", icon: "🕯️", count: 78, color: "from-indigo-500 to-purple-600" },
  { id: "contemporary", name: "Contemporary", icon: "🌍", count: 92, color: "from-gray-500 to-slate-600" },
  { id: "family", name: "Family", icon: "👨‍👩‍👧‍👦", count: 34, color: "from-green-500 to-emerald-600" },
];

const FEATURED_CONTENT = [
  {
    id: "1",
    type: "video" as const,
    title: "Understanding Surah Al-Fatiha: A Deep Dive",
    author: "Sheikh Ahmad Al-Maliki",
    authorAvatar: null,
    thumbnail: null,
    duration: "45:30",
    difficulty: "beginner" as const,
    rating: 4.8,
    views: 12500,
    category: "quran",
    isSaved: false,
    description: "A comprehensive exploration of the opening chapter of the Quran, covering its meanings, context, and practical applications.",
    companionActivity: {
      studiedBy: 3,
      beneficialMarkedBy: ["Ahmad", "Fatima"],
    },
  },
  {
    id: "2",
    type: "article" as const,
    title: "The Five Pillars of Islam: Complete Guide",
    author: "Dr. Fatima Rahman",
    authorAvatar: null,
    thumbnail: null,
    readingTime: "12 min",
    difficulty: "beginner" as const,
    rating: 4.9,
    views: 8900,
    category: "aqeedah",
    isSaved: true,
    description: "An in-depth explanation of the fundamental practices that form the foundation of Islamic faith.",
    companionActivity: {
      studiedBy: 5,
      beneficialMarkedBy: ["Yusuf", "Aisha", "Omar"],
    },
  },
  {
    id: "3",
    type: "book" as const,
    title: "The Life of Prophet Muhammad (PBUH)",
    author: "Ibn Kathir",
    authorAvatar: null,
    thumbnail: null,
    pages: 1200,
    difficulty: "intermediate" as const,
    rating: 4.7,
    views: 15600,
    category: "seerah",
    isSaved: false,
    description: "The definitive biography of the Prophet Muhammad, covering his life, teachings, and legacy.",
  },
  {
    id: "4",
    type: "video" as const,
    title: "Fiqh of Prayer: Step by Step",
    author: "Sheikh Yusuf Al-Qaradawi",
    authorAvatar: null,
    thumbnail: null,
    duration: "1:25:15",
    difficulty: "intermediate" as const,
    rating: 4.6,
    views: 9800,
    category: "fiqh",
    isSaved: false,
    description: "Detailed explanation of prayer requirements, conditions, and common mistakes to avoid.",
  },
];

const LEARNING_PATHS = [
  {
    id: "1",
    title: "Quran for Beginners",
    description: "Start your journey with the Holy Quran",
    thumbnail: null,
    progress: 65,
    totalItems: 12,
    completedItems: 8,
    estimatedTime: "6 weeks",
    difficulty: "beginner" as const,
    category: "quran",
    items: [
      { id: "1", title: "Introduction to Quran", type: "video" as const, duration: "30 min", completed: true },
      { id: "2", title: "Arabic Alphabet Basics", type: "article" as const, readingTime: "15 min", completed: true },
      { id: "3", title: "Reading Surah Al-Fatiha", type: "video" as const, duration: "45 min", completed: true },
      { id: "4", title: "Understanding Tafsir", type: "article" as const, readingTime: "20 min", completed: false },
    ],
  },
  {
    id: "2",
    title: "Islamic Jurisprudence",
    description: "Master the principles of Fiqh",
    thumbnail: null,
    progress: 30,
    totalItems: 15,
    completedItems: 5,
    estimatedTime: "8 weeks",
    difficulty: "intermediate" as const,
    category: "fiqh",
    items: [
      { id: "1", title: "Introduction to Fiqh", type: "video" as const, duration: "40 min", completed: true },
      { id: "2", title: "Sources of Islamic Law", type: "article" as const, readingTime: "25 min", completed: true },
      { id: "3", title: "The Four Schools of Thought", type: "video" as const, duration: "1:15", completed: false },
    ],
  },
];

type ContentType = "all" | "article" | "video" | "book";
type Difficulty = "all" | "beginner" | "intermediate" | "advanced";
type SortBy = "recent" | "popular" | "rating" | "title";

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [contentType, setContentType] = useState<ContentType>("all");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [savedContent, setSavedContent] = useState<string[]>(["2"]);
  
  // Fetch companion data
  const { stats, pendingConnections } = useCompanionData();
  
  // Mock companions for the banner (for demo purposes - shows companion features)
  const mockStudyingCompanions = [
    {
      id: '1',
      username: 'ahmad_seeker',
      full_name: 'Ahmad Ibn Abdullah',
      avatar_url: undefined,
      interests: ['Quran', 'Hadith'],
      beneficial_count: 45,
      companion_score: 85,
      is_available_for_connections: true,
      connection_capacity: 50,
      last_active: new Date().toISOString(),
      personality_traits: ['patient' as const, 'grateful' as const],
    },
    {
      id: '2',
      username: 'fatima_learner',
      full_name: 'Fatima Al-Zahir',
      avatar_url: undefined,
      interests: ['Fiqh', 'Arabic'],
      beneficial_count: 32,
      companion_score: 78,
      is_available_for_connections: true,
      connection_capacity: 50,
      last_active: new Date().toISOString(),
      personality_traits: ['sincere' as const, 'kind' as const],
    },
    {
      id: '3',
      username: 'yusuf_scholar',
      full_name: 'Yusuf Al-Hakim',
      avatar_url: undefined,
      interests: ['Tafsir', 'History'],
      beneficial_count: 67,
      companion_score: 92,
      is_available_for_connections: true,
      connection_capacity: 50,
      last_active: new Date().toISOString(),
      personality_traits: ['truthful' as const, 'humble' as const],
    },
  ];

  const filteredContent = FEATURED_CONTENT.filter((content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || content.category === selectedCategory;
    const matchesType = contentType === "all" || content.type === contentType;
    const matchesDifficulty = difficulty === "all" || content.difficulty === difficulty;
    
    return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
  });

  const handleSaveContent = (contentId: string) => {
    setSavedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Al-Hikmah
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Discover and learn from our curated collection of Islamic knowledge
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search articles, videos, books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: BookOpen, label: "Articles", count: 456 },
              { icon: Video, label: "Videos", count: 234 },
              { icon: FileText, label: "Books", count: 89 },
              { icon: Award, label: "Learning Paths", count: 12 },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-lg shadow-md border border-border p-4 text-center"
              >
                <stat.icon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Category Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                    : "border-border hover:border-primary-300 hover:shadow-md"
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center text-2xl mb-3 mx-auto`}>
                  {category.icon}
                </div>
                <div className="text-sm font-medium text-foreground mb-1">{category.name}</div>
                <div className="text-xs text-muted-foreground">{category.count} items</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Study Together Banner */}
        {mockStudyingCompanions.length > 0 && (
          <div className="mb-8">
            <StudyTogetherBanner
              companions={mockStudyingCompanions}
              contentTitle="Islamic Knowledge"
              onFormStudyGroup={() => {
                // TODO: Implement study group formation
                alert("Study group formation coming soon!");
              }}
            />
          </div>
        )}

        {/* Featured Content */}
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

          {/* Filters Panel */}
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

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((content, index) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ContentCard
                  content={content}
                  isSaved={savedContent.includes(content.id)}
                  onSave={() => handleSaveContent(content.id)}
                />
              </motion.div>
            ))}
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LEARNING_PATHS.map((path, index) => (
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
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Start Your Learning Journey</h3>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Join thousands of Muslims worldwide who are deepening their understanding of Islam through our curated content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary-600 hover:bg-primary-50"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse All Content
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Award className="w-5 h-5 mr-2" />
              View Learning Paths
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}