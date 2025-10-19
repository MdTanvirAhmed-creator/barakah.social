"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Calendar,
  Heart,
  MessageCircle,
  UserPlus,
  Settings,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Award,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useCompanionData } from "@/hooks/useCompanionData";
import { CompanionTree } from "@/components/companion/CompanionTree";
import { CompanionManagement } from "@/components/companion/CompanionManagement";

interface CompanionStats {
  totalCompanions: number;
  averageConnectionStrength: number;
  mostInteractiveCompanion?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    interactionCount: number;
  };
  longestCompanionship?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    daysTogether: number;
  };
  thisWeekInteractions: number;
  growthPercentage: number;
}

interface CompanionConnection {
  id: string;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    interests: string[];
    beneficial_count: number;
  };
  connectionStrength: number;
  lastInteraction: string;
  createdAt: string;
  status: string;
}

export default function CompanionsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CompanionStats | null>(null);
  const [connections, setConnections] = useState<CompanionConnection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pending">("all");
  const [showTreeView, setShowTreeView] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Load companion data async (don't block page render)
  const { stats: companionData, pendingConnections, refresh } = useCompanionData();

  useEffect(() => {
    loadCompanionData();
  }, []);

  // If user has no connections, show empty state immediately
  useEffect(() => {
    if (!loading && connections.length === 0) {
      setStats({
        totalCompanions: 0,
        averageConnectionStrength: 0,
        thisWeekInteractions: 0,
        growthPercentage: 0,
      });
    }
  }, [loading, connections.length]);

  const loadCompanionData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load connections with profiles in a single query (optimized)
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("companion_connections")
        .select(`
          id,
          connection_strength,
          last_interaction,
          created_at,
          status,
          requester_id,
          recipient_id,
          requester:profiles!companion_connections_requester_id_fkey(id, username, full_name, avatar_url, bio, interests, beneficial_count),
          recipient:profiles!companion_connections_recipient_id_fkey(id, username, full_name, avatar_url, bio, interests, beneficial_count)
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq("status", "accepted")
        .limit(50); // Limit to prevent slow queries

      if (connectionsError) {
        console.error("Error loading connections:", connectionsError);
        // Continue with empty data instead of throwing
        setConnections([]);
        setLoading(false);
        return;
      }

      // Process connections - get the companion's profile (not the current user's)
      const enrichedConnections: CompanionConnection[] = (connectionsData || []).map((conn: any) => {
        const profile = conn.requester_id === user.id ? conn.recipient : conn.requester;
        
        return {
          id: conn.id,
          profile: {
            id: profile.id,
            username: profile.username || 'Unknown',
            full_name: profile.full_name || 'Unknown User',
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            interests: profile.interests || [],
            beneficial_count: profile.beneficial_count || 0,
          },
          connectionStrength: conn.connection_strength || 50,
          lastInteraction: conn.last_interaction || conn.created_at,
          createdAt: conn.created_at,
          status: conn.status,
        };
      });

      setConnections(enrichedConnections);

      // Calculate stats
      if (enrichedConnections.length > 0) {
        const avgStrength = enrichedConnections.reduce((sum, c) => sum + c.connectionStrength, 0) / enrichedConnections.length;
        
        // Find most interactive (mock interaction count for now)
        const mostInteractive = enrichedConnections[0];
        
        // Find longest companionship
        const oldest = enrichedConnections.reduce((prev, current) => 
          new Date(current.createdAt) < new Date(prev.createdAt) ? current : prev
        );
        const daysTogether = Math.floor((Date.now() - new Date(oldest.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        setStats({
          totalCompanions: enrichedConnections.length,
          averageConnectionStrength: Math.round(avgStrength),
          mostInteractiveCompanion: {
            id: mostInteractive.profile.id,
            username: mostInteractive.profile.username,
            full_name: mostInteractive.profile.full_name,
            avatar_url: mostInteractive.profile.avatar_url,
            interactionCount: 47, // Mock
          },
          longestCompanionship: {
            id: oldest.profile.id,
            username: oldest.profile.username,
            full_name: oldest.profile.full_name,
            avatar_url: oldest.profile.avatar_url,
            daysTogether,
          },
          thisWeekInteractions: 23, // Mock
          growthPercentage: 15, // Mock
        });
      }
    } catch (error) {
      console.error("Error loading companion data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(conn => {
    const matchesSearch = 
      conn.profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || conn.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-6 md:py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-40 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2"></div>
                        <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="h-96 bg-muted rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Companions</h1>
              <p className="text-muted-foreground">
                Your righteous companions on the journey of faith
              </p>
            </div>
            <Button 
              className="bg-primary-600 hover:bg-primary-700"
              onClick={() => window.location.href = '/tools/companions'}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Find Companions
            </Button>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Companions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Companions</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalCompanions}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-success-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+{stats.growthPercentage}% this month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Connection Strength */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg. Connection</p>
                      <p className="text-3xl font-bold text-foreground">{stats.averageConnectionStrength}%</p>
                    </div>
                    <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-success-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-success-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.averageConnectionStrength}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* This Week */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">This Week</p>
                      <p className="text-3xl font-bold text-foreground">{stats.thisWeekInteractions}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">Interactions</p>
                </CardContent>
              </Card>

              {/* Longest Companionship */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Longest</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats.longestCompanionship?.daysTogether || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">Days together</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Companions Highlights */}
          {stats && (stats.mostInteractiveCompanion || stats.longestCompanionship) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Most Interactive */}
              {stats.mostInteractiveCompanion && (
                <Card className="border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary-600">
                        <AvatarImage src={stats.mostInteractiveCompanion.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                          {getInitials(stats.mostInteractiveCompanion.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                            Most Interactive Companion
                          </span>
                        </div>
                        <p className="font-semibold text-foreground">
                          {stats.mostInteractiveCompanion.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stats.mostInteractiveCompanion.interactionCount} interactions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Longest Companionship */}
              {stats.longestCompanionship && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-purple-600">
                        <AvatarImage src={stats.longestCompanionship.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                          {getInitials(stats.longestCompanionship.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                            Longest Companionship
                          </span>
                        </div>
                        <p className="font-semibold text-foreground">
                          {stats.longestCompanionship.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Together for {stats.longestCompanionship.daysTogether} days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={showTreeView ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTreeView(true)}
            >
              Tree View
            </Button>
            <Button
              variant={!showTreeView ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTreeView(false)}
            >
              List View
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search companions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-card border border-border rounded-lg"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Filter Companions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Connection Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Connection Strength</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm">
                  <option value="all">All Levels</option>
                  <option value="strong">Strong (80%+)</option>
                  <option value="good">Good (60-79%)</option>
                  <option value="growing">Growing (40-59%)</option>
                  <option value="new">New (0-39%)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Sort By</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm">
                  <option value="recent">Most Recent</option>
                  <option value="strength">Connection Strength</option>
                  <option value="interaction">Most Interactive</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilterStatus("all");
                  setSearchQuery("");
                  setShowFilters(false);
                }}
              >
                Clear Filters
              </Button>
              <Button
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                Apply
              </Button>
            </div>
          </motion.div>
        )}

        {/* Companion Tree View */}
        {showTreeView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  Companion Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompanionTree connections={connections} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* List View */}
        {!showTreeView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredConnections.map((connection, index) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={connection.profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                            {getInitials(connection.profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {connection.profile.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{connection.profile.username}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      {connection.profile.bio && (
                        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
                          {connection.profile.bio}
                        </p>
                      )}

                      {/* Interests */}
                      {connection.profile.interests && connection.profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {connection.profile.interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Connection Strength */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Connection</span>
                          <span className="text-xs font-semibold text-primary-600">
                            {connection.connectionStrength}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${connection.connectionStrength}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {connection.profile.beneficial_count} beneficial
                        </span>
                        <span>
                          {Math.floor((Date.now() - new Date(connection.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d together
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Companion Management */}
        <CompanionManagement 
          pendingConnections={pendingConnections as any}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

