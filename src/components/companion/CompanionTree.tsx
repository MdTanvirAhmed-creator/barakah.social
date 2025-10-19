"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface CompanionConnection {
  id: string;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    interests: string[];
  };
  connectionStrength: number;
  lastInteraction: string;
}

interface CompanionTreeProps {
  connections: CompanionConnection[];
}

export function CompanionTree({ connections }: CompanionTreeProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionConnection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "border-success-500 bg-success-50 dark:bg-success-900/10";
    if (strength >= 60) return "border-primary-500 bg-primary-50 dark:bg-primary-900/10";
    if (strength >= 40) return "border-orange-500 bg-orange-50 dark:bg-orange-900/10";
    return "border-muted bg-muted";
  };

  const getConnectionLineColor = (strength: number) => {
    if (strength >= 80) return "stroke-success-500";
    if (strength >= 60) return "stroke-primary-500";
    if (strength >= 40) return "stroke-orange-500";
    return "stroke-muted-foreground";
  };

  const getConnectionLineWidth = (strength: number) => {
    if (strength >= 80) return 3;
    if (strength >= 60) return 2;
    return 1;
  };

  // Simple radial layout for companion tree
  const calculatePosition = (index: number, total: number, radius: number) => {
    const angle = (2 * Math.PI * index) / total;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No companions yet</h3>
        <p className="text-muted-foreground max-w-md">
          Start connecting with righteous companions to see your companion network here.
        </p>
      </div>
    );
  }

  const centerRadius = 200;
  const nodeRadius = 40;

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* SVG for connection lines */}
      <div className="relative w-full h-[600px] overflow-hidden bg-muted/20 rounded-lg">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              className="fill-muted-foreground"
            >
              <polygon points="0 0, 10 3, 0 6" />
            </marker>
          </defs>
          {/* Draw connection lines from center to each companion */}
          {connections.map((connection, index) => {
            const pos = calculatePosition(index, connections.length, centerRadius);
            const centerX = "50%";
            const centerY = "50%";
            
            return (
              <line
                key={connection.id}
                x1={centerX}
                y1={centerY}
                x2={`calc(${centerX} + ${pos.x}px)`}
                y2={`calc(${centerY} + ${pos.y}px)`}
                className={getConnectionLineColor(connection.connectionStrength)}
                strokeWidth={getConnectionLineWidth(connection.connectionStrength)}
                strokeDasharray={connection.connectionStrength < 60 ? "5,5" : "none"}
                opacity={0.6}
              />
            );
          })}
        </svg>

        {/* Center node (You) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ width: `${nodeRadius * 2}px`, height: `${nodeRadius * 2}px` }}
        >
          <div className="w-full h-full border-4 border-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-1 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">You</span>
              </div>
            </div>
          </div>
        </div>

        {/* Companion nodes */}
        {connections.map((connection, index) => {
          const pos = calculatePosition(index, connections.length, centerRadius);
          
          return (
            <motion.div
              key={connection.id}
              className="absolute top-1/2 left-1/2 z-10 cursor-pointer"
              style={{
                width: `${nodeRadius * 2}px`,
                height: `${nodeRadius * 2}px`,
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelectedCompanion(connection)}
            >
              <div className={`w-full h-full border-3 rounded-full flex items-center justify-center shadow-md hover:shadow-xl transition-all ${getStrengthColor(connection.connectionStrength)}`}>
                <Avatar className="h-16 w-16">
                  <AvatarImage src={connection.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs">
                    {getInitials(connection.profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Connection strength badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <Badge 
                  variant={connection.connectionStrength >= 70 ? "default" : "secondary"}
                  className="text-xs px-2 py-0"
                >
                  {connection.connectionStrength}%
                </Badge>
              </div>

              {/* Name tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-foreground bg-card px-2 py-1 rounded shadow-lg border border-border">
                  {connection.profile.full_name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Companion Details */}
      {selectedCompanion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-card border border-border rounded-lg shadow-md"
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={selectedCompanion.profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                {getInitials(selectedCompanion.profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedCompanion.profile.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{selectedCompanion.profile.username}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCompanion(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Interests */}
              {selectedCompanion.profile.interests && selectedCompanion.profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCompanion.profile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Connection Details */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Connection Strength</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedCompanion.connectionStrength}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      {selectedCompanion.connectionStrength}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Interaction</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedCompanion.lastInteraction).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-3">Connection Strength Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success-500" />
            <span className="text-xs text-muted-foreground">80-100% Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary-500" />
            <span className="text-xs text-muted-foreground">60-79% Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">40-59% Growing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">0-39% New</span>
          </div>
        </div>
      </div>
    </div>
  );
}

