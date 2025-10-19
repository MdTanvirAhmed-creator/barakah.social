"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Zap,
  Target,
  Lightbulb,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Info,
  BookOpen,
  Tag,
  Globe,
  BarChart3,
  Sparkles,
  Brain,
  Eye,
  Loader2,
  ArrowRight,
  Hash,
  Plus,
  Minus,
  X,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQueryProcessor, useSynonymExpansion, useCategoryDetection, useSearchSuggestions } from '@/hooks/useQueryProcessor';
import { ProcessedQuery } from '@/lib/search/queryProcessor';

interface QueryProcessorDemoProps {
  userId?: string;
  onQueryProcessed?: (processedQuery: ProcessedQuery) => void;
}

export function QueryProcessorDemo({ userId, onQueryProcessed }: QueryProcessorDemoProps) {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  // Main query processor
  const {
    processedQuery,
    processing,
    error,
    suggestions,
    processQuery,
    clearQuery,
    getSuggestions
  } = useQueryProcessor({
    autoProcess: false,
    saveToHistory: true,
    userId
  });

  // Specialized hooks
  const {
    expandedQuery,
    loading: expanding,
    error: expandError,
    expandQuery
  } = useSynonymExpansion();

  const {
    detectedCategories,
    loading: detectingCategories,
    error: categoryError,
    detectCategories
  } = useCategoryDetection();

  const {
    suggestions: querySuggestions,
    loading: loadingSuggestions,
    error: suggestionsError,
    getSuggestions: getQuerySuggestions
  } = useSearchSuggestions();

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      getQuerySuggestions(value);
    }
  };

  const handleProcessQuery = async () => {
    if (!query.trim()) return;
    
    await processQuery(query);
    if (processedQuery && onQueryProcessed) {
      onQueryProcessed(processedQuery);
    }
  };

  const handleExpandQuery = async () => {
    if (!query.trim()) return;
    await expandQuery(query);
  };

  const handleDetectCategories = async () => {
    if (!query.trim()) return;
    await detectCategories(query);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuery(type);
      setTimeout(() => setCopiedQuery(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'complex': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'simple': return CheckCircle;
      case 'medium': return Info;
      case 'complex': return AlertCircle;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Query Processor Demo
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced search query processing with synonym expansion, fuzzy matching, and category detection
        </p>
      </div>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter your search query (e.g., 'prayer times', 'five pillars', 'halal food')"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleProcessQuery()}
                className="text-lg"
              />
              {suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => setQuery(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleProcessQuery} disabled={processing || !query.trim()}>
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Process
            </Button>
          </div>

          {/* Advanced Options */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced
              {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
            <Button variant="outline" size="sm" onClick={clearQuery}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Advanced Options Panel */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 border rounded-lg bg-muted/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExpandQuery}
                    disabled={expanding || !query.trim()}
                    className="justify-start"
                  >
                    {expanding ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Expand Synonyms
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDetectCategories}
                    disabled={detectingCategories || !query.trim()}
                    className="justify-start"
                  >
                    {detectingCategories ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Target className="w-4 h-4 mr-2" />
                    )}
                    Detect Categories
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results */}
      {processedQuery && (
        <div className="space-y-6">
          {/* Query Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Query Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {processedQuery.searchTerms.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Search Terms</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {processedQuery.detectedCategories.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${getComplexityColor(processedQuery.metadata.complexity)}`}>
                    {processedQuery.metadata.complexity}
                  </div>
                  <div className="text-sm text-muted-foreground">Complexity</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {processedQuery.operators.exactPhrases.length + 
                     processedQuery.operators.exclusions.length + 
                     processedQuery.operators.inclusions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Operators</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processed Query Details */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="operators">Operators</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Original Query
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg">
                      <code className="text-sm">{processedQuery.originalQuery}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(processedQuery.originalQuery, 'original')}
                    >
                      {copiedQuery === 'original' ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Expanded Query
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg">
                      <code className="text-sm">{processedQuery.expandedQuery}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(processedQuery.expandedQuery, 'expanded')}
                    >
                      {copiedQuery === 'expanded' ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="operators" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="w-5 h-5" />
                      Exact Phrases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedQuery.operators.exactPhrases.length > 0 ? (
                      <div className="space-y-2">
                        {processedQuery.operators.exactPhrases.map((phrase, index) => (
                          <Badge key={index} variant="secondary" className="mr-2">
                            "{phrase}"
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No exact phrases found</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Minus className="w-5 h-5" />
                      Exclusions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedQuery.operators.exclusions.length > 0 ? (
                      <div className="space-y-2">
                        {processedQuery.operators.exclusions.map((exclusion, index) => (
                          <Badge key={index} variant="destructive" className="mr-2">
                            -{exclusion}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No exclusions found</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Inclusions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedQuery.operators.inclusions.length > 0 ? (
                      <div className="space-y-2">
                        {processedQuery.operators.inclusions.map((inclusion, index) => (
                          <Badge key={index} variant="default" className="mr-2">
                            +{inclusion}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No inclusions found</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Boolean Operators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedQuery.operators.booleanOperators.length > 0 ? (
                      <div className="space-y-2">
                        {processedQuery.operators.booleanOperators.map((operator, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {operator}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No boolean operators found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Detected Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {processedQuery.detectedCategories.length > 0 ? (
                    <div className="space-y-2">
                      {processedQuery.detectedCategories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No categories detected</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      PostgreSQL tsquery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg">
                      <code className="text-sm">{processedQuery.tsquery}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(processedQuery.tsquery, 'tsquery')}
                    >
                      {copiedQuery === 'tsquery' ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Fuzzy Query
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedQuery.fuzzyQuery ? (
                      <div className="p-4 bg-muted rounded-lg">
                        <code className="text-sm">{processedQuery.fuzzyQuery}</code>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No fuzzy query generated</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        {processedQuery.metadata.hasSynonyms ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Synonyms</span>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        {processedQuery.metadata.hasOperators ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Operators</span>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        {processedQuery.metadata.hasFuzzy ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Fuzzy</span>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        {React.createElement(getComplexityIcon(processedQuery.metadata.complexity), {
                          className: `w-4 h-4 ${getComplexityColor(processedQuery.metadata.complexity)}`
                        })}
                        <span className="text-sm font-medium">Complexity</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium mb-2">Processing Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
