"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Play,
  FileText,
  CheckCircle,
  Clock,
  Award,
  ChevronRight,
  Users,
  BookOpen,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLearningPathCompanions } from "@/hooks/useLearningPathCompanions";

interface LearningPathProps {
  path: {
    id: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    progress: number;
    totalItems: number;
    completedItems: number;
    estimatedTime: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    category: string;
    items: Array<{
      id: string;
      title: string;
      type: "video" | "article" | "book";
      duration?: string;
      readingTime?: string;
      completed: boolean;
    }>;
  };
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const DIFFICULTY_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TYPE_ICONS = {
  video: Play,
  article: FileText,
  book: BookOpen,
};

const TYPE_COLORS = {
  video: "text-red-600",
  article: "text-blue-600",
  book: "text-purple-600",
};

export function LearningPath({ path }: LearningPathProps) {
  const [showItems, setShowItems] = useState(false);
  const { partners, loading, totalLearners } = useLearningPathCompanions(path.id);

  const getProgressColor = () => {
    if (path.progress >= 80) return "bg-green-500";
    if (path.progress >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-foreground">{path.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[path.difficulty]}`}>
                {DIFFICULTY_LABELS[path.difficulty]}
              </span>
            </div>
            <p className="text-foreground-secondary mb-4">{path.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{path.progress}% ({path.completedItems}/{path.totalItems})</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${path.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-2 rounded-full ${getProgressColor()}`}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{path.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{path.totalItems} lessons</span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Partners Section */}
        {!loading && partners.length > 0 && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-foreground">
                  Study Partners on this path
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {totalLearners} learners
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {partners.slice(0, 5).map((partner, index) => (
                  <motion.div
                    key={partner.profile.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800 cursor-pointer">
                      <AvatarImage src={partner.profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs">
                        {getInitials(partner.profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {partner.profile.full_name} • {partner.progress}% complete
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-600 hover:text-primary-700 hover:bg-primary-100 dark:hover:bg-primary-900/20"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Find Study Buddy
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-primary-600 hover:bg-primary-700">
            {path.progress === 0 ? "Start Path" : "Continue Learning"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowItems(!showItems)}
            className="px-3"
          >
            {showItems ? "Hide" : "View"} Lessons
          </Button>
        </div>
      </div>

      {/* Items List */}
      <motion.div
        initial={false}
        animate={{ height: showItems ? "auto" : 0 }}
        className="overflow-hidden"
      >
        <div className="border-t border-border">
          <div className="p-6 pt-4">
            <h4 className="text-sm font-semibold text-foreground mb-4">Learning Path Contents</h4>
            <div className="space-y-3">
              {path.items.map((item, index) => {
                const ItemIcon = TYPE_ICONS[item.type];
                const isNextItem = !item.completed && index === path.completedItems;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isNextItem
                        ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                        : "hover:bg-muted"
                    }`}
                  >
                    {/* Completion Status */}
                    <div className="flex-shrink-0">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          isNextItem
                            ? "border-primary-600 bg-primary-600"
                            : "border-muted-foreground"
                        }`}>
                          {isNextItem && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Type Icon */}
                    <div className={`flex-shrink-0 ${TYPE_COLORS[item.type]}`}>
                      <ItemIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          item.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}>
                          {item.title}
                        </span>
                        {isNextItem && (
                          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                            Next
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.duration || item.readingTime} • {item.type}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {item.completed ? (
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`${
                            isNextItem
                              ? "text-primary-600 hover:text-primary-700"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {item.type === "video" ? "Watch" : "Read"}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="bg-muted/50 px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="w-4 h-4" />
            <span>Earn certificate upon completion</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {path.completedItems} of {path.totalItems} lessons completed
          </div>
        </div>
      </div>
    </div>
  );
}
