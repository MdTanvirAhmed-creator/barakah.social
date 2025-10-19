"use client";

import React from 'react';
import { PersonalizationDemo } from '@/components/personalization/PersonalizationDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  BookOpen,
  Heart,
  Bookmark,
  Search,
  BarChart3,
  Zap,
  Eye,
  ThumbsUp,
  Activity,
  ArrowRight,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';

export default function PersonalizationPage() {
  // Mock user data - in real app, this would come from auth context
  const userId = 'demo-user-123';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">
            Personalization Without AI
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Intelligent content personalization that tracks user behavior, builds comprehensive profiles, 
          and delivers personalized recommendations - all without AI dependencies
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Behavior Tracking</CardTitle>
                <p className="text-sm text-muted-foreground">Comprehensive user analytics</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Track views, engagement, search patterns, and viewing habits to build detailed user profiles
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Views</Badge>
              <Badge variant="outline" className="text-xs">Time Spent</Badge>
              <Badge variant="outline" className="text-xs">Engagement</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">User Profiling</CardTitle>
                <p className="text-sm text-muted-foreground">Intelligent preference detection</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Build detailed user profiles with topic preferences, author preferences, and viewing patterns
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Topics</Badge>
              <Badge variant="outline" className="text-xs">Authors</Badge>
              <Badge variant="outline" className="text-xs">Formats</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Smart Recommendations</CardTitle>
                <p className="text-sm text-muted-foreground">Personalized content delivery</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Generate personalized daily picks, trending content, and collaborative recommendations
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Daily Picks</Badge>
              <Badge variant="outline" className="text-xs">Trending</Badge>
              <Badge variant="outline" className="text-xs">Collaborative</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            How Personalization Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                1. Track Behavior
              </h3>
              <p className="text-sm text-muted-foreground">
                Monitor user interactions including views, beneficial marks, bookmarks, 
                search queries, and time spent on content.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Content views and duration</li>
                <li>• Beneficial marks given</li>
                <li>• Bookmarks created</li>
                <li>• Search patterns</li>
                <li>• Device and time patterns</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-green-600" />
                2. Build Profile
              </h3>
              <p className="text-sm text-muted-foreground">
                Aggregate behavior data to create comprehensive user profiles with 
                preferences, patterns, and engagement metrics.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Topic preferences and scores</li>
                <li>• Author preferences</li>
                <li>• Format preferences</li>
                <li>• Active hours and patterns</li>
                <li>• Knowledge level assessment</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                3. Generate Recommendations
              </h3>
              <p className="text-sm text-muted-foreground">
                Use profile data to generate personalized content recommendations 
                including daily picks, trending content, and collaborative filtering.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• For You recommendations</li>
                <li>• Trending content</li>
                <li>• New topic exploration</li>
                <li>• Continue watching</li>
                <li>• Collaborative recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Personalization Algorithms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Preference Scoring</h3>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Topic Preferences</h4>
                  <p className="text-xs text-muted-foreground">
                    Score topics based on view frequency, beneficial marks, and bookmarks
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Author Preferences</h4>
                  <p className="text-xs text-muted-foreground">
                    Weight authors based on engagement and content quality
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Format Preferences</h4>
                  <p className="text-xs text-muted-foreground">
                    Track completion rates and time spent per format
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Recommendation Types</h3>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Content-Based Filtering</h4>
                  <p className="text-xs text-muted-foreground">
                    Recommend content similar to previously engaged items
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Collaborative Filtering</h4>
                  <p className="text-xs text-muted-foreground">
                    Find users with similar preferences and recommend their content
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm">Trending Analysis</h4>
                  <p className="text-xs text-muted-foreground">
                    Identify trending content in user's Halaqas and interests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Personalization Demo */}
      <PersonalizationDemo userId={userId} />

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to Personalize Your Experience?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our personalization system learns from your behavior to deliver content 
              that matches your interests, knowledge level, and viewing patterns.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="gap-2">
                Start Personalizing
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
