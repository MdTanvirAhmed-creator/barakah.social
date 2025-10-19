"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EditProfile } from "@/components/profile/EditProfile";
import { BookmarksList } from "@/components/profile/BookmarksList";
import Link from "next/link";
import { Users } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  interests: string[];
  madhab_preference?: string;
  beneficial_count: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'companions' | 'bookmarks'>('about');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error("Error loading profile:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Try to create a profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            bio: '',
            avatar_url: user.user_metadata?.avatar_url,
            interests: []
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          // Set a temporary profile
          setProfile({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || 'User',
            bio: '',
            avatar_url: user.user_metadata?.avatar_url,
            interests: [],
            beneficial_count: 0
          });
        } else {
          setProfile(newProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: Partial<Profile>) => {
    try {
      if (!profile?.id) {
        alert("Profile ID not found");
        return;
      }

      // Only update fields that are part of the profiles table
      const updateData: any = {};
      if (updatedProfile.full_name !== undefined) updateData.full_name = updatedProfile.full_name;
      if (updatedProfile.bio !== undefined) updateData.bio = updatedProfile.bio;
      if (updatedProfile.avatar_url !== undefined) updateData.avatar_url = updatedProfile.avatar_url;
      if (updatedProfile.madhab_preference !== undefined) updateData.madhab_preference = updatedProfile.madhab_preference;
      if (updatedProfile.interests !== undefined) updateData.interests = updatedProfile.interests;

      console.log("Updating profile with data:", updateData);

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }

      console.log("Profile updated successfully:", data);
      
      // Update local state with the new data
      setProfile(data as Profile);
      setShowEditModal(false);
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
      throw error; // Re-throw to let EditProfile handle it
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
            <p className="text-foreground-secondary">
              Manage your account and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-700 relative">
              <div className="pattern-islamic absolute inset-0 opacity-10" />
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 mb-6">
                <Avatar className="h-32 w-32 border-4 border-card shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-3xl">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile?.full_name}
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    @{profile?.username}
                  </p>
                  {profile?.madhab_preference && (
                    <span className="text-sm bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 px-3 py-1 rounded-full">
                      {profile.madhab_preference.charAt(0).toUpperCase() +
                        profile.madhab_preference.slice(1)}{" "}
                      Madhab
                    </span>
                  )}
                </div>

                <Button variant="outline" onClick={() => setShowEditModal(true)}>Edit Profile</Button>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div className="mb-6">
                  <p className="text-foreground-secondary">{profile.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">
                    {profile?.beneficial_count || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Beneficial</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Halaqas</p>
                </div>
              </div>

              {/* Interests */}
              {profile?.interests && profile.interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest: string) => (
                      <span
                        key={interest}
                        className="text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-3 py-1 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'about', label: 'About' },
                  { id: 'posts', label: 'Posts' },
                  { id: 'companions', label: 'My Companions', icon: Users },
                  { id: 'bookmarks', label: 'Bookmarks' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    {tab.icon && <tab.icon className="w-4 h-4" />}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">About</h3>
                    <p className="text-muted-foreground">
                      {profile.bio || "No bio added yet."}
                    </p>
                  </div>
                  
                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest: string) => (
                          <span
                            key={interest}
                            className="text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-3 py-1 rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Posts</h3>
                  <p className="text-muted-foreground">No posts yet. Create your first post in the feed!</p>
                </div>
              )}

              {activeTab === 'companions' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">My Companions</h3>
                      <p className="text-sm text-muted-foreground">
                        Your righteous companions on the journey of faith
                      </p>
                    </div>
                    <Link href="/profile/companions">
                      <Button>
                        <Users className="w-4 h-4 mr-2" />
                        View Full Network
                      </Button>
                    </Link>
                  </div>
                  <div className="p-8 bg-muted/30 rounded-lg border-2 border-dashed border-border text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      View your companion network, manage connections, and see interaction stats
                    </p>
                    <Link href="/profile/companions">
                      <Button variant="outline">Go to Companions Page</Button>
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <BookmarksList />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfile
          profile={{
            ...profile,
            bio: profile.bio || "",
            avatar_url: profile.avatar_url || null,
            madhab_preference: profile.madhab_preference || null,
            cover_url: null,
            location: ""
          } as any}
          onSave={handleSaveProfile as any}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

