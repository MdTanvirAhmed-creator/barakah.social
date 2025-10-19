import { createClient } from '@/lib/supabase/client';

export interface RecommendationResult {
  content_id: string;
  title: string;
  type: string;
  author: string;
  thumbnail_url?: string;
  score: number;
  reason: string;
  category?: string;
  tags: string[];
  view_count: number;
  beneficial_count: number;
  rating: number;
  created_at: string;
}

export interface RecommendationContext {
  userId?: string;
  contentId?: string;
  halaqaIds?: string[];
  category?: string;
  limit?: number;
  sessionHistory?: string[];
  excludeViewed?: boolean;
}

export class ContentRecommender {
  private supabase = createClient();

  /**
   * 1. View History Based Recommendations
   * Uses collaborative filtering to find users with similar viewing patterns
   * and recommend content they've viewed that the current user hasn't seen
   */
  async getHistoryBasedRecs(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      // Get user's last 20 viewed items
      const { data: userViews } = await this.supabase
        .from('content_views')
        .select('content_id')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(20);

      if (!userViews || userViews.length === 0) {
        return [];
      }

      const userViewedIds = userViews.map(view => view.content_id);

      // Find other users who viewed similar content
      const { data: similarUsers } = await this.supabase
        .from('content_views')
        .select('user_id')
        .in('content_id', userViewedIds)
        .neq('user_id', userId);

      if (!similarUsers || similarUsers.length === 0) {
        return [];
      }

      const similarUserIds = [...new Set(similarUsers.map(user => user.user_id))];

      // Get content viewed by similar users that current user hasn't seen
      const { data: recommendations } = await this.supabase
        .from('content_views')
        .select(`
          content_id,
          content:content_id (
            id,
            title,
            type,
            author,
            thumbnail_url,
            category,
            tags,
            view_count,
            beneficial_count,
            rating,
            created_at
          )
        `)
        .in('user_id', similarUserIds)
        .not('content_id', 'in', `(${userViewedIds.join(',')})`)
        .order('viewed_at', { ascending: false })
        .limit(100);

      if (!recommendations) {
        return [];
      }

      // Count how many similar users viewed each content
      const contentCounts = new Map<string, { count: number; content: any }>();
      
      recommendations.forEach(rec => {
        if (rec.content) {
          const contentId = rec.content_id;
          if (contentCounts.has(contentId)) {
            contentCounts.get(contentId)!.count++;
          } else {
            contentCounts.set(contentId, { count: 1, content: rec.content });
          }
        }
      });

      // Convert to recommendation results and sort by popularity
      const results: RecommendationResult[] = Array.from(contentCounts.entries())
        .map(([contentId, data]) => ({
          content_id: contentId,
          title: data.content.title,
          type: data.content.type,
          author: data.content.author,
          thumbnail_url: data.content.thumbnail_url,
          score: data.count,
          reason: `Viewed by ${data.count} users with similar interests`,
          category: data.content.category,
          tags: data.content.tags || [],
          view_count: data.content.view_count || 0,
          beneficial_count: data.content.beneficial_count || 0,
          rating: data.content.rating || 0,
          created_at: data.content.created_at,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error getting history-based recommendations:', error);
      return [];
    }
  }

  /**
   * 2. Tag Similarity Recommendations
   * Finds content with overlapping tags and scores by number of matching tags
   */
  async getTagBasedRecs(contentId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      // Get tags of current content
      const { data: currentContent } = await this.supabase
        .from('content')
        .select('tags, category')
        .eq('id', contentId)
        .single();

      if (!currentContent || !currentContent.tags || currentContent.tags.length === 0) {
        return [];
      }

      const currentTags = currentContent.tags;
      const currentCategory = currentContent.category;

      // Find content with overlapping tags
      const { data: similarContent } = await this.supabase
        .from('content')
        .select(`
          id,
          title,
          type,
          author,
          thumbnail_url,
          category,
          tags,
          view_count,
          beneficial_count,
          rating,
          created_at
        `)
        .neq('id', contentId)
        .overlaps('tags', currentTags)
        .limit(100);

      if (!similarContent) {
        return [];
      }

      // Score by number of matching tags and category match
      const results: RecommendationResult[] = similarContent
        .map(content => {
          const matchingTags = content.tags.filter((tag: string) => 
            currentTags.includes(tag)
          ).length;
          
          const categoryBonus = content.category === currentCategory ? 2 : 0;
          const score = matchingTags + categoryBonus;

          return {
            content_id: content.id,
            title: content.title,
            type: content.type,
            author: content.author,
            thumbnail_url: content.thumbnail_url,
            score,
            reason: `${matchingTags} matching tags${categoryBonus > 0 ? ' + same category' : ''}`,
            category: content.category,
            tags: content.tags || [],
            view_count: content.view_count || 0,
            beneficial_count: content.beneficial_count || 0,
            rating: content.rating || 0,
            created_at: content.created_at,
          };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error getting tag-based recommendations:', error);
      return [];
    }
  }

  /**
   * 3. Series and Prerequisites
   * Returns structured content relationships like prerequisites, next in series, and related content
   */
  async getStructuredRecs(contentId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      // Get content relationships
      const { data: relationships } = await this.supabase
        .from('content_relationships')
        .select(`
          related_content_id,
          relationship_type,
          strength,
          related_content:related_content_id (
            id,
            title,
            type,
            author,
            thumbnail_url,
            category,
            tags,
            view_count,
            beneficial_count,
            rating,
            created_at
          )
        `)
        .eq('content_id', contentId)
        .order('strength', { ascending: false })
        .limit(limit);

      if (!relationships) {
        return [];
      }

      const results: RecommendationResult[] = relationships
        .filter(rel => rel.related_content)
        .map(rel => ({
          content_id: rel.related_content_id,
          title: rel.related_content.title,
          type: rel.related_content.type,
          author: rel.related_content.author,
          thumbnail_url: rel.related_content.thumbnail_url,
          score: rel.strength,
          reason: this.getRelationshipReason(rel.relationship_type),
          category: rel.related_content.category,
          tags: rel.related_content.tags || [],
          view_count: rel.related_content.view_count || 0,
          beneficial_count: rel.related_content.beneficial_count || 0,
          rating: rel.related_content.rating || 0,
          created_at: rel.related_content.created_at,
        }));

      return results;
    } catch (error) {
      console.error('Error getting structured recommendations:', error);
      return [];
    }
  }

  /**
   * 4. Trending Content
   * Returns content trending in the last 7 days, optionally filtered by user's Halaqas
   */
  async getTrendingContent(halaqaIds?: string[], limit: number = 20): Promise<RecommendationResult[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let query = this.supabase
        .from('content_views')
        .select(`
          content_id,
          viewed_at,
          content:content_id (
            id,
            title,
            type,
            author,
            thumbnail_url,
            category,
            tags,
            view_count,
            beneficial_count,
            rating,
            created_at
          )
        `)
        .gte('viewed_at', sevenDaysAgo.toISOString())
        .order('viewed_at', { ascending: false });

      // Filter by Halaqas if provided
      if (halaqaIds && halaqaIds.length > 0) {
        query = query.in('halaqa_id', halaqaIds);
      }

      const { data: recentViews } = await query.limit(1000);

      if (!recentViews) {
        return [];
      }

      // Count views per content and weight by recency
      const contentCounts = new Map<string, { 
        count: number; 
        content: any; 
        recentViews: number;
        totalScore: number;
      }>();

      recentViews.forEach(view => {
        if (view.content) {
          const contentId = view.content_id;
          const now = new Date();
          const viewTime = new Date(view.viewed_at);
          const hoursAgo = (now.getTime() - viewTime.getTime()) / (1000 * 60 * 60);
          
          // Weight newer views more heavily (exponential decay)
          const recencyWeight = Math.exp(-hoursAgo / 24); // 24-hour half-life
          
          if (contentCounts.has(contentId)) {
            const data = contentCounts.get(contentId)!;
            data.count++;
            data.recentViews++;
            data.totalScore += recencyWeight;
          } else {
            contentCounts.set(contentId, {
              count: 1,
              content: view.content,
              recentViews: 1,
              totalScore: recencyWeight,
            });
          }
        }
      });

      // Convert to recommendation results
      const results: RecommendationResult[] = Array.from(contentCounts.entries())
        .map(([contentId, data]) => ({
          content_id: contentId,
          title: data.content.title,
          type: data.content.type,
          author: data.content.author,
          thumbnail_url: data.content.thumbnail_url,
          score: Math.round(data.totalScore * 100) / 100,
          reason: `Trending: ${data.recentViews} views in last 7 days`,
          category: data.content.category,
          tags: data.content.tags || [],
          view_count: data.content.view_count || 0,
          beneficial_count: data.content.beneficial_count || 0,
          rating: data.content.rating || 0,
          created_at: data.content.created_at,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error getting trending content:', error);
      return [];
    }
  }

  /**
   * 5. Editorial Picks
   * Returns scholar-curated content recommendations
   */
  async getEditorialPicks(category?: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      let query = this.supabase
        .from('editorial_picks')
        .select(`
          content_id,
          priority,
          reason,
          content:content_id (
            id,
            title,
            type,
            author,
            thumbnail_url,
            category,
            tags,
            view_count,
            beneficial_count,
            rating,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: picks } = await query.limit(limit);

      if (!picks) {
        return [];
      }

      const results: RecommendationResult[] = picks
        .filter(pick => pick.content)
        .map(pick => ({
          content_id: pick.content_id,
          title: pick.content.title,
          type: pick.content.type,
          author: pick.content.author,
          thumbnail_url: pick.content.thumbnail_url,
          score: pick.priority,
          reason: pick.reason || 'Editorial pick',
          category: pick.content.category,
          tags: pick.content.tags || [],
          view_count: pick.content.view_count || 0,
          beneficial_count: pick.content.beneficial_count || 0,
          rating: pick.content.rating || 0,
          created_at: pick.content.created_at,
        }));

      return results;
    } catch (error) {
      console.error('Error getting editorial picks:', error);
      return [];
    }
  }

  /**
   * 6. Session-Based Recommendations
   * Based on current session viewing pattern, finds users with similar patterns
   * and suggests their next viewed items
   */
  async getSessionRecs(sessionHistory: string[], limit: number = 10): Promise<RecommendationResult[]> {
    try {
      if (sessionHistory.length < 2) {
        return [];
      }

      // Find users who viewed the same content in similar order
      const { data: similarSessions } = await this.supabase
        .from('content_views')
        .select('user_id, content_id, viewed_at')
        .in('content_id', sessionHistory)
        .order('viewed_at', { ascending: true });

      if (!similarSessions) {
        return [];
      }

      // Group by user and find those with similar viewing patterns
      const userSessions = new Map<string, string[]>();
      similarSessions.forEach(view => {
        if (!userSessions.has(view.user_id)) {
          userSessions.set(view.user_id, []);
        }
        userSessions.get(view.user_id)!.push(view.content_id);
      });

      // Find users with similar patterns (at least 2 overlapping items)
      const similarUsers: string[] = [];
      userSessions.forEach((userHistory, userId) => {
        const overlap = sessionHistory.filter(id => userHistory.includes(id)).length;
        if (overlap >= 2) {
          similarUsers.push(userId);
        }
      });

      if (similarUsers.length === 0) {
        return [];
      }

      // Get content viewed by similar users after their similar sessions
      const { data: nextViews } = await this.supabase
        .from('content_views')
        .select(`
          content_id,
          content:content_id (
            id,
            title,
            type,
            author,
            thumbnail_url,
            category,
            tags,
            view_count,
            beneficial_count,
            rating,
            created_at
          )
        `)
        .in('user_id', similarUsers)
        .not('content_id', 'in', `(${sessionHistory.join(',')})`)
        .order('viewed_at', { ascending: false })
        .limit(100);

      if (!nextViews) {
        return [];
      }

      // Count recommendations and score by frequency
      const contentCounts = new Map<string, { count: number; content: any }>();
      
      nextViews.forEach(view => {
        if (view.content) {
          const contentId = view.content_id;
          if (contentCounts.has(contentId)) {
            contentCounts.get(contentId)!.count++;
          } else {
            contentCounts.set(contentId, { count: 1, content: view.content });
          }
        }
      });

      // Convert to recommendation results
      const results: RecommendationResult[] = Array.from(contentCounts.entries())
        .map(([contentId, data]) => ({
          content_id: contentId,
          title: data.content.title,
          type: data.content.type,
          author: data.content.author,
          thumbnail_url: data.content.thumbnail_url,
          score: data.count,
          reason: `Next viewed by ${data.count} users with similar session`,
          category: data.content.category,
          tags: data.content.tags || [],
          view_count: data.content.view_count || 0,
          beneficial_count: data.content.beneficial_count || 0,
          rating: data.content.rating || 0,
          created_at: data.content.created_at,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error getting session-based recommendations:', error);
      return [];
    }
  }

  /**
   * Combined Recommendations
   * Combines multiple recommendation strategies with weighted scoring
   */
  async getCombinedRecs(context: RecommendationContext): Promise<RecommendationResult[]> {
    const {
      userId,
      contentId,
      halaqaIds,
      category,
      limit = 20,
      sessionHistory,
      excludeViewed = true
    } = context;

    const allRecommendations: RecommendationResult[] = [];

    try {
      // Get different types of recommendations
      const promises: Promise<RecommendationResult[]>[] = [];

      if (userId) {
        promises.push(this.getHistoryBasedRecs(userId, limit));
      }

      if (contentId) {
        promises.push(this.getTagBasedRecs(contentId, limit));
        promises.push(this.getStructuredRecs(contentId, limit));
      }

      if (halaqaIds && halaqaIds.length > 0) {
        promises.push(this.getTrendingContent(halaqaIds, limit));
      }

      if (category) {
        promises.push(this.getEditorialPicks(category, limit));
      }

      if (sessionHistory && sessionHistory.length > 0) {
        promises.push(this.getSessionRecs(sessionHistory, limit));
      }

      // If no specific context, get trending and editorial picks
      if (promises.length === 0) {
        promises.push(this.getTrendingContent(undefined, limit));
        promises.push(this.getEditorialPicks(undefined, limit));
      }

      const results = await Promise.all(promises);
      
      // Flatten and combine all recommendations
      results.forEach(recs => {
        allRecommendations.push(...recs);
      });

      // Remove duplicates and merge scores
      const mergedRecs = new Map<string, RecommendationResult>();
      
      allRecommendations.forEach(rec => {
        if (mergedRecs.has(rec.content_id)) {
          const existing = mergedRecs.get(rec.content_id)!;
          existing.score += rec.score;
          existing.reason += `; ${rec.reason}`;
        } else {
          mergedRecs.set(rec.content_id, { ...rec });
        }
      });

      // Filter out viewed content if requested
      let finalRecs = Array.from(mergedRecs.values());
      
      if (excludeViewed && userId) {
        const { data: viewedContent } = await this.supabase
          .from('content_views')
          .select('content_id')
          .eq('user_id', userId);
        
        if (viewedContent) {
          const viewedIds = viewedContent.map(v => v.content_id);
          finalRecs = finalRecs.filter(rec => !viewedIds.includes(rec.content_id));
        }
      }

      // Sort by combined score and return top results
      return finalRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting combined recommendations:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecs(userId: string, options: {
    halaqaIds?: string[];
    category?: string;
    limit?: number;
    includeTrending?: boolean;
    includeEditorial?: boolean;
  } = {}): Promise<RecommendationResult[]> {
    const {
      halaqaIds,
      category,
      limit = 20,
      includeTrending = true,
      includeEditorial = true
    } = options;

    const context: RecommendationContext = {
      userId,
      halaqaIds,
      category,
      limit,
      excludeViewed: true
    };

    // Get base recommendations
    const baseRecs = await this.getCombinedRecs(context);
    
    // Add trending if requested
    if (includeTrending) {
      const trendingRecs = await this.getTrendingContent(halaqaIds, Math.ceil(limit * 0.3));
      baseRecs.push(...trendingRecs);
    }

    // Add editorial picks if requested
    if (includeEditorial) {
      const editorialRecs = await this.getEditorialPicks(category, Math.ceil(limit * 0.2));
      baseRecs.push(...editorialRecs);
    }

    // Remove duplicates and sort
    const uniqueRecs = new Map<string, RecommendationResult>();
    baseRecs.forEach(rec => {
      if (!uniqueRecs.has(rec.content_id)) {
        uniqueRecs.set(rec.content_id, rec);
      }
    });

    return Array.from(uniqueRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Helper method to get relationship reason text
   */
  private getRelationshipReason(relationshipType: string): string {
    const reasons: Record<string, string> = {
      'prerequisite': 'Prerequisite content',
      'related': 'Related content',
      'advanced': 'More advanced content',
      'series': 'Next in series',
      'follow_up': 'Follow-up content',
      'similar': 'Similar content'
    };

    return reasons[relationshipType] || 'Related content';
  }

  /**
   * Get content recommendations for a specific content item
   */
  async getContentRecs(contentId: string, limit: number = 10): Promise<RecommendationResult[]> {
    const context: RecommendationContext = {
      contentId,
      limit
    };

    return this.getCombinedRecs(context);
  }

  /**
   * Get trending content for a specific category
   */
  async getCategoryTrending(category: string, limit: number = 15): Promise<RecommendationResult[]> {
    return this.getTrendingContent(undefined, limit).then(recs => 
      recs.filter(rec => rec.category === category)
    );
  }

  /**
   * Get fresh content recommendations (published in last 30 days)
   */
  async getFreshContent(limit: number = 15): Promise<RecommendationResult[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: freshContent } = await this.supabase
        .from('content')
        .select(`
          id,
          title,
          type,
          author,
          thumbnail_url,
          category,
          tags,
          view_count,
          beneficial_count,
          rating,
          created_at
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!freshContent) {
        return [];
      }

      return freshContent.map(content => ({
        content_id: content.id,
        title: content.title,
        type: content.type,
        author: content.author,
        thumbnail_url: content.thumbnail_url,
        score: 100, // High score for fresh content
        reason: 'Fresh content (published recently)',
        category: content.category,
        tags: content.tags || [],
        view_count: content.view_count || 0,
        beneficial_count: content.beneficial_count || 0,
        rating: content.rating || 0,
        created_at: content.created_at,
      }));
    } catch (error) {
      console.error('Error getting fresh content:', error);
      return [];
    }
  }
}
