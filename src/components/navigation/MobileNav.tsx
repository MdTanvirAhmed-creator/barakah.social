"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Users, BookOpen, Handshake, User } from "lucide-react";

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
    href: "/companions",
    icon: Handshake,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 md:hidden">
        <div className="flex items-center justify-around px-2 py-3 safe-bottom">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

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

                  {/* Icon — no badges anywhere: the inbox waits quietly */}
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

    </>
  );
}

