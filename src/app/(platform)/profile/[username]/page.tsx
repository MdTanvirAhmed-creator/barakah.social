"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Edit,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  Settings,
  Check,
  Users,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/PostCard";
import { BookmarksList } from "@/components/profile/BookmarksList";
import { EditProfile } from "@/components/profile/EditProfile";
import { formatRelativeTime } from "@/lib/date";

// Mock profile data
const MOCK_PROFILE = {
  id: "current-user",
  username: "ahmad_student",
  full_name: "Ahmad Mohammed",
  bio: "Seeking knowledge and spreading beneficial information. Student of Islamic sciences and lover of the Quran. May Allah guide us all to the straight path.",
  avatar_url: null,
  cover_url: null,
  location: "New York, USA",
  joined_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  is_verified_scholar: false,
  madhab_preference: "hanafi",
  interests: ["Quran", "Hadith", "Fiqh", "Seerah", "Arabic"],
  stats: {
    posts: 45,
    beneficial_received: 892,
    halaqas: 5,
    following: 123,
    followers: 89,
  },
};

const MOCK_POSTS = [
  {
    id: "1",
    author: {
      id: "current-user",
      username: "ahmad_student",
      full_name: "Ahmad Mohammed",
      avatar_url: undefined,
      is_verified_scholar: false,
    },
    content: "SubhanAllah! Just finished reading Surah Al-Kahf. The story of the People of the Cave is such a powerful reminder of faith and patience. May Allah strengthen our Iman. 🤲",
    tags: ["Quran", "Reflection", "JummahMubarak"],
    beneficial_count: 45,
    comment_count: 12,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_beneficial: false,
    is_bookmarked: false,
  },
];

type TabType = "posts" | "about" | "bookmarks";

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const isOwnProfile = true; // In production, check currentUser === profile.id

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const madhabs = {
    hanafi: "Hanafi",
    shafi: "Shafi'i",
    maliki: "Maliki",
    hanbali: "Hanbali",
    jafari: "Ja'fari",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 relative">
        {profile.cover_url ? (
          <Image
            src={profile.cover_url}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-black/10" />
        )}
      </div>

      <div className="container-custom">
        {/* Profile Header */}
        <div className="relative -mt-20 md:-mt-24 mb-6">
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-xl">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-4xl">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {profile.full_name}
                      </h1>
                      {profile.is_verified_scholar && (
                        <Check className="w-6 h-6 text-primary-500 fill-primary-500" />
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">@{profile.username}</p>
                    <p className="text-foreground-secondary leading-relaxed max-w-2xl">
                      {profile.bio}
                    </p>
                  </div>

                  {isOwnProfile && (
                    <Button
                      onClick={() => setShowEditModal(true)}
                      className="mt-4 md:mt-0"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatRelativeTime(profile.joined_at)}</span>
                  </div>
                  {profile.madhab_preference && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{madhabs[profile.madhab_preference as keyof typeof madhabs]} Madhab</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{profile.stats.posts}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{profile.stats.beneficial_received}</div>
                    <div className="text-sm text-muted-foreground">Beneficial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{profile.stats.halaqas}</div>
                    <div className="text-sm text-muted-foreground">Halaqas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{profile.stats.followers}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{profile.stats.following}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
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
                { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
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
                      layoutId="activeTab"
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
          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div className="space-y-4">
              {MOCK_POSTS.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  <p className="text-foreground-secondary mt-1">{profile.bio}</p>
                </div>

                {profile.madhab_preference && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Madhab</label>
                    <p className="text-foreground-secondary mt-1">
                      {madhabs[profile.madhab_preference as keyof typeof madhabs]}
                    </p>
                  </div>
                )}

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

                {profile.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-foreground-secondary mt-1">{profile.location}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-foreground-secondary mt-1">
                    {new Date(profile.joined_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === "bookmarks" && isOwnProfile && <BookmarksList />}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfile
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedProfile) => {
            setProfile({ ...profile, ...updatedProfile } as typeof profile);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
