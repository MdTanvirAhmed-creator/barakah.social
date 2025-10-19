// Intelligent Categorization Engine
// Advanced AI-powered content categorization and tagging system

import { 
  contentTaxonomy, 
  categorizationRules, 
  CategorizationResult, 
  ContentTag, 
  ContentMetadata,
  Category 
} from './taxonomy';

export interface ContentAnalysis {
  title: string;
  content: string;
  author?: string;
  language?: string;
  existingTags?: string[];
  metadata?: Partial<ContentMetadata>;
}

export interface CategorizationEngine {
  analyzeContent(analysis: ContentAnalysis): Promise<CategorizationResult>;
  suggestTags(content: string, category: string): Promise<ContentTag[]>;
  findSimilarContent(content: string, limit?: number): Promise<string[]>;
  validateCategorization(result: CategorizationResult): boolean;
  improveCategorization(result: CategorizationResult, feedback: 'correct' | 'incorrect'): void;
}

export class IntelligentCategorizationEngine implements CategorizationEngine {
  private learningData: Map<string, number> = new Map();
  private feedbackHistory: Array<{ result: CategorizationResult; feedback: string }> = [];

  async analyzeContent(analysis: ContentAnalysis): Promise<CategorizationResult> {
    const { title, content, existingTags = [], metadata = {} } = analysis;
    
    // Combine all text for analysis
    const fullText = `${title} ${content} ${existingTags.join(' ')}`.toLowerCase();
    
    // Multi-factor analysis
    const keywordAnalysis = this.analyzeKeywords(fullText);
    const semanticAnalysis = this.analyzeSemanticContent(fullText);
    const contextAnalysis = this.analyzeContext(analysis);
    const learningAdjustment = this.applyLearningAdjustments(fullText);
    
    // Combine results
    const combinedScores = this.combineAnalysisResults([
      keywordAnalysis,
      semanticAnalysis,
      contextAnalysis,
      learningAdjustment
    ]);
    
    // Get primary category
    const primaryCategory = this.getPrimaryCategory(combinedScores);
    const confidence = combinedScores[primaryCategory] || 0;
    
    // Generate smart tags
    const smartTags = await this.generateSmartTags(fullText, primaryCategory);
    
    // Determine subcategory
    const subcategory = this.getBestSubcategory(primaryCategory, fullText);
    
    // Suggest related categories
    const suggestedCategories = this.getSuggestedCategories(combinedScores, primaryCategory);
    
    // Auto-detect metadata
    const autoMetadata = this.autoDetectMetadata(fullText, analysis);
    
    return {
      primaryCategory,
      subcategory,
      tags: smartTags,
      confidence,
      suggestedCategories,
      metadata: { ...metadata, ...autoMetadata }
    };
  }

