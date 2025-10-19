"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Compass,
  Calendar,
  Calculator,
  MapPin,
  Bell,
  Settings,
  Star,
  TrendingUp,
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

const ISLAMIC_TOOLS = [
  {
    id: "prayer-times",
    title: "Prayer Times",
    description: "Daily prayer times with location detection",
    icon: Clock,
    color: "from-blue-500 to-indigo-600",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
    category: "Daily",
    popularity: 95,
    isNew: false,
  },
  {
    id: "qibla-compass",
    title: "Qibla Compass",
    description: "Find the direction of Kaaba from anywhere",
    icon: Compass,
    color: "from-green-500 to-emerald-600",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
    category: "Direction",
    popularity: 88,
    isNew: false,
  },
  {
    id: "hijri-calendar",
    title: "Hijri Calendar",
    description: "Islamic calendar with important dates",
    icon: Calendar,
    color: "from-purple-500 to-violet-600",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-600",
    category: "Calendar",
    popularity: 72,
    isNew: false,
  },
  {
    id: "zakat-calculator",
    title: "Zakat Calculator",
    description: "Calculate your Zakat obligations",
    icon: Calculator,
    color: "from-amber-500 to-orange-600",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    category: "Finance",
    popularity: 81,
    isNew: true,
  },
  {
    id: "mosque-finder",
    title: "Mosque Finder",
    description: "Find nearby mosques and prayer spaces",
    icon: MapPin,
    color: "from-rose-500 to-pink-600",
    gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
    category: "Location",
    popularity: 67,
    isNew: false,
    comingSoon: true,
  },
  {
    id: "ramadan-tracker",
    title: "Ramadan Tracker",
    description: "Track fasting days and spiritual progress",
    icon: Star,
    color: "from-teal-500 to-cyan-600",
    gradient: "bg-gradient-to-br from-teal-500 to-cyan-600",
    category: "Spiritual",
    popularity: 92,
    isNew: false,
    comingSoon: true,
  },
  {
    id: "quran-tracker",
    title: "Quran Tracker",
    description: "Track your Quran reading progress",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-600",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
    category: "Spiritual",
    popularity: 85,
    isNew: false,
    comingSoon: true,
  },
  {
    id: "charity-tracker",
    title: "Charity Tracker",
    description: "Track your charitable giving",
    icon: TrendingUp,
    color: "from-indigo-500 to-purple-600",
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    category: "Finance",
    popularity: 58,
    isNew: false,
    comingSoon: true,
  },
  {
    id: "companion-finder",
    title: "Companion Finder",
    description: "Find righteous companions for your journey",
    icon: Handshake,
    color: "from-primary-500 to-secondary-600",
    gradient: "bg-gradient-to-br from-primary-500 to-secondary-600",
    category: "Social",
    popularity: 94,
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
    color: "from-purple-500 to-pink-600",
    gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
    category: "Ramadan",
    popularity: 87,
    isNew: false,
    comingSoon: true,
    seasonal: true,
  },
  {
    id: "quran-partners",
    title: "30-Day Quran Partners",
    description: "Find companions for 30-day Quran completion challenge",
    icon: BookOpen,
    color: "from-teal-500 to-emerald-600",
    gradient: "bg-gradient-to-br from-teal-500 to-emerald-600",
    category: "Ramadan",
    popularity: 91,
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
            { icon: Clock, label: "Prayer Times", value: "Active", color: "text-blue-600" },
            { icon: Compass, label: "Qibla Direction", value: "Ready", color: "text-green-600" },
            { icon: Calendar, label: "Islamic Calendar", value: "Updated", color: "text-purple-600" },
            { icon: Calculator, label: "Zakat Calculator", value: "New", color: "text-amber-600" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-lg shadow-md border border-border p-4 text-center"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
              <div className="text-sm font-medium text-foreground">{stat.label}</div>
              <div className={`text-xs ${stat.color} font-semibold`}>{stat.value}</div>
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
                <div className={`h-32 ${tool.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {tool.isNew && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        New
                      </span>
                    )}
                    {tool.comingSoon && (
                      <span className="px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded-full">
                        Soon
                      </span>
                    )}
                  </div>

                  {/* Popularity */}
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>{tool.popularity}%</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="absolute bottom-3 left-3">
                    <tool.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Category */}
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                      {tool.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
                    {tool.description}
                  </p>

                  {/* Action */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {tool.comingSoon ? "Coming Soon" : "Click to Open"}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      tool.popularity >= 90 ? "bg-green-500" :
                      tool.popularity >= 70 ? "bg-yellow-500" : "bg-gray-400"
                    }`} />
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
                    <div className="w-full bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden cursor-pointer group-hover:scale-105">
                      {toolContent}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => !tool.comingSoon && setSelectedTool(tool.id)}
                    disabled={tool.comingSoon}
                    className={`w-full bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden ${
                      tool.comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer group-hover:scale-105"
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
            {ISLAMIC_TOOLS.filter(tool => tool.popularity >= 85).map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-lg shadow-md border border-border p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${tool.gradient} rounded-lg flex items-center justify-center`}>
                    <tool.icon className="w-6 h-6 text-white" />
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
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Need a Custom Tool?</h3>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            We&apos;re constantly adding new Islamic tools based on community feedback. 
            Let us know what tools would help your daily practice.
          </p>
          <Button
            size="lg"
            className="bg-white text-primary-600 hover:bg-primary-50"
          >
            <Settings className="w-5 h-5 mr-2" />
            Request a Tool
          </Button>
        </div>
      </div>
    </div>
  );
}