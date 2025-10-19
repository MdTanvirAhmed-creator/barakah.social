"use client";

import { motion } from "framer-motion";
import { Users, Sparkles, MessageCircle, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CompanionProfile } from "@/types/companion";

interface StudyTogetherBannerProps {
  companions: CompanionProfile[];
  contentTitle: string;
  onFormStudyGroup?: () => void;
}

export function StudyTogetherBanner({
  companions,
  contentTitle,
  onFormStudyGroup,
}: StudyTogetherBannerProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (companions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 rounded-lg border-2 border-primary-200 dark:border-primary-800 p-4 mb-6"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">
                {companions.length === 1
                  ? "1 of your companions is"
                  : `${companions.length} of your companions are`}{" "}
                also studying this
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Learn together and stay motivated
            </p>
          </div>
        </div>

        {/* Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {companions.slice(0, 3).map((companion, index) => (
              <motion.div
                key={companion.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800">
                  <AvatarImage src={companion.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs">
                    {getInitials(companion.full_name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            {companions.length > 3 && (
              <div className="w-10 h-10 bg-muted border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  +{companions.length - 3}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {onFormStudyGroup && (
            <Button
              onClick={onFormStudyGroup}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 ml-2"
            >
              <Users className="w-4 h-4 mr-2" />
              Form Study Group
            </Button>
          )}
        </div>
      </div>

      {/* Companion Names */}
      {companions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center flex-wrap gap-2">
            {companions.slice(0, 5).map((companion) => (
              <div
                key={companion.id}
                className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={companion.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-[10px]">
                    {getInitials(companion.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {companion.full_name}
                </span>
              </div>
            ))}
            {companions.length > 5 && (
              <span className="text-sm text-muted-foreground">
                and {companions.length - 5} more...
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

