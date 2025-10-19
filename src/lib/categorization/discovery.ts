// Content Discovery and Filtering System
// Advanced search, filtering, and recommendation engine

import { contentTaxonomy, Category, ContentMetadata } from './taxonomy';
import { CategorizationResult, ContentTag } from './taxonomy';

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  subcategory?: string;
  tags: ContentTag[];
  metadata: ContentMetadata;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  shares: number;
  qualityScore: number;
  language: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export interface SearchFilters {
  categories?: string[];
  subcategories?: string[];
  tags?: string[];
  difficulty?: string[];
  formats?: string[];
  duration?: string[];
  languages?: string[];
  targetAudience?: string[];
  contentType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  qualityScore?: {
    min: number;
    max: number;
  };
  author?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface SearchQuery {
  text?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'date' | 'views' | 'likes' | 'quality' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  items: ContentItem[];
  total: number;
  facets: {
    categories: Record<string, number>;
    tags: Record<string, number>;
    authors: Record<string, number>;
    languages: Record<string, number>;
    difficulty: Record<string, number>;
  };
  suggestions: string[];
  relatedContent: ContentItem[];
}

export interface RecommendationEngine {
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<ContentItem[]>;
  getSimilarContent(contentId: string, limit?: number): Promise<ContentItem[]>;
  getTrendingContent(category?: string, limit?: number): Promise<ContentItem[]>;
  getFeaturedContent(limit?: number): Promise<ContentItem[]>;
  getNewContent(limit?: number): Promise<ContentItem[]>;
}

export class ContentDiscoveryEngine {
  private contentIndex: Map<string, ContentItem> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private searchHistory: Map<string, string[]> = new Map();

  // Search functionality
  async searchContent(query: SearchQuery): Promise<SearchResult> {
    let results = Array.from(this.contentIndex.values());
    
    // Apply text search
    if (query.text) {
      results = this.performTextSearch(results, query.text);
    }
    
    // Apply filters
    if (query.filters) {
      results = this.applyFilters(results, query.filters);
    }
    
    // Sort results
    if (query.sortBy) {
      results = this.sortResults(results, query.sortBy, query.sortOrder || 'desc');
    }
    
    // Pagination
    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginatedResults = results.slice(offset, offset + limit);
    
    // Generate facets
    const facets = this.generateFacets(results);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(query.text || '');
    
    // Get related content
    const relatedContent = this.getRelatedContent(paginatedResults);
    
    return {
      items: paginatedResults,
      total,
      facets,
      suggestions,
      relatedContent
    };
  }

  private performTextSearch(items: ContentItem[], query: string): ContentItem[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    return items.filter(item => {
      const searchableText = `${item.title} ${item.content} ${item.author} ${item.tags.map(t => t.name).join(' ')}`.toLowerCase();
      
      // Check for exact phrase match
      if (searchableText.includes(queryLower)) {
        return true;
      }
      
      // Check for individual word matches
      const wordMatches = queryWords.filter(word => searchableText.includes(word));
      return wordMatches.length >= Math.ceil(queryWords.length * 0.6);
    });
  }

  private applyFilters(items: ContentItem[], filters: SearchFilters): ContentItem[] {
    return items.filter(item => {
      // Category filter
      if (filters.categories && !filters.categories.includes(item.category)) {
        return false;
      }
      
      // Subcategory filter
      if (filters.subcategories && item.subcategory && !filters.subcategories.includes(item.subcategory)) {
        return false;
      }
      
      // Tags filter
      if (filters.tags && !filters.tags.some(tag => item.tags.some(t => t.name === tag))) {
        return false;
      }
      
      // Difficulty filter
      if (filters.difficulty && !filters.difficulty.includes(item.metadata.difficulty)) {
        return false;
      }
      
      // Format filter
      if (filters.formats && !filters.formats.includes(item.metadata.format)) {
        return false;
      }
      
      // Duration filter
      if (filters.duration && !filters.duration.includes(item.metadata.duration)) {
        return false;
      }
      
      // Language filter
      if (filters.languages && !filters.languages.includes(item.language)) {
        return false;
      }
      
      // Target audience filter
      if (filters.targetAudience && !filters.targetAudience.includes(item.metadata.targetAudience)) {
        return false;
      }
      
      // Content type filter
      if (filters.contentType && !filters.contentType.includes(item.metadata.contentType)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange) {
        const itemDate = new Date(item.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }
      
      // Quality score filter
      if (filters.qualityScore) {
        if (item.qualityScore < filters.qualityScore.min || item.qualityScore > filters.qualityScore.max) {
          return false;
        }
      }
      
      // Author filter
      if (filters.author && !item.author.toLowerCase().includes(filters.author.toLowerCase())) {
        return false;
      }
      
      // Published filter
      if (filters.isPublished !== undefined && item.isPublished !== filters.isPublished) {
        return false;
      }
      
      // Featured filter
      if (filters.isFeatured !== undefined && item.isFeatured !== filters.isFeatured) {
        return false;
      }
      
      return true;
    });
  }

  private sortResults(items: ContentItem[], sortBy: string, sortOrder: 'asc' | 'desc'): ContentItem[] {
    return items.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          // This would use a more sophisticated relevance algorithm
          comparison = b.qualityScore - a.qualityScore;
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'views':
          comparison = b.views - a.views;
          break;
        case 'likes':
          comparison = b.likes - a.likes;
          break;
        case 'quality':
          comparison = b.qualityScore - a.qualityScore;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private generateFacets(items: ContentItem[]) {
    const facets = {
      categories: {} as Record<string, number>,
      tags: {} as Record<string, number>,
      authors: {} as Record<string, number>,
      languages: {} as Record<string, number>,
      difficulty: {} as Record<string, number>
    };
    
    items.forEach(item => {
      // Categories
      facets.categories[item.category] = (facets.categories[item.category] || 0) + 1;
      
      // Tags
      item.tags.forEach(tag => {
        facets.tags[tag.name] = (facets.tags[tag.name] || 0) + 1;
      });
      
      // Authors
      facets.authors[item.author] = (facets.authors[item.author] || 0) + 1;
      
      // Languages
      facets.languages[item.language] = (facets.languages[item.language] || 0) + 1;
      
      // Difficulty
      facets.difficulty[item.metadata.difficulty] = (facets.difficulty[item.metadata.difficulty] || 0) + 1;
    });
    
    return facets;
  }

  private generateSuggestions(query: string): string[] {
    if (!query || query.length < 2) return [];
    
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Get suggestions from categories
    contentTaxonomy.mainCategories.forEach(category => {
      if (category.name.toLowerCase().includes(queryLower)) {
        suggestions.push(category.name);
      }
      
      if (category.subcategories) {
        category.subcategories.forEach(sub => {
          if (sub.toLowerCase().includes(queryLower)) {
            suggestions.push(sub);
          }
        });
      }
    });
    
    // Get suggestions from popular tags
    const popularTags = this.getPopularTags();
    popularTags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.push(tag);
      }
    });
    
    return suggestions.slice(0, 10);
  }

  private getPopularTags(): string[] {
    const tagCounts: Record<string, number> = {};
    
    this.contentIndex.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([tag]) => tag);
  }

  private getRelatedContent(items: ContentItem[]): ContentItem[] {
    if (items.length === 0) return [];
    
    const relatedItems: ContentItem[] = [];
    const usedIds = new Set(items.map(item => item.id));
    
    items.forEach(item => {
      // Find content with similar categories
      const similarByCategory = Array.from(this.contentIndex.values())
        .filter(content => 
          content.category === item.category && 
          content.id !== item.id && 
          !usedIds.has(content.id)
        )
        .slice(0, 2);
      
      relatedItems.push(...similarByCategory);
      similarByCategory.forEach(related => usedIds.add(related.id));
    });
    
    return relatedItems.slice(0, 10);
  }

  // Recommendation Engine Implementation
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<ContentItem[]> {
    const userPrefs = this.userPreferences.get(userId) || {};
    const userHistory = this.searchHistory.get(userId) || [];
    
    // Get user's preferred categories
    const preferredCategories = userPrefs.categories || [];
    const preferredTags = userPrefs.tags || [];
    
    let recommendations = Array.from(this.contentIndex.values())
      .filter(item => item.isPublished);
    
    // Filter by user preferences
    if (preferredCategories.length > 0) {
      recommendations = recommendations.filter(item => 
        preferredCategories.includes(item.category)
      );
    }
    
    if (preferredTags.length > 0) {
      recommendations = recommendations.filter(item => 
        item.tags.some(tag => preferredTags.includes(tag.name))
      );
    }
    
    // Sort by relevance to user
    recommendations = recommendations.sort((a, b) => {
      const scoreA = this.calculateUserRelevanceScore(a, userPrefs, userHistory);
      const scoreB = this.calculateUserRelevanceScore(b, userPrefs, userHistory);
      return scoreB - scoreA;
    });
    
    return recommendations.slice(0, limit);
  }

  private calculateUserRelevanceScore(item: ContentItem, userPrefs: any, userHistory: string[]): number {
    let score = 0;
    
    // Category preference
    if (userPrefs.categories?.includes(item.category)) {
      score += 0.3;
    }
    
    // Tag preference
    const matchingTags = item.tags.filter(tag => userPrefs.tags?.includes(tag.name));
    score += matchingTags.length * 0.1;
    
    // Quality score
    score += item.qualityScore * 0.2;
    
    // Popularity
    score += (item.views + item.likes + item.shares) * 0.001;
    
    // Recency
    const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysSinceCreation / 30) * 0.1;
    
    return score;
  }

  async getSimilarContent(contentId: string, limit: number = 5): Promise<ContentItem[]> {
    const content = this.contentIndex.get(contentId);
    if (!content) return [];
    
    const similarItems = Array.from(this.contentIndex.values())
      .filter(item => item.id !== contentId && item.isPublished)
      .map(item => ({
        item,
        similarity: this.calculateContentSimilarity(content, item)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ item }) => item);
    
    return similarItems;
  }

  private calculateContentSimilarity(content1: ContentItem, content2: ContentItem): number {
    let similarity = 0;
    
    // Category similarity
    if (content1.category === content2.category) {
      similarity += 0.4;
    }
    
    // Subcategory similarity
    if (content1.subcategory === content2.subcategory) {
      similarity += 0.2;
    }
    
    // Tag similarity
    const tags1 = new Set(content1.tags.map(t => t.name));
    const tags2 = new Set(content2.tags.map(t => t.name));
    const commonTags = new Set([...tags1].filter(tag => tags2.has(tag)));
    const tagSimilarity = commonTags.size / Math.max(tags1.size, tags2.size);
    similarity += tagSimilarity * 0.3;
    
    // Author similarity
    if (content1.author === content2.author) {
      similarity += 0.1;
    }
    
    return Math.min(similarity, 1.0);
  }

  async getTrendingContent(category?: string, limit: number = 10): Promise<ContentItem[]> {
    let items = Array.from(this.contentIndex.values())
      .filter(item => item.isPublished);
    
    if (category) {
      items = items.filter(item => item.category === category);
    }
    
    // Calculate trending score based on recent activity
    const trendingItems = items.map(item => ({
      item,
      trendingScore: this.calculateTrendingScore(item)
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit)
    .map(({ item }) => item);
    
    return trendingItems;
  }

  private calculateTrendingScore(item: ContentItem): number {
    const now = Date.now();
    const createdAt = new Date(item.createdAt).getTime();
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);
    
    // Recent content gets higher score
    const recencyScore = Math.max(0, 1 - ageInHours / 168); // 1 week decay
    
    // Engagement score
    const engagementScore = (item.views + item.likes * 2 + item.shares * 3) / 100;
    
    // Quality score
    const qualityScore = item.qualityScore / 100;
    
    return recencyScore * 0.4 + engagementScore * 0.4 + qualityScore * 0.2;
  }

  async getFeaturedContent(limit: number = 10): Promise<ContentItem[]> {
    return Array.from(this.contentIndex.values())
      .filter(item => item.isFeatured && item.isPublished)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, limit);
  }

  async getNewContent(limit: number = 10): Promise<ContentItem[]> {
    return Array.from(this.contentIndex.values())
      .filter(item => item.isPublished)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Content management methods
  addContent(content: ContentItem): void {
    this.contentIndex.set(content.id, content);
  }

  updateContent(id: string, updates: Partial<ContentItem>): void {
    const existing = this.contentIndex.get(id);
    if (existing) {
      this.contentIndex.set(id, { ...existing, ...updates });
    }
  }

  removeContent(id: string): void {
    this.contentIndex.delete(id);
  }

  getUserPreferences(userId: string): any {
    return this.userPreferences.get(userId) || {};
  }

  updateUserPreferences(userId: string, preferences: any): void {
    this.userPreferences.set(userId, preferences);
  }

  addToSearchHistory(userId: string, query: string): void {
    const history = this.searchHistory.get(userId) || [];
    history.unshift(query);
    this.searchHistory.set(userId, history.slice(0, 20)); // Keep last 20 searches
  }
}

// Export singleton instance
export const contentDiscoveryEngine = new ContentDiscoveryEngine();
