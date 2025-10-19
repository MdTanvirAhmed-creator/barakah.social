"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function WelcomePage() {
  const router = useRouter();
  const { user, profile, loading } = useSupabaseAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGetStarted = () => {
    setIsNavigating(true);
    router.push("/onboarding/interests");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pattern-islamic">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full"
      >
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-12 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-400/20 rounded-full blur-3xl" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Assalamu Alaikum, {firstName}! 👋
              </h1>

              <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                Welcome to Barakah.Social - where faith meets community, and
                knowledge finds purpose.
              </p>
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              {/* Platform Introduction */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  Let&apos;s personalize your experience
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  We&apos;ll help you discover the best content, connect with like-minded
                  Muslims, and join meaningful study circles (Halaqas).
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 text-center border border-primary-200 dark:border-primary-800"
                >
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Learn &amp; Grow
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    Access authentic Islamic knowledge from verified scholars and
                    trusted sources
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-xl p-6 text-center border border-secondary-200 dark:border-secondary-800"
                >
                  <div className="w-12 h-12 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Join Halaqas
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    Participate in study circles focused on topics that matter to
                    you
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-xl p-6 text-center border border-success-200 dark:border-success-800"
                >
                  <div className="w-12 h-12 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Build Brotherhood
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                  Connect with Muslims worldwide, support each other&apos;s spiritual
                  journey
                  </p>
                </motion.div>
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-col items-center gap-4 pt-8"
              >
                <Button
                  onClick={handleGetStarted}
                  disabled={isNavigating}
                  size="lg"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-primary px-8 py-6 text-lg"
                >
                  {isNavigating ? (
                    "Loading..."
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground">
                  This will only take 2 minutes
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

