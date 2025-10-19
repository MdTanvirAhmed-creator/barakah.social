"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  User,
  Star,
  Bookmark,
  BookmarkCheck,
  Play,
  FileText,
  BookOpen,
  Eye,
  Download,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";

interface ContentCardProps {
  content: {
    id: string;
    type: "article" | "video" | "book";
    title: string;
    author: string;
    authorAvatar?: string | null;
    thumbnail?: string | null;
    duration?: string;
    readingTime?: string;
    pages?: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    rating: number;
    views: number;
    category: string;
    description: string;
    companionActivity?: {
      studiedBy: number;
      beneficialMarkedBy?: string[]; // Companion names who found it beneficial
    };
  };
  isSaved: boolean;
  onSave: () => void;
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
  video: "from-red-500 to-pink-600",
  article: "from-blue-500 to-indigo-600",
  book: "from-purple-500 to-violet-600",
};

export function ContentCard({ content, isSaved, onSave }: ContentCardProps) {
  const { success } = useToast();
  const TypeIcon = TYPE_ICONS[content.type];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    onSave();
    success(isSaved ? "Removed from saved" : "Saved to library");
  };

  const getDurationText = () => {
    if (content.type === "video" && content.duration) {
      return content.duration;
    }
    if (content.type === "article" && content.readingTime) {
      return content.readingTime;
    }
    if (content.type === "book" && content.pages) {
      return `${content.pages} pages`;
    }
    return null;
  };

  return (
    <Link href={`/knowledge/${content.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden"
      >
        {/* Thumbnail/Header */}
        <div className={`h-48 bg-gradient-to-br ${
          content.thumbnail 
            ? "" 
            : TYPE_COLORS[content.type]
        } relative overflow-hidden`}>
          {content.thumbnail ? (
            <Image
              src={content.thumbnail}
              alt={content.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-black/20" />
          )}
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 text-white rounded-full text-sm">
              <TypeIcon className="w-4 h-4" />
              <span className="capitalize">{content.type}</span>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[content.difficulty]}`}>
              {DIFFICULTY_LABELS[content.difficulty]}
            </span>
          </div>

          {/* Play Button for Videos */}
          {content.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
              >
                <Play className="w-6 h-6 text-gray-800 ml-1" />
              </motion.div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
            {content.title}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={content.authorAvatar || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(content.author)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{content.author}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
            {content.description}
          </p>

          {/* Companion Social Proof */}
          {content.companionActivity && (
            <div className="mb-4">
              {/* Beneficial Mark from Companion */}
              {content.companionActivity.beneficialMarkedBy && content.companionActivity.beneficialMarkedBy.length > 0 && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-success-50 dark:bg-success-900/10 rounded-lg border border-success-200 dark:border-success-800">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-success-600 fill-success-600" />
                    </div>
                  </div>
                  <p className="text-xs text-success-700 dark:text-success-400">
                    <span className="font-semibold">
                      {content.companionActivity.beneficialMarkedBy[0]}
                    </span>
                    {content.companionActivity.beneficialMarkedBy.length > 1 && (
                      <span>
                        {" "}and {content.companionActivity.beneficialMarkedBy.length - 1} other{" "}
                        {content.companionActivity.beneficialMarkedBy.length > 2 ? "companions" : "companion"}
                      </span>
                    )}{" "}
                    found this beneficial
                  </p>
                </div>
              )}

              {/* Studied by Companions */}
              {content.companionActivity.studiedBy > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>
                    Studied by <span className="font-semibold text-primary-600">{content.companionActivity.studiedBy}</span>{" "}
                    {content.companionActivity.studiedBy === 1 ? "companion" : "companions"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              {/* Duration/Reading Time */}
              {getDurationText() && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{getDurationText()}</span>
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{content.views.toLocaleString()}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{content.rating}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button className="flex-1 bg-primary-600 hover:bg-primary-700 text-sm">
              {content.type === "video" && (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Watch
                </>
              )}
              {content.type === "article" && (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Read
                </>
              )}
              {content.type === "book" && (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read
                </>
              )}
            </Button>
            
            {content.type === "book" && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
