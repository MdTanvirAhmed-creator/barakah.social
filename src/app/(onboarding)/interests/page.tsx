"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Star,
  Users,
  Heart,
  DollarSign,
  Baby,
  Activity,
  Lightbulb,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";

// Interest categories with icons
const INTEREST_CATEGORIES = [
  {
    id: "fiqh",
    name: "Fiqh & Jurisprudence",
    description: "Islamic law and practical rulings",
    icon: BookOpen,
    color: "from-primary-500 to-primary-600",
    tags: ["Fiqh", "Islamic Law", "Madhahib"],
  },
  {
    id: "quran",
    name: "Qur'anic Studies",
    description: "Tafsir, recitation, and memorization",
    icon: Star,
    color: "from-secondary-500 to-secondary-600",
    tags: ["Quran", "Tafsir", "Tajweed"],
  },
  {
    id: "hadith",
    name: "Hadith Studies",
    description: "Prophetic traditions and sciences",
    icon: GraduationCap,
    color: "from-info-500 to-info-600",
    tags: ["Hadith", "Sunnah", "Prophetic Guidance"],
  },
  {
    id: "history",
    name: "Islamic History",
    description: "Seerah and historical events",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    tags: ["Seerah", "Islamic History", "Companions"],
  },
  {
    id: "spirituality",
    name: "Spirituality & Dhikr",
    description: "Purification of the heart and soul",
    icon: Heart,
    color: "from-pink-500 to-pink-600",
    tags: ["Spirituality", "Dhikr", "Tasawwuf", "Ihsan"],
  },
  {
    id: "family",
    name: "Family & Parenting",
    description: "Islamic family life and child-rearing",
    icon: Baby,
    color: "from-green-500 to-green-600",
    tags: ["Parenting", "Marriage", "Family"],
  },
  {
    id: "finance",
    name: "Halal Finance",
    description: "Islamic economics and business",
    icon: DollarSign,
    color: "from-yellow-500 to-yellow-600",
    tags: ["Islamic Finance", "Halal Investment", "Business Ethics"],
  },
  {
    id: "convert",
    name: "Convert/Revert Support",
    description: "Guidance for new Muslims",
    icon: Lightbulb,
    color: "from-orange-500 to-orange-600",
    tags: ["New Muslims", "Basics", "Support"],
  },
  {
    id: "wellness",
    name: "Health & Wellness",
    description: "Physical and mental well-being",
    icon: Activity,
    color: "from-teal-500 to-teal-600",
    tags: ["Health", "Wellness", "Islamic Medicine"],
  },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError } = useToast();

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = async () => {
    if (selectedCategories.length < 3) {
      showError("Please select at least 3 interest categories");
      return;
    }

    try {
      setIsLoading(true);

      // Get all tags from selected categories
      const allTags = selectedCategories.flatMap(
        (catId) =>
          INTEREST_CATEGORIES.find((cat) => cat.id === catId)?.tags || []
      );

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Update user profile with interests
      const { error } = await supabase
        .from("profiles")
        .update({
          interests: allTags,
        })
        .eq("id", user.id);

      if (error) throw error;

      success("Interests saved!");
      
      // Navigate to next step
      setTimeout(() => {
        router.push("/onboarding/suggested-halaqas");
      }, 500);
    } catch (err) {
      console.error("Error saving interests:", err);
      showError(
        err instanceof Error ? err.message : "Failed to save interests"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/welcome");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl w-full"
      >
        <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              What interests you?
            </h1>
            <p className="text-foreground-secondary text-lg">
              Select at least 3 categories to personalize your experience
            </p>

            {/* Selection Counter */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-medium">
                <Check className="w-4 h-4 text-primary-600" />
                {selectedCategories.length} of {INTEREST_CATEGORIES.length}{" "}
                selected {selectedCategories.length >= 3 && "✓"}
              </span>
            </div>
          </div>

          {/* Interest Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {INTEREST_CATEGORIES.map((category, index) => {
              const isSelected = selectedCategories.includes(category.id);
              const Icon = category.icon;

              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleCategory(category.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                      : "border-border bg-background hover:border-primary-300 hover:bg-muted/50"
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3
                    className={`font-semibold mb-2 ${
                      isSelected ? "text-primary-700" : "text-foreground"
                    }`}
                  >
                    {category.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {category.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {category.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-1 rounded-full ${
                          isSelected
                            ? "bg-primary-100 text-primary-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleContinue}
              disabled={selectedCategories.length < 3 || isLoading}
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-primary"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Helper Text */}
          {selectedCategories.length > 0 && selectedCategories.length < 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground mt-4"
            >
              Select {3 - selectedCategories.length} more to continue
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

