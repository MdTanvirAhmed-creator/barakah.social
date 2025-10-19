"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  TrendingUp,
  Clock,
  BookOpen,
  Heart,
  Bookmark,
  Search,
  Users,
  Target,
  BarChart3,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Eye,
  ThumbsUp,
  Star,
  Zap,
  Brain,
  Filter,
  Calendar,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePersonalization } from '@/hooks/usePersonalization';
import { UserProfile, DailyPicks, ContentRecommendation } from '@/lib/personalization/userPreferences';

interface PersonalizationDemoProps {
  userId?: string;
}

export function PersonalizationDemo({ userId = 'demo-user' }: PersonalizationDemoProps) {
  const [selectedTab, setSelectedTab] = useState('profile');
  const [trackingDemo, setTrackingDemo] = useState(false);

  const {
    profile,
    dailyPicks,
    personalizedFeed,
    loading,
    error,
    refreshProfile,
    refreshDailyPicks,
    refreshFeed,
    trackView,
    trackBeneficialMark,
    trackBookmark
  } = usePersonalization({ userId, autoRefresh: true });

  const handleTrackView = async (contentId: string) => {
    setTrackingDemo(true);
    await trackView(contentId, { deviceType: 'desktop', sessionId: 'demo-session' });
    setTimeout(() => setTrackingDemo(false), 2000);
  };

  const handleTrackBeneficialMark = async (contentId: string) => {
    setTrackingDemo(true);
    await trackBeneficialMark(contentId);
    setTimeout(() => setTrackingDemo(false), 2000);
  };

  const handleTrackBookmark = async (contentId: string) => {
    setTrackingDemo(true);
    await trackBookmark(contentId);
    setTimeout(() => setTrackingDemo(false), 2000);
  };

  const getKnowledgeLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-blue-600';
      case 'advanced': return 'text-purple-600';
      case 'scholar': return 'text-gold-600';
      default: return 'text-gray-600';
    }
  };

  const getEngagementScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">
            Personalization System
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Intelligent content personalization without AI - tracks user behavior, 
          builds profiles, and delivers personalized recommendations
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Demo Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={refreshProfile} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh Profile
            </Button>
            <Button onClick={refreshDailyPicks} disabled={loading} variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh Daily Picks
            </Button>
            <Button onClick={refreshFeed} disabled={loading} variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Refresh Feed
            </Button>
          </div>
          
          {trackingDemo && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              Tracking user behavior...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">User Profile</TabsTrigger>
          <TabsTrigger value="picks">Daily Picks</TabsTrigger>
          <TabsTrigger value="feed">Personalized Feed</TabsTrigger>
          <TabsTrigger value="tracking">Behavior Tracking</TabsTrigger>
        </TabsList>

        {/* User Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {profile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className={`text-2xl font-bold ${getKnowledgeLevelColor(profile.knowledgeLevel)}`}>
                        {profile.knowledgeLevel}
                      </div>
                      <div className="text-sm text-muted-foreground">Knowledge Level</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className={`text-2xl font-bold ${getEngagementScoreColor(profile.engagementScore)}`}>
                        {profile.engagementScore}
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Score</span>
                      <span>{profile.engagementScore}/100</span>
                    </div>
                    <Progress value={profile.engagementScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Preferred Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Preferred Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.preferredTopics.length > 0 ? (
                    <div className="space-y-2">
                      {profile.preferredTopics.slice(0, 5).map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium">{topic.topic}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={topic.score} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">{topic.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No topic preferences yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Preferred Authors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Preferred Authors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.preferredAuthors.length > 0 ? (
                    <div className="space-y-2">
                      {profile.preferredAuthors.slice(0, 3).map((author, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium">{author.authorName}</span>
                          <Badge variant="outline">{author.score}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No author preferences yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Viewing Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Viewing Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Peak Hours</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.activeHours.map((hour, index) => (
                        <Badge key={index} variant="secondary">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Device Type</h4>
                    <Badge variant="outline">{profile.viewingPatterns.deviceType}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Content Depth</h4>
                    <Badge variant="outline">{profile.viewingPatterns.contentDepth}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                      <p className="text-muted-foreground">Loading profile...</p>
                    </>
                  ) : error ? (
                    <>
                      <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                      <p className="text-destructive">{error}</p>
                    </>
                  ) : (
                    <>
                      <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No profile data available</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Daily Picks Tab */}
        <TabsContent value="picks" className="space-y-6">
          {dailyPicks ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* For You */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    For You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyPicks.forYou.length > 0 ? (
                    <div className="space-y-3">
                      {dailyPicks.forYou.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.reason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{item.format}</Badge>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No recommendations yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Trending */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Trending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyPicks.trending.length > 0 ? (
                    <div className="space-y-3">
                      {dailyPicks.trending.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.reason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{item.format}</Badge>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No trending content</p>
                  )}
                </CardContent>
              </Card>

              {/* New Topic */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    New Topic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyPicks.newTopic.length > 0 ? (
                    <div className="space-y-3">
                      {dailyPicks.newTopic.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.reason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{item.format}</Badge>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No new topic content</p>
                  )}
                </CardContent>
              </Card>

              {/* Continue Watching */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Continue Watching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyPicks.continueWatching.length > 0 ? (
                    <div className="space-y-3">
                      {dailyPicks.continueWatching.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.reason}</p>
                          {item.progress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{item.progress}%</span>
                              </div>
                              <Progress value={item.progress} className="h-2" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No content to continue</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                      <p className="text-muted-foreground">Loading daily picks...</p>
                    </>
                  ) : error ? (
                    <>
                      <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                      <p className="text-destructive">{error}</p>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No daily picks available</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Personalized Feed Tab */}
        <TabsContent value="feed" className="space-y-6">
          {personalizedFeed.length > 0 ? (
            <div className="space-y-4">
              {personalizedFeed.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-muted-foreground mb-3">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>By {item.author}</span>
                          <span>•</span>
                          <span>{item.estimatedTime} min</span>
                          <span>•</span>
                          <span>{item.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline">{item.format}</Badge>
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="secondary">Score: {Math.round(item.score * 100)}</Badge>
                        </div>
                        <p className="text-sm text-primary mt-2">{item.reason}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" onClick={() => handleTrackView(item.contentId)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleTrackBeneficialMark(item.contentId)}>
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Beneficial
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleTrackBookmark(item.contentId)}>
                          <Bookmark className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No personalized feed available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Behavior Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Behavior Tracking Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The personalization system tracks user behavior to build comprehensive profiles:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium">View Tracking</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tracks content views, time spent, and device type
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium">Engagement</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tracks beneficial marks and bookmarks
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium">Search History</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tracks search queries and patterns
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Try the Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Click the buttons in the Personalized Feed tab to see behavior tracking in action.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleTrackView('demo-content-1')}>
                    <Eye className="w-4 h-4 mr-2" />
                    Track View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTrackBeneficialMark('demo-content-2')}>
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Track Beneficial
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTrackBookmark('demo-content-3')}>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Track Bookmark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
