"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  BookOpen,
  Compass,
  User,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { useCompanionData } from "@/hooks/useCompanionData";
import { CompanionNotificationDropdown } from "@/components/companion/CompanionNotificationDropdown";
import { useState } from "react";

const NAVIGATION_ITEMS = [
  {
    name: "Al-Minbar",
    nameEn: "Home",
    href: "/feed",
    icon: Home,
    description: "Your personalized feed",
  },
  {
    name: "Halaqas",
    nameEn: "Circles",
    href: "/halaqas",
    icon: Users,
    description: "Study circles",
    badge: 3, // Number of unread notifications
  },
  {
    name: "Al-Hikmah",
    nameEn: "Knowledge",
    href: "/knowledge",
    icon: BookOpen,
    description: "Learning resources",
  },
  {
    name: "Contribute",
    nameEn: "Share Knowledge",
    href: "/contribute",
    icon: Lightbulb,
    description: "Submit and review content",
  },
  {
    name: "Review",
    nameEn: "Community Review",
    href: "/review",
    icon: Eye,
    description: "Review community content",
  },
  {
    name: "Tools",
    nameEn: "Islamic Tools",
    href: "/tools",
    icon: Compass,
    description: "Prayer times, Qibla, etc.",
  },
  {
    name: "Profile",
    nameEn: "Your Profile",
    href: "/profile",
    icon: User,
    description: "Settings & preferences",
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useSupabaseAuth();
  const { success, error: showError } = useToast();
  const { stats, pendingConnections, refresh: refreshCompanionData } = useCompanionData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (err) {
      showError("Failed to sign out");
    } finally {
      setIsLoggingOut(false);
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-card/95 backdrop-blur-lg border-r border-border shadow-lg z-40 flex flex-col"
    >
      {/* Header with Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-lg text-foreground">
                Barakah.Social
              </span>
            </motion.div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">B</span>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Summary */}
      {!loading && profile && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {getInitials(profile.full_name || undefined)}
              </AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{profile.username}
                </p>
              </motion.div>
            )}

            {!isCollapsed && (
              <CompanionNotificationDropdown
                pendingConnections={pendingConnections}
                onUpdate={refreshCompanionData}
              />
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-center gap-3 px-3 py-3 rounded-lg
                  transition-all cursor-pointer group
                  ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                      : "text-foreground-secondary hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className={`${isCollapsed ? "mx-auto" : ""}`}>
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-primary-600" : "text-current"
                    }`}
                  />
                  {/* Notification Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-1 left-6 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>

                {/* Text */}
                {!isCollapsed && (
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-primary-700 dark:text-primary-400" : ""
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.nameEn}
                    </p>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer with Logout */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 text-muted-foreground mr-2" />
                {!isCollapsed && (
                  <span className="text-sm text-muted-foreground">Collapse</span>
                )}
              </>
            )}
          </button>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`w-full ${
            isCollapsed ? "px-2" : "justify-start"
          } text-error hover:text-error hover:bg-error/10`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
}

