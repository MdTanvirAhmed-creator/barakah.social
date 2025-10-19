"use client";

import React from 'react';
import { RecommendationEngine } from '@/components/recommendations/RecommendationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  Award, 
  Zap,
  BookOpen,
  Users,
  Clock,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Star,
  Eye,
  Heart,
  MessageCircle
} from 'lucide-react';

export default function RecommendationsPage() {
  // Mock user data - in real app, this would come from auth context
  const userId = 'user-123';
  const halaqaIds = ['halaqa-1', 'halaqa-2'];
  const category = 'quran';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">
            Smart Recommendations
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover Islamic knowledge tailored to your interests, learning level, and community
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Personalized</CardTitle>
                <p className="text-sm text-muted-foreground">Based on your interests</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Content recommendations based on your viewing history and preferences
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Trending</CardTitle>
                <p className="text-sm text-muted-foreground">What's popular now</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Discover content that's trending in your Halaqas and the community
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Editorial Picks</CardTitle>
                <p className="text-sm text-muted-foreground">Scholar curated</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              High-quality content handpicked by verified scholars
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Fresh Content</CardTitle>
                <p className="text-sm text-muted-foreground">Recently published</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Latest content published in the last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            How Our Recommendations Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Collaborative Filtering
              </h3>
              <p className="text-sm text-muted-foreground">
                We find users with similar interests and recommend content they've found valuable.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">View History</Badge>
                <Badge variant="outline">User Similarity</Badge>
                <Badge variant="outline">Content Discovery</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                Tag Similarity
              </h3>
              <p className="text-sm text-muted-foreground">
                Content with overlapping tags and categories gets higher recommendation scores.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Tag Matching</Badge>
                <Badge variant="outline">Category Bonus</Badge>
                <Badge variant="outline">Relevance Scoring</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Trending Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Recent view patterns and community engagement drive trending recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Time Weighting</Badge>
                <Badge variant="outline">View Frequency</Badge>
                <Badge variant="outline">Recency Bonus</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                Editorial Curation
              </h3>
              <p className="text-sm text-muted-foreground">
                Verified scholars curate high-quality content for editorial recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Scholar Verified</Badge>
                <Badge variant="outline">Quality Assured</Badge>
                <Badge variant="outline">Priority Weighted</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Recommendation Engine */}
      <RecommendationEngine
        userId={userId}
        halaqaIds={halaqaIds}
        category={category}
        showFilters={true}
        showStats={true}
      />

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to Discover More?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our recommendation system learns from your preferences and helps you discover 
              the most relevant Islamic knowledge for your journey.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="gap-2">
                Explore Content
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
