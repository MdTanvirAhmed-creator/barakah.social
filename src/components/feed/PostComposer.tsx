"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  BarChart3,
  Tag,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { uploadPostImage } from "@/lib/supabase/storage";

const MAX_CONTENT_LENGTH = 2000;
const MAX_IMAGES = 4;

const SUGGESTED_TAGS = [
  "Quran", "Hadith", "Fiqh", "Tafsir", "Seerah",
  "Aqeedah", "Dhikr", "Dua", "Islamic History", "Contemporary Issues",
];

interface PostComposerProps {
  onPostCreated?: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { profile, user } = useSupabaseAuth();
  const { success, error: showError } = useToast();
  const supabase = createClient();

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addBismillah, setAddBismillah] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);

  // Image state
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - imagePreviews.length;
    const toProcess = files.slice(0, remaining);

    for (const file of toProcess) {
      if (file.size > 10 * 1024 * 1024) {
        showError(`${file.name} is too large — max 10 MB`);
        continue;
      }

      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      setIsUploadingImage(true);
      const { data, error } = await uploadPostImage(file);
      setIsUploadingImage(false);

      if (error || !data) {
        showError("Failed to upload image. Please try again.");
        setImagePreviews((prev) => prev.slice(0, -1)); // remove the pending preview
        continue;
      }

      setImageUrls((prev) => [...prev, data.publicUrl]);
    }

    // Reset input so same file can be re-selected if needed
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim()) {
      showError("Please write something to share");
      return;
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      showError(`Content is too long (max ${MAX_CONTENT_LENGTH} characters)`);
      return;
    }
    if (!user) {
      showError("You must be logged in to post");
      return;
    }
    if (isUploadingImage) {
      showError("Please wait for image upload to finish");
      return;
    }

    setIsPosting(true);
    try {
      const finalContent = addBismillah
        ? `بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ\n\n${content}`
        : content;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("posts")
        .insert({
          author_id: user.id,
          content: finalContent,
          post_type: "standard",
          tags: selectedTags,
          media_urls: imageUrls,
          beneficial_count: 0,
        });

      if (error) {
        showError(`Failed to share post: ${error.message || "Please try again."}`);
        return;
      }

      success("Post shared successfully!");
      setContent("");
      setSelectedTags([]);
      setAddBismillah(false);
      setIsExpanded(false);
      setShowTagSelector(false);
      setImagePreviews([]);
      setImageUrls([]);
      onPostCreated?.();
    } catch {
      showError("Failed to share post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const charactersRemaining = MAX_CONTENT_LENGTH - content.length;
  const isNearLimit = charactersRemaining < 100;
  const isOverLimit = charactersRemaining < 0;

  return (
    <div className="bg-card rounded-lg shadow-md border border-border p-4 md:p-6 w-full">
      <div className="flex gap-3 w-full">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary-100 text-primary-700">
            {getInitials(profile?.full_name || undefined)}
          </AvatarFallback>
        </Avatar>

        {/* Input Area */}
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={handleExpand}
              className="w-full text-left px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-muted-foreground"
            >
              Share beneficial knowledge...
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share beneficial knowledge..."
                className="min-h-[120px] resize-none"
                disabled={isPosting}
              />

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className={`grid gap-2 ${imagePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {/* uploading indicator for last image if still uploading */}
                      {isUploadingImage && i === imagePreviews.length - 1 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        disabled={isPosting}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Character Counter */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {addBismillah && (
                    <span className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full">
                      ✓ Bismillah prefix
                    </span>
                  )}
                  {selectedTags.length > 0 && (
                    <span className="text-xs bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 px-2 py-1 rounded-full">
                      {selectedTags.length} tag{selectedTags.length !== 1 && "s"}
                    </span>
                  )}
                </div>
                <span
                  className={
                    isOverLimit
                      ? "text-destructive font-semibold"
                      : isNearLimit
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground"
                  }
                >
                  {charactersRemaining.toLocaleString()}
                </span>
              </div>

              {/* Options Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Image Upload */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isPosting || imagePreviews.length >= MAX_IMAGES}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    title={imagePreviews.length >= MAX_IMAGES ? `Max ${MAX_IMAGES} images` : "Add image"}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  {/* Poll — coming soon */}
                  <button
                    type="button"
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title="Create poll (coming soon)"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>

                  {/* Tags */}
                  <button
                    type="button"
                    onClick={() => setShowTagSelector(!showTagSelector)}
                    className={`p-2 hover:bg-muted rounded-lg transition-colors ${
                      showTagSelector || selectedTags.length > 0
                        ? "text-primary-600"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Add tags"
                  >
                    <Tag className="w-5 h-5" />
                  </button>

                  {/* Bismillah Toggle */}
                  <button
                    type="button"
                    onClick={() => setAddBismillah(!addBismillah)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      addBismillah
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    title="Add Bismillah prefix"
                  >
                    <span className="font-arabic">بسم الله</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent("");
                      setSelectedTags([]);
                      setShowTagSelector(false);
                      setAddBismillah(false);
                      setImagePreviews([]);
                      setImageUrls([]);
                    }}
                    disabled={isPosting}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handlePost}
                    disabled={!content.trim() || isOverLimit || isPosting || isUploadingImage}
                    size="sm"
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Tag Selector */}
              <AnimatePresence>
                {showTagSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Add tags (max 5)</p>
                        <button onClick={() => setShowTagSelector(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              disabled={!isSelected && selectedTags.length >= 5}
                              className={`px-3 py-1 rounded-full text-sm transition-all ${
                                isSelected
                                  ? "bg-primary-600 text-white"
                                  : "bg-background text-foreground hover:bg-background/80 border border-border"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && !showTagSelector && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="hover:bg-primary-100 dark:hover:bg-primary-800/40 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
