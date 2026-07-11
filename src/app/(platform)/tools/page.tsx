"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Compass,
  Calendar,
  Calculator,
  MapPin,
  Bell,
  Settings,
  Star,
  Users,
  BookOpen,
  UserPlus,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { PrayerTimes } from "@/components/tools/PrayerTimes";
import { QiblaCompass } from "@/components/tools/QiblaCompass";
import { HijriCalendar } from "@/components/tools/HijriCalendar";
import { ZakatCalculator } from "@/components/tools/ZakatCalculator";
import { Button } from "@/components/ui/button";
import { GirihPattern, TazhibCorner } from "@/components/ui/girih";

const ISLAMIC_TOOLS = [
  {
    id: "prayer-times",
    title: "Prayer Times",
    description: "Daily prayer times with location detection",
    icon: Clock,
    category: "Daily",
    isNew: false,
  },
  {
    id: "qibla-compass",
    title: "Qibla Compass",
    description: "Find the direction of Kaaba from anywhere",
    icon: Compass,
    category: "Direction",
    isNew: false,
  },
  {
    id: "hijri-calendar",
    title: "Hijri Calendar",
    description: "Islamic calendar with important dates",
    icon: Calendar,
    category: "Calendar",
    isNew: false,
  },
  {
    id: "zakat-calculator",
    title: "Zakat Calculator",
    description: "Calculate your Zakat obligations",
    icon: Calculator,
    category: "Finance",
    isNew: true,
  },
  {
    id: "mosque-finder",
    title: "Mosque Finder",
    description: "Find nearby mosques and prayer spaces",
    icon: MapPin,
    category: "Location",
    isNew: false,
    comingSoon: true,
  },
  {
    id: "ramadan-tracker",
    title: "Ramadan Tracker",
    description: "Track fasting days and spiritual progress",
    icon: Star,
    category: "Spiritual",
    isNew: false,
    comingSoon: true,
  },
  {
    id: "quran-tracker",
    title: "Quran Tracker",
    description: "Track your Quran reading progress",
    icon: BookOpen,
    category: "Spiritual",
    isNew: false,
    comingSoon: true,
  },
  {
    id: "charity-tracker",
    title: "Charity Tracker",
    description: "Track your charitable giving",
    icon: TrendingUp,
    category: "Finance",
    isNew: false,
    comingSoon: true,
  },
  {
    id: "companion-finder",
    title: "Companion Finder",
    description: "Find righteous companions for your journey",
    icon: Handshake,
    category: "Social",
    isNew: true,
    comingSoon: false,
    isLink: true,
    linkPath: "/tools/companions",
  },
  {
    id: "iftar-companions",
    title: "Iftar Companions",
    description: "Find companions to break fast with virtually during Ramadan",
    icon: Users,
    category: "Ramadan",
    isNew: false,
    comingSoon: true,
    seasonal: true,
  },
  {
    id: "quran-partners",
    title: "30-Day Quran Partners",
    description: "Find companions for 30-day Quran completion challenge",
    icon: BookOpen,
    category: "Ramadan",
    isNew: false,
    comingSoon: true,
    seasonal: true,
  },
];

const CATEGORIES = ["All", "Daily", "Direction", "Calendar", "Finance", "Location", "Spiritual", "Social", "Ramadan"];

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTools = ISLAMIC_TOOLS.filter(tool => 
    selectedCategory === "All" || tool.category === selectedCategory
  );

  const renderSelectedTool = () => {
    switch (selectedTool) {
      case "prayer-times":
        return <PrayerTimes onClose={() => setSelectedTool(null)} />;
      case "qibla-compass":
        return <QiblaCompass onClose={() => setSelectedTool(null)} />;
      case "hijri-calendar":
        return <HijriCalendar onClose={() => setSelectedTool(null)} />;
      case "zakat-calculator":
        return <ZakatCalculator onClose={() => setSelectedTool(null)} />;
      default:
        return null;
    }
  };

  if (selectedTool) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-6 md:py-8">
          {renderSelectedTool()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Islamic Tools
          </h1>
          <p className="text-foreground-secondary">
            Essential tools for your daily Islamic practice
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Clock, label: "Prayer Times", value: "Active", tint: "craft-tile-teal" },
            { icon: Compass, label: "Qibla Direction", value: "Ready", tint: "craft-tile-lapis" },
            { icon: Calendar, label: "Islamic Calendar", value: "Updated", tint: "craft-tile-teal" },
            { icon: Calculator, label: "Zakat Calculator", value: "New", tint: "craft-tile-lapis" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-lg shadow-sm border border-border p-4 text-center"
            >
              <div className={`w-11 h-11 ${stat.tint} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="text-sm font-medium text-foreground">{stat.label}</div>
              <div className="text-xs text-foreground-secondary">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-primary-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool, index) => {
            const toolContent = (
              <>
                <div className="p-4 pb-0 flex items-start justify-between">
                  <div
                    className={`w-12 h-12 ${
                      index % 2 ? "craft-tile-lapis" : "craft-tile-teal"
                    } rounded-lg flex items-center justify-center`}
                  >
                    <tool.icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="flex gap-2">
                    {tool.isNew && (
                      <span
                        className="px-2 py-0.5 border text-xs rounded-full"
                        style={{
                          borderColor: "color-mix(in srgb, var(--leaf) 40%, transparent)",
                          color: "var(--leaf)",
                        }}
                      >
                        New
                      </span>
                    )}
                    {tool.comingSoon && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 text-start">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
                    {tool.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{tool.category}</span>
                    {!tool.comingSoon && (
                      <span className="text-xs font-medium text-accent-strong">Open</span>
                    )}
                  </div>
                </div>
              </>
            );

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                {tool.isLink ? (
                  <Link href={tool.linkPath || '#'}>
                    <div className="w-full bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden cursor-pointer">
                      {toolContent}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => !tool.comingSoon && setSelectedTool(tool.id)}
                    disabled={tool.comingSoon}
                    className={`w-full bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden ${
                      tool.comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {toolContent}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Featured Tools */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Most Popular Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ISLAMIC_TOOLS.filter((tool) => !tool.comingSoon).slice(0, 6).map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-lg shadow-md border border-border p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 ${
                      index % 2 ? "craft-tile-lapis" : "craft-tile-teal"
                    } rounded-lg flex items-center justify-center`}
                  >
                    <tool.icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground">{tool.category}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  {tool.description}
                </p>
                {tool.isLink ? (
                  <Link href={tool.linkPath || '#'}>
                    <button
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Open Tool
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedTool(tool.id)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Open Tool
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 relative bg-card border border-border rounded-lg p-8 text-center overflow-hidden">
          <GirihPattern />
          <TazhibCorner corner="top-start" size={38} />
          <TazhibCorner corner="bottom-end" size={38} />
          <h3 className="relative font-display text-2xl font-medium text-foreground mb-4">
            Need a custom tool?
          </h3>
          <p className="relative text-foreground-secondary mb-6 max-w-2xl mx-auto">
            New tools grow from community feedback — tell us what would help
            your daily practice.
          </p>
          <Button size="lg" className="relative">
            <Settings className="w-5 h-5 me-2" />
            Request a tool
          </Button>
        </div>
      </div>
    </div>
  );
}