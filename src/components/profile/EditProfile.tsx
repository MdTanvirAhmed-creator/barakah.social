"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Camera,
  BookOpen,
  Tag,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { uploadAvatar } from "@/lib/supabase/storage";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  madhab_preference: string | null;
  interests: string[];
}

interface EditProfileProps {
  profile: Profile;
  onClose: () => void;
  onSave: (updatedProfile: Partial<Profile>) => void;
}

const PROFILE_SCHEMA = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(300, "Bio must be 300 characters or less"),
  madhab_preference: z.string().optional(),
});

type ProfileFormData = z.infer<typeof PROFILE_SCHEMA>;

const MADHABS = [
  { value: "", label: "Not specified" },
  { value: "hanafi", label: "Hanafi" },
  { value: "shafi", label: "Shafi'i" },
  { value: "maliki", label: "Maliki" },
  { value: "hanbali", label: "Hanbali" },
  { value: "jafari", label: "Ja'fari" },
];

const AVAILABLE_INTERESTS = [
  "Quran", "Hadith", "Fiqh", "Aqeedah", "Seerah", "Arabic",
  "Tafsir", "Spirituality", "Family", "Finance", "Science", "History",
];

export function EditProfile({ profile, onClose, onSave }: EditProfileProps) {
  const { error: showError } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(PROFILE_SCHEMA),
    defaultValues: {
      full_name: profile.full_name,
      bio: profile.bio,
      madhab_preference: profile.madhab_preference || "",
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image must be under 5 MB");
      return;
    }

    setPendingAvatarFile(file);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 10) return prev;
      return [...prev, interest];
    });
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      let finalAvatarUrl = profile.avatar_url;

      // Upload avatar if user picked a new one
      if (pendingAvatarFile) {
        setIsUploadingAvatar(true);
        const { data: uploadData, error: uploadError } = await uploadAvatar(pendingAvatarFile);
        setIsUploadingAvatar(false);

        if (uploadError || !uploadData) {
          showError("Failed to upload avatar. Please try again.");
          return;
        }
        finalAvatarUrl = uploadData.publicUrl;
      }

      await onSave({
        full_name: data.full_name,
        bio: data.bio,
        avatar_url: finalAvatarUrl,
        interests: selectedInterests,
        madhab_preference: data.madhab_preference || null,
      });
    } catch {
      showError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isBusy = isSaving || isUploadingAvatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
            <p className="text-sm text-muted-foreground">Update your information</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Avatar */}
            <div>
              <Label>Profile Picture</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl">
                      {getInitials(form.watch("full_name") || profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isBusy}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Click the camera icon to upload</p>
                  <p>JPEG, PNG, WebP or GIF · Max 5 MB</p>
                  {pendingAvatarFile && (
                    <p className="text-primary-600 mt-1">New image selected — will upload on save</p>
                  )}
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                {...form.register("full_name")}
                placeholder="Your full name"
                className="mt-2"
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                {...form.register("bio")}
                placeholder="Tell the community about yourself..."
                className="w-full mt-2 p-3 bg-background border border-border rounded-lg text-sm resize-none min-h-[100px]"
                maxLength={300}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Share your Islamic journey and goals</span>
                <span>{300 - (form.watch("bio")?.length || 0)} characters left</span>
              </div>
              {form.formState.errors.bio && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.bio.message}</p>
              )}
            </div>

            {/* Madhab */}
            <div>
              <Label htmlFor="madhab_preference" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Madhab Preference
              </Label>
              <select
                id="madhab_preference"
                {...form.register("madhab_preference")}
                className="w-full mt-2 p-2 bg-background border border-border rounded-lg text-sm"
              >
                {MADHABS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Interests */}
            <div>
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Interests (Max 10)
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedInterests.includes(interest)
                        ? "bg-primary-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{selectedInterests.length}/10 selected</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-border bg-muted/50">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isBusy}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploadingAvatar ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
