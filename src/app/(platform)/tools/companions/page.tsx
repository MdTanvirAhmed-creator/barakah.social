"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  UserPlus,
  Star,
  BookOpen,
  MessageCircle,
  Sparkles,
  Award,
  TrendingUp,
  Heart,
  MapPin,
  Calendar,
  GraduationCap,
  Network,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompanionData } from "@/hooks/useCompanionData";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";

// Mock data for daily suggestions
const DAILY_SUGGESTIONS = [
  {
    id: '1',
    username: 'ahmad_seeker',
    full_name: 'Ahmad Ibn Abdullah',
    bio: 'Seeking knowledge and righteous companions. Currently studying Tafsir and Hadith.',
    avatar_url: null,
    interests: ['Quran', 'Hadith', 'Tafsir'],
    beneficial_count: 145,
    companion_score: 92,
    is_available_for_connections: true,
    location: 'London, UK',
    life_stage: 'Student',
    personality_traits: ['patient', 'grateful'],
    match_reason: 'High compatibility based on shared interests',
  },
  {
    id: '2',
    username: 'fatima_scholar',
    full_name: 'Fatima Al-Zahir',
    bio: 'Passionate about Islamic history and spirituality. Looking for study partners for Arabic.',
    avatar_url: null,
    interests: ['History', 'Arabic', 'Spirituality'],
    beneficial_count: 98,
    companion_score: 88,
    is_available_for_connections: true,
    location: 'Toronto, Canada',
    life_stage: 'Professional',
    personality_traits: ['sincere', 'kind'],
    match_reason: 'Similar activity patterns and interests',
  },
  {
    id: '3',
    username: 'yusuf_teacher',
    full_name: 'Yusuf Al-Hakim',
    bio: 'Teacher of Islamic studies. Available for mentorship in Fiqh and Aqeedah.',
    avatar_url: null,
    interests: ['Fiqh', 'Aqeedah', 'Education'],
    beneficial_count: 234,
    companion_score: 95,
    is_available_for_connections: true,
    location: 'Dubai, UAE',
    life_stage: 'Professional',
    personality_traits: ['truthful', 'humble'],
    match_reason: 'Excellent mentor match for your learning goals',
    isMentor: true,
  },
];

const FILTER_OPTIONS = {
  knowledgeLevel: ['Beginner', 'Intermediate', 'Advanced', 'Any'],
  interests: ['Quran', 'Hadith', 'Fiqh', 'Aqeedah', 'History', 'Arabic', 'Spirituality'],
  availability: ['Available', 'Busy', 'Any'],
  lifeStage: ['Student', 'Professional', 'Parent', 'Seeker', 'Any'],
};

export default function CompanionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'mentors' | 'study-buddies' | 'tree'>('suggestions');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<any>(null);
  const [showSalamModal, setShowSalamModal] = useState(false);
  
  const { stats } = useCompanionData();
  const { success } = useToast();
  const supabase = createClient();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleConnect = async (userId: string, userName: string) => {
    setSendingTo(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('companion_connections')
        .insert({
          requester_id: user.id,
          recipient_id: userId,
          status: 'pending',
          message: `Assalamu alaikum ${userName}! I came across your profile in the Companion Finder and would love to connect. May Allah bless our companionship! 🤝`
        });

      if (error) throw error;

      success(`Connection request sent to ${userName}!`);
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tools">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Companion Finder</h1>
              <p className="text-foreground-secondary">
                Find righteous companions for your spiritual journey
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-card rounded-lg shadow-md border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-muted-foreground">Your Companions</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats?.total_connections || 0}</div>
            </div>
            <div className="bg-card rounded-lg shadow-md border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-warning" />
                <span className="text-sm text-muted-foreground">Daily Matches</span>
              </div>
              <div className="text-2xl font-bold text-foreground">5</div>
            </div>
            <div className="bg-card rounded-lg shadow-md border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-error" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats?.pending_requests || 0}</div>
            </div>
            <div className="bg-card rounded-lg shadow-md border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Compatibility</span>
              </div>
              <div className="text-2xl font-bold text-foreground">85%</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by name, interests, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 bg-card rounded-lg shadow-md border border-border p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Knowledge Level
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    {FILTER_OPTIONS.knowledgeLevel.map(level => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Interests
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    {FILTER_OPTIONS.interests.map(interest => (
                      <option key={interest}>{interest}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Availability
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    {FILTER_OPTIONS.availability.map(avail => (
                      <option key={avail}>{avail}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Life Stage
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    {FILTER_OPTIONS.lifeStage.map(stage => (
                      <option key={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border">
            {[
              { id: 'suggestions', label: 'Daily Suggestions', icon: Sparkles },
              { id: 'mentors', label: 'Find Mentors', icon: GraduationCap },
              { id: 'study-buddies', label: 'Study Buddies', icon: BookOpen },
              { id: 'tree', label: 'Your Tree', icon: Network },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'suggestions' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Today&apos;s Matches</h2>
              <p className="text-sm text-muted-foreground">
                Curated companions based on your interests and goals • Refreshes daily
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DAILY_SUGGESTIONS.map((companion, index) => (
                <motion.div
                  key={companion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CompanionWidget
                    companion={companion}
                    variant="default"
                    sharedInterests={companion.interests}
                    compatibilityScore={companion.companion_score}
                    connectionStatus="none"
                    showActions={true}
                    onSendSalam={() => {
                      setSelectedCompanion(companion);
                      setShowSalamModal(true);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mentors' && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Find Your Mentor</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect with experienced scholars and teachers who can guide your Islamic learning journey
            </p>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Search className="w-4 h-4 mr-2" />
              Search Mentors
            </Button>
          </div>
        )}

        {activeTab === 'study-buddies' && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Find Study Buddies</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Find companions to study specific topics together, memorize Quran, or complete learning paths
            </p>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Users className="w-4 h-4 mr-2" />
              Browse Study Partners
            </Button>
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="text-center py-12">
            <Network className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Your Companion Tree</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Visualize your network of companions, study partners, and mentors
            </p>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Network className="w-4 h-4 mr-2" />
              View Your Tree
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            &quot;The best of companions are those who remind you of Allah&quot;
          </h3>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Build meaningful connections with righteous companions who will support your spiritual growth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary-600 hover:bg-primary-50"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              View More Suggestions
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Award className="w-5 h-5 mr-2" />
              Become a Mentor
            </Button>
          </div>
        </div>
      </div>

      {/* Salam Modal */}
      {selectedCompanion && (
        <SalamModal
          isOpen={showSalamModal}
          onClose={() => setShowSalamModal(false)}
          companion={selectedCompanion}
          matchReason={selectedCompanion.match_reason}
          sharedInterests={selectedCompanion.interests}
          compatibilityScore={selectedCompanion.companion_score}
          onSuccess={() => {
            success(`Connection request sent to ${selectedCompanion.full_name}!`);
            setShowSalamModal(false);
          }}
        />
      )}
    </div>
  );
}

