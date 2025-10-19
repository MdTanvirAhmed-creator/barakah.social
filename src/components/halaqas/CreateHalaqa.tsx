"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  X,
  Upload,
  Globe,
  Lock,
  Users,
  BookOpen,
  Loader2,
  Image as ImageIcon,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClient } from "@/lib/supabase/client";

const createHalaqaSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name is too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description is too long"),
  category: z
    .string()
    .min(1, "Please select a category"),
  max_members: z
    .number()
    .min(5, "Minimum 5 members")
    .max(500, "Maximum 500 members"),
  is_public: z.boolean(),
  rules: z
    .array(z.string())
    .min(1, "At least one rule is required")
    .max(10, "Maximum 10 rules allowed"),
  enable_companion_discovery: z.boolean(),
});

type CreateHalaqaForm = z.infer<typeof createHalaqaSchema>;

interface CreateHalaqaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Quran",
  "Hadith",
  "Fiqh",
  "History",
  "Spirituality",
  "Contemporary",
  "Family",
  "Finance",
];

const CATEGORY_COLORS = {
  Quran: "from-emerald-500 to-teal-600",
  Hadith: "from-blue-500 to-indigo-600",
  Fiqh: "from-purple-500 to-violet-600",
  History: "from-amber-500 to-orange-600",
  Spirituality: "from-pink-500 to-rose-600",
  Contemporary: "from-gray-500 to-slate-600",
  Family: "from-green-500 to-emerald-600",
  Finance: "from-yellow-500 to-amber-600",
};

const CATEGORY_ICONS = {
  Quran: "📖",
  Hadith: "📜",
  Fiqh: "⚖️",
  History: "📚",
  Spirituality: "🕯️",
  Contemporary: "🌍",
  Family: "👨‍👩‍👧‍👦",
  Finance: "💰",
};

export function CreateHalaqa({ isOpen, onClose, onSuccess }: CreateHalaqaProps) {
  const { success, error: showError } = useToast();
  const { user } = useSupabaseAuth();
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [newRule, setNewRule] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateHalaqaForm>({
    resolver: zodResolver(createHalaqaSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      max_members: 50,
      is_public: true,
      rules: [],
      enable_companion_discovery: true,
    },
  });

  const selectedCategory = watch("category");
  const isPublic = watch("is_public");
  const rules = watch("rules");
  const enableCompanionDiscovery = watch("enable_companion_discovery");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("Image size must be less than 5MB");
        return;
      }
      
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addRule = () => {
    if (newRule.trim() && rules.length < 10) {
      setValue("rules", [...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setValue("rules", rules.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateHalaqaForm) => {
    if (!user) {
      showError("You must be logged in to create a Halaqa");
      return;
    }

    setIsCreating(true);
    
    try {
      // Save to database
      const { data: halaqaData, error } = await supabase
        .from('halaqas')
        .insert({
          name: data.name,
          description: data.description,
          category: data.category,
          rules: data.rules.join('\n'), // Convert array to text with newlines
          member_count: 1, // Creator is the first member
          is_public: data.is_public,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating Halaqa:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        showError(`Failed to create Halaqa: ${error.message || "Please try again."}`);
        return;
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('halaqa_members')
        .insert({
          halaqa_id: halaqaData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error("Error adding member:", memberError);
        console.error("Error details:", JSON.stringify(memberError, null, 2));
        success("Halaqa created! (Note: Member addition had an issue, but you can still join manually)");
        onSuccess();
        handleClose();
        return;
      }
      
      success("Halaqa created successfully!");
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error:", err);
      showError("Failed to create Halaqa. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    reset();
    setCoverImage(null);
    setCoverPreview(null);
    setNewRule("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-lg shadow-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground">Create New Halaqa</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Cover Image Preview */}
            {coverPreview && (
              <div className="relative">
                <div className={`h-32 rounded-lg overflow-hidden bg-gradient-to-br ${
                  selectedCategory ? CATEGORY_COLORS[selectedCategory as keyof typeof CATEGORY_COLORS] : "from-gray-500 to-slate-600"
                }`}>
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Halaqa Name *
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g., Quran Study Circle"
                  className={errors.name ? "border-error" : ""}
                />
                {errors.name && (
                  <p className="text-error text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <Textarea
                  {...register("description")}
                  placeholder="Describe your Halaqa's purpose and what members can expect..."
                  rows={4}
                  className={errors.description ? "border-error" : ""}
                />
                {errors.description && (
                  <p className="text-error text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setValue("category", category)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                            : "border-border hover:border-primary-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">
                          {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
                        </div>
                        <div className="text-sm font-medium">{category}</div>
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <p className="text-error text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Max Members */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Maximum Members
                </label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    {...register("max_members", { valueAsNumber: true })}
                    min={5}
                    max={500}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">members</span>
                </div>
                {errors.max_members && (
                  <p className="text-error text-sm mt-1">{errors.max_members.message}</p>
                )}
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Privacy Setting
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setValue("is_public", true)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all flex-1 ${
                      isPublic
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                        : "border-border hover:border-primary-300"
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">
                        Anyone can discover and join
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("is_public", false)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all flex-1 ${
                      !isPublic
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                        : "border-border hover:border-primary-300"
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">
                        Invite only
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Companion Discovery */}
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 rounded-lg border-2 border-primary-200 dark:border-primary-800 p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("enable_companion_discovery", !enableCompanionDiscovery)}
                    className={`mt-1 w-11 h-6 rounded-full transition-colors relative ${
                      enableCompanionDiscovery
                        ? "bg-primary-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        enableCompanionDiscovery ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                      <span className="font-semibold text-foreground">
                        Find Companions Interested in {selectedCategory || "This Topic"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Auto-suggest this Halaqa to users seeking knowledge in this area and help members discover study companions with similar interests.
                    </p>
                    {enableCompanionDiscovery && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-success">
                        <UserPlus className="w-4 h-4" />
                        <span>Members will see companion suggestions within this Halaqa</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cover Image (Optional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </div>
                  </label>
                </div>
              </div>

              {/* Rules */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Halaqa Rules *
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      placeholder="Add a rule..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRule();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addRule}
                      disabled={!newRule.trim() || rules.length >= 10}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {rules.length > 0 && (
                    <div className="space-y-2">
                      {rules.map((rule, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm">{rule}</span>
                          <button
                            type="button"
                            onClick={() => removeRule(index)}
                            className="p-1 hover:bg-background rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.rules && (
                  <p className="text-error text-sm mt-1">{errors.rules.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-primary-600 hover:bg-primary-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create Halaqa
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
