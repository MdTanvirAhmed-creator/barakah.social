"use client";

import { useState } from "react";
import { requireAuth } from "@/lib/supabase/route-protection";
import { Sidebar } from "@/components/navigation/Sidebar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { SearchBar } from "@/components/search/SearchBar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Main Content */}
      <main
        className={`
          min-h-screen
          md:ml-[280px]
          ${isSidebarCollapsed ? "md:ml-[80px]" : "md:ml-[280px]"}
          transition-all duration-300
          pb-20 md:pb-0
          w-full
          md:w-[calc(100vw-280px)]
          ${isSidebarCollapsed ? "md:w-[calc(100vw-80px)]" : "md:w-[calc(100vw-280px)]"}
        `}
      >
        {/* Search Bar Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="w-full px-4 sm:px-6 md:px-8 py-4 max-w-[1400px] mx-auto">
            <SearchBar />
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

