"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, BookOpen, Handshake, User, Sparkles } from "lucide-react";
import { CompanionBottomSheet } from "@/components/mobile/CompanionBottomSheet";
import { useCompanionData } from "@/hooks/useCompanionData";

const MOBILE_NAV_ITEMS = [
  {
    name: "Minbar",
    href: "/feed",
    icon: Home,
  },
  {
    name: "Halaqas",
    href: "/halaqas",
    icon: Users,
  },
  {
    name: "Hikmah",
    href: "/knowledge",
    icon: BookOpen,
  },
  {
    name: "Companions",
    href: "/tools/companions",
    icon: Handshake,
    showBottomSheet: true, // Special flag for bottom sheet
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const { stats } = useCompanionData();

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (item.showBottomSheet) {
      e.preventDefault();
      setShowBottomSheet(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 md:hidden">
        <div className="flex items-center justify-around px-2 py-3 safe-bottom">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            const badge = item.name === "Companions" ? stats?.pending_requests : undefined;

            // For companion tab with bottom sheet
            if (item.showBottomSheet) {
              return (
                <button
                  key={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className="flex-1 flex flex-col items-center justify-center relative"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`
                      relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl
                      transition-colors
                      ${
                        isActive
                          ? "text-primary-600"
                          : "text-muted-foreground active:text-foreground"
                      }
                    `}
                  >
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-active"
                        className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Icon */}
                    <div className="relative z-10">
                      <Icon
                        className={`w-6 h-6 ${
                          isActive ? "text-primary-600" : "text-current"
                        }`}
                      />
                      
                      {/* Notification Badge */}
                      {badge && badge > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                        >
                          {badge > 9 ? "9+" : badge}
                        </motion.span>
                      )}

                      {/* New Match Indicator */}
                      {item.name === "Companions" && false && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5"
                        >
                          <Sparkles className="w-3 h-3 text-warning fill-warning" />
                        </motion.div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        relative z-10 text-[11px] font-medium
                        ${isActive ? "text-primary-700 dark:text-primary-400" : ""}
                      `}
                    >
                      {item.name}
                    </span>
                  </motion.div>
                </button>
              );
            }

            // Regular nav items
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center relative"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`
                    relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl
                    transition-colors
                    ${
                      isActive
                        ? "text-primary-600"
                        : "text-muted-foreground active:text-foreground"
                    }
                  `}
                >
                  {/* Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <div className="relative z-10">
                    <Icon
                      className={`w-6 h-6 ${
                        isActive ? "text-primary-600" : "text-current"
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      relative z-10 text-[11px] font-medium
                      ${isActive ? "text-primary-700 dark:text-primary-400" : ""}
                    `}
                  >
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Safe area for iOS devices */}
        <div className="h-safe-bottom bg-card/95" />
      </nav>

      {/* Companion Bottom Sheet */}
      <CompanionBottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
      />
    </>
  );
}

