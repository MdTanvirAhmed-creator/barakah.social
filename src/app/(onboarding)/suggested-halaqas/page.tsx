"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  BookOpen,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface Halaqa {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  created_by: string;
}

// Mock recommended halaqas (in production, fetch from API based on user interests)
const RECOMMENDED_HALAQAS: Halaqa[] = [
  {
    id: "1",
    name: "Daily Quran Reflection",
    description:
      "Join us for daily Quran reflection and tafsir discussions. We focus on understanding and implementing Quranic teachings in our daily lives.",
    category: "Quran",
    member_count: 1247,
    created_by: "scholar_1",
  },
  {
    id: "2",
    name: "Fiqh of Daily Life",
    description:
      "Practical fiqh discussions on everyday matters. Learn the rulings for prayer, fasting, transactions, and more from multiple madhabs.",
    category: "Fiqh",
    member_count: 892,
    created_by: "scholar_2",
  },
  {
    id: "3",
    name: "Sahih Hadith Study",
    description:
      "Weekly deep dive into authentic hadiths from Sahih Bukhari and Muslim. Understanding the Prophet's ﷺ guidance in modern context.",
    category: "Hadith",
    member_count: 1543,
    created_by: "scholar_3",
  },
  {
    id: "4",
    name: "New Muslim Journey",
    description:
      "A supportive space for new Muslims and reverts. Learn the basics, ask questions, and connect with others on the same path.",
    category: "Basics",
    member_count: 654,
    created_by: "mentor_1",
  },
  {
    id: "5",
    name: "Islamic Parenting Circle",
    description:
      "Raising children with Islamic values in modern times. Share experiences, get advice, and support fellow Muslim parents.",
    category: "Family",
    member_count: 428,
    created_by: "parent_1",
  },
  {
    id: "6",
    name: "Spiritual Growth & Dhikr",
    description:
      "Focus on purifying the heart, regular dhikr practices, and strengthening connection with Allah. A space for spiritual development.",
    category: "Spirituality",
    member_count: 967,
    created_by: "sheikh_1",
  },
];

export default function HalaqasPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [joinedHalaqas, setJoinedHalaqas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const { success, error: showError } = useToast();

  const toggleHalaqa = (halaqaId: string) => {
    setJoinedHalaqas((prev) =>
      prev.includes(halaqaId)
        ? prev.filter((id) => id !== halaqaId)
        : [...prev, halaqaId]
    );
  };

  const handleFinish = async () => {
    try {
      setIsLoading(true);

      if (joinedHalaqas.length > 0) {
        // In production, you would save joined halaqas to database
        // const supabase = createClient();
        // await supabase.from('halaqa_members').insert(...)
        success(`Joined ${joinedHalaqas.length} Halaqas!`);
      }

      // Mark onboarding as complete
      const supabase = createClient();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            updated_at: new Date().toISOString(),
            // You could add an 'onboarding_completed' field here
          })
          .eq("id", user.id);
      }

      // Navigate to dashboard
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Error completing onboarding:", err);
      showError("Something went wrong. Redirecting to dashboard...");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    // Small delay for UX
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  const handleBack = () => {
    router.push("/onboarding/interests");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl w-full"
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
              <Users className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Join Your First Halaqas
            </h1>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Based on your interests, we recommend these study circles. Join as
              many as you like!
            </p>

            {/* Selection Counter */}
            {joinedHalaqas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  {joinedHalaqas.length} Halaqa{joinedHalaqas.length !== 1 && "s"}{" "}
                  selected
                </span>
              </motion.div>
            )}
          </div>

          {/* Halaqas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {RECOMMENDED_HALAQAS.map((halaqa, index) => {
              const isJoined = joinedHalaqas.includes(halaqa.id);

              return (
                <motion.div
                  key={halaqa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative bg-background border-2 rounded-xl p-6 transition-all ${
                    isJoined
                      ? "border-primary-600 shadow-md"
                      : "border-border hover:border-primary-300"
                  }`}
                >
                  {/* Selection Badge */}
                  {isJoined && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-primary"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}

                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      {halaqa.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {halaqa.member_count.toLocaleString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-xl font-semibold mb-2 ${
                      isJoined ? "text-primary-700" : "text-foreground"
                    }`}
                  >
                    {halaqa.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-foreground-secondary mb-4 line-clamp-3">
                    {halaqa.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Active
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Daily posts
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Growing
                    </span>
                  </div>

                  {/* Join Button */}
                  <Button
                    onClick={() => toggleHalaqa(halaqa.id)}
                    variant={isJoined ? "default" : "outline"}
                    className={`w-full ${
                      isJoined
                        ? "bg-primary-600 hover:bg-primary-700"
                        : "hover:bg-muted"
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Joined
                      </>
                    ) : (
                      "Join Halaqa"
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleBack}
                disabled={isLoading || isSkipping}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleFinish}
                disabled={isLoading || isSkipping}
                size="lg"
                className="flex-1 bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 shadow-success"
              >
                {isLoading ? (
                  "Completing..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {joinedHalaqas.length > 0
                      ? `Finish & Join ${joinedHalaqas.length} Halaqa${
                          joinedHalaqas.length !== 1 ? "s" : ""
                        }`
                      : "Finish Setup"}
                  </>
                )}
              </Button>
            </div>

            {/* Skip Option */}
            <div className="text-center">
              <button
                onClick={handleSkip}
                disabled={isLoading || isSkipping}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                {isSkipping ? "Skipping..." : "Skip for now, I'll explore later"}
              </button>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg"
          >
            <p className="text-sm text-primary-700 dark:text-primary-400">
              💡 <strong>Tip:</strong> You can always join or leave Halaqas later
              from your profile or the Explore page.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

