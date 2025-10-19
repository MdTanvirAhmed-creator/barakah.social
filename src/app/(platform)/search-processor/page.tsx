"use client";

import React from 'react';
import { QueryProcessorDemo } from '@/components/search/QueryProcessorDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Search, 
  Zap, 
  Target, 
  Globe,
  BarChart3,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Hash,
  Filter,
  Code,
  Eye,
  Sparkles,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react';

export default function SearchProcessorPage() {
  // Mock user data - in real app, this would come from auth context
  const userId = 'user-123';

  const handleQueryProcessed = (processedQuery: any) => {
    console.log('Query processed:', processedQuery);
    // In a real app, you might want to:
    // - Save the processed query to analytics
    // - Update search results
    // - Track user search behavior
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">
            Advanced Query Processor
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Intelligent search query processing with synonym expansion, fuzzy matching, 
          category detection, and search operators - all without AI dependencies
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Synonym Expansion</CardTitle>
                <p className="text-sm text-muted-foreground">Expand search terms</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatically expand search terms using database synonyms
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">prayer → salah</Badge>
              <Badge variant="outline" className="text-xs">fasting → sawm</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Filter className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Search Operators</CardTitle>
                <p className="text-sm text-muted-foreground">Advanced search syntax</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Support for quotes, exclusions, inclusions, and boolean operators
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">"exact phrase"</Badge>
              <Badge variant="outline" className="text-xs">-exclude</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Category Detection</CardTitle>
                <p className="text-sm text-muted-foreground">Auto-detect categories</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatically detect content categories from search terms
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">worship</Badge>
              <Badge variant="outline" className="text-xs">family</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Fuzzy Matching</CardTitle>
                <p className="text-sm text-muted-foreground">Handle typos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Handle typos and similar terms using PostgreSQL similarity
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">salat → salah</Badge>
              <Badge variant="outline" className="text-xs">hajj → haj</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            How Query Processing Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Synonym Expansion
              </h3>
              <p className="text-sm text-muted-foreground">
                Look up each word in the search_synonyms table and replace with 
                (word OR synonym1 OR synonym2) for broader search coverage.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-sm">
                  "prayer" → "(prayer OR salah OR salat OR namaz)"
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4 text-green-600" />
                Search Operators
              </h3>
              <p className="text-sm text-muted-foreground">
                Parse and handle search operators like quotes for exact phrases, 
                - for exclusions, + for inclusions, and boolean operators.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-sm">
                  "five pillars" -music → 'five pillars' & !music
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Category Detection
              </h3>
              <p className="text-sm text-muted-foreground">
                Map keywords to content categories and calculate confidence scores 
                to boost relevant results.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-sm">
                  "prayer times" → worship category (confidence: 0.8)
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-600" />
                Fuzzy Matching
              </h3>
              <p className="text-sm text-muted-foreground">
                Use PostgreSQL's similarity functions and pg_trgm extension 
                to handle typos and similar terms.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-sm">
                  "salat" matches "salah" with 0.85 similarity
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Query Processor Demo */}
      <QueryProcessorDemo
        userId={userId}
        onQueryProcessed={handleQueryProcessed}
      />

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to Process Your Queries?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our query processor intelligently enhances your search queries with 
              synonym expansion, fuzzy matching, and category detection for better results.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="gap-2">
                Try It Now
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