  private analyzeKeywords(text: string): Record<string, number> {
    const scores: Record<string, number> = {};
    
    contentTaxonomy.mainCategories.forEach(category => {
      if (category.keywords) {
        const primaryMatches = category.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        );
        
        const secondaryMatches = category.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase()) && 
          !categorizationRules.keywordRules[category.id as keyof typeof categorizationRules.keywordRules]?.primary.includes(keyword)
        );
        
        const score = (primaryMatches.length * 1.0 + secondaryMatches.length * 0.5) / category.keywords.length;
        scores[category.id] = Math.min(score, 1.0);
      }
    });
    
    return scores;
  }

  private analyzeSemanticContent(text: string): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Semantic patterns for each category
    const semanticPatterns = {
      quran: [
        /qur['']?an/i, /tafsir/i, /exegesis/i, /tajweed/i, /recitation/i,
        /memoriz/i, /hifz/i, /surah/i, /ayah/i, /verse/i, /chapter/i
      ],
      hadith: [
        /hadith/i, /sunnah/i, /prophet/i, /muhammad/i, /sahih/i, /bukhari/i,
        /muslim/i, /authentic/i, /narrator/i, /chain/i, /isnad/i
      ],
      fiqh: [
        /fiqh/i, /jurisprudence/i, /law/i, /worship/i, /prayer/i, /fasting/i,
        /zakat/i, /hajj/i, /halal/i, /haram/i, /permissible/i, /forbidden/i
      ],
      aqeedah: [
        /aqeedah/i, /creed/i, /belief/i, /faith/i, /iman/i, /allah/i,
        /prophets/i, /messengers/i, /angels/i, /judgment/i, /paradise/i
      ],
      spirituality: [
        /spirituality/i, /soul/i, /heart/i, /purification/i, /tazkiyah/i,
        /dhikr/i, /remembrance/i, /dua/i, /supplication/i, /character/i
      ],
      practical: [
        /practical/i, /daily/i, /life/i, /family/i, /parenting/i, /children/i,
        /youth/i, /converts/i, /finance/i, /health/i, /work/i, /career/i
      ]
    };
    
    Object.entries(semanticPatterns).forEach(([category, patterns]) => {
      const matches = patterns.filter(pattern => pattern.test(text));
      scores[category] = matches.length / patterns.length;
    });
    
    return scores;
  }

  private analyzeContext(analysis: ContentAnalysis): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Author-based context
    if (analysis.author) {
      const authorLower = analysis.author.toLowerCase();
      if (authorLower.includes('tafsir') || authorLower.includes('quran')) {
        scores.quran = 0.3;
      }
      if (authorLower.includes('hadith') || authorLower.includes('sunnah')) {
        scores.hadith = 0.3;
      }
      if (authorLower.includes('fiqh') || authorLower.includes('jurisprudence')) {
        scores.fiqh = 0.3;
      }
    }
    
    // Language-based context
    if (analysis.language === 'Arabic') {
      scores.arabic = 0.2;
      scores.quran = (scores.quran || 0) + 0.1;
      scores.hadith = (scores.hadith || 0) + 0.1;
    }
    
    // Existing tags context
    if (analysis.existingTags) {
      analysis.existingTags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        contentTaxonomy.mainCategories.forEach(category => {
          if (category.keywords?.some(keyword => tagLower.includes(keyword))) {
            scores[category.id] = (scores[category.id] || 0) + 0.1;
          }
        });
      });
    }
    
    return scores;
  }

  private applyLearningAdjustments(text: string): Record<string, number> {
    const adjustments: Record<string, number> = {};
    
    // Apply learned patterns from feedback
    this.feedbackHistory.forEach(({ result, feedback }) => {
      if (feedback === 'correct') {
        // Boost similar content towards the correct category
        const similarity = this.calculateTextSimilarity(text, result.primaryCategory);
        if (similarity > 0.3) {
          adjustments[result.primaryCategory] = 0.1;
        }
      } else if (feedback === 'incorrect') {
        // Reduce confidence in the incorrect category
        const similarity = this.calculateTextSimilarity(text, result.primaryCategory);
        if (similarity > 0.3) {
          adjustments[result.primaryCategory] = -0.1;
        }
      }
    });
    
    return adjustments;
  }

  private combineAnalysisResults(results: Record<string, number>[]): Record<string, number> {
    const combined: Record<string, number> = {};
    
    // Weighted combination of all analysis results
    const weights = [0.4, 0.3, 0.2, 0.1]; // Keyword, semantic, context, learning
    
    results.forEach((result, index) => {
      Object.entries(result).forEach(([category, score]) => {
        combined[category] = (combined[category] || 0) + score * weights[index];
      });
    });
    
    return combined;
  }

  private getPrimaryCategory(scores: Record<string, number>): string {
    const entries = Object.entries(scores);
    if (entries.length === 0) return 'general';
    
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  private getBestSubcategory(categoryId: string, text: string): string | undefined {
    const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
    if (!category?.subcategories) return undefined;
    
    // Simple keyword matching for subcategories
    const subcategoryScores = category.subcategories.map(sub => {
      const keywords = sub.toLowerCase().split(/[\s(),]+/);
      const matches = keywords.filter(keyword => text.includes(keyword));
      return { subcategory: sub, score: matches.length / keywords.length };
    });
    
    const best = subcategoryScores.sort((a, b) => b.score - a.score)[0];
    return best.score > 0.3 ? best.subcategory : category.subcategories[0];
  }

  private getSuggestedCategories(scores: Record<string, number>, primaryCategory: string): string[] {
    const sorted = Object.entries(scores)
      .filter(([category]) => category !== primaryCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
    
    return sorted;
  }

  private autoDetectMetadata(text: string, analysis: ContentAnalysis): Partial<ContentMetadata> {
    const metadata: Partial<ContentMetadata> = {};
    
    // Difficulty detection
    if (text.includes('beginner') || text.includes('basic') || text.includes('introduction')) {
      metadata.difficulty = 'Beginner';
    } else if (text.includes('advanced') || text.includes('scholarly') || text.includes('research')) {
      metadata.difficulty = 'Advanced';
    } else if (text.includes('intermediate')) {
      metadata.difficulty = 'Intermediate';
    }
    
    // Content type detection
    if (text.includes('learn') || text.includes('study') || text.includes('teach')) {
      metadata.contentType = 'Educational';
    } else if (text.includes('inspire') || text.includes('motivate')) {
      metadata.contentType = 'Inspirational';
    } else if (text.includes('how to') || text.includes('guide') || text.includes('tips')) {
      metadata.contentType = 'Practical';
    }
    
    // Target audience detection
    if (text.includes('youth') || text.includes('teenager') || text.includes('young')) {
      metadata.targetAudience = 'Youth';
    } else if (text.includes('convert') || text.includes('revert') || text.includes('new muslim')) {
      metadata.targetAudience = 'Converts';
    } else if (text.includes('scholar') || text.includes('academic') || text.includes('research')) {
      metadata.targetAudience = 'Scholars';
    }
    
    return metadata;
  }

  async generateSmartTags(text: string, category: string): Promise<ContentTag[]> {
    const tags: ContentTag[] = [];
    const categoryObj = contentTaxonomy.mainCategories.find(cat => cat.id === category);
    
    if (categoryObj?.keywords) {
      const matchedKeywords = categoryObj.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      matchedKeywords.forEach(keyword => {
        const confidence = this.calculateKeywordConfidence(keyword, text);
        tags.push({
          id: `${category}-${keyword}`,
          name: keyword,
          category,
          weight: confidence,
          confidence,
          source: 'ai'
        });
      });
    }
    
    return tags.sort((a, b) => b.weight - a.weight).slice(0, 10);
  }

  private calculateKeywordConfidence(keyword: string, text: string): number {
    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Count occurrences
    const occurrences = (textLower.match(new RegExp(keywordLower, 'g')) || []).length;
    
    // Calculate confidence based on frequency and context
    const frequency = occurrences / text.split(/\s+/).length;
    const contextBonus = this.getContextBonus(keyword, text);
    
    return Math.min(frequency * 10 + contextBonus, 1.0);
  }

  private getContextBonus(keyword: string, text: string): number {
    // Check if keyword appears in important contexts (title, headings, etc.)
    const titleMatch = text.toLowerCase().includes(keyword.toLowerCase()) ? 0.2 : 0;
    const headingMatch = text.includes(`# ${keyword}`) ? 0.1 : 0;
    
    return titleMatch + headingMatch;
  }

  async findSimilarContent(content: string, limit: number = 5): Promise<string[]> {
    // This would typically query a database of existing content
    // For now, return mock similar content IDs
    return Array.from({ length: limit }, (_, i) => `similar-content-${i + 1}`);
  }

  validateCategorization(result: CategorizationResult): boolean {
    // Basic validation rules
    if (!result.primaryCategory || result.confidence < 0.1) {
      return false;
    }
    
    if (result.tags.length === 0) {
      return false;
    }
    
    // Check if primary category exists
    const categoryExists = contentTaxonomy.mainCategories.some(
      cat => cat.id === result.primaryCategory
    );
    
    return categoryExists;
  }

  improveCategorization(result: CategorizationResult, feedback: 'correct' | 'incorrect'): void {
    this.feedbackHistory.push({ result, feedback });
    
    // Update learning data
    const key = `${result.primaryCategory}-${feedback}`;
    this.learningData.set(key, (this.learningData.get(key) || 0) + 1);
    
    // Keep only recent feedback (last 100 entries)
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory = this.feedbackHistory.slice(-100);
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Get categorization statistics
  getCategorizationStats(): {
    totalAnalyses: number;
    averageConfidence: number;
    categoryDistribution: Record<string, number>;
    accuracyRate: number;
  } {
    const totalAnalyses = this.feedbackHistory.length;
    const correctAnalyses = this.feedbackHistory.filter(f => f.feedback === 'correct').length;
    const averageConfidence = this.feedbackHistory.reduce((sum, f) => sum + f.result.confidence, 0) / totalAnalyses;
    
    const categoryDistribution: Record<string, number> = {};
    this.feedbackHistory.forEach(f => {
      const category = f.result.primaryCategory;
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });
    
    const accuracyRate = totalAnalyses > 0 ? correctAnalyses / totalAnalyses : 0;
    
    return {
      totalAnalyses,
      averageConfidence,
      categoryDistribution,
      accuracyRate
    };
  }
}

// Export singleton instance
export const categorizationEngine = new IntelligentCategorizationEngine();
