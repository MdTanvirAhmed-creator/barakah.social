import { createClient } from '@/lib/supabase/client';

export interface ProcessedQuery {
  originalQuery: string;
  expandedQuery: string;
  tsquery: string;
  fuzzyQuery: string;
  detectedCategories: string[];
  searchTerms: string[];
  operators: {
    exactPhrases: string[];
    exclusions: string[];
    inclusions: string[];
    booleanOperators: string[];
  };
  metadata: {
    hasSynonyms: boolean;
    hasOperators: boolean;
    hasFuzzy: boolean;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

export interface SynonymResult {
  word: string;
  synonyms: string[];
  category?: string;
  language?: string;
}

export interface CategoryDetection {
  category: string;
  confidence: number;
  keywords: string[];
}

export class QueryProcessor {
  private supabase = createClient();

  /**
   * 1. Synonym Expansion
   * Expands search terms using the search_synonyms table
   * Example: "prayer" becomes "(prayer OR salah OR salat OR namaz)"
   */
  async expandQuery(query: string): Promise<string> {
    try {
      const words = this.extractWords(query);
      const expandedWords = await Promise.all(
        words.map(async (word) => {
          const synonyms = await this.getSynonyms(word);
          if (synonyms.length > 0) {
            return `(${[word, ...synonyms].join(' OR ')})`;
          }
          return word;
        })
      );
      
      return expandedWords.join(' AND ');
    } catch (error) {
      console.error('Error expanding query:', error);
      return query;
    }
  }

  /**
   * Get synonyms for a word from the database
   */
  private async getSynonyms(word: string): Promise<string[]> {
    try {
      const { data: synonyms } = await this.supabase
        .from('search_synonyms')
        .select('synonyms')
        .ilike('word', word)
        .single();

      if (synonyms && synonyms.synonyms) {
        return synonyms.synonyms;
      }

      // Also check for partial matches
      const { data: partialMatches } = await this.supabase
        .from('search_synonyms')
        .select('synonyms')
        .ilike('word', `%${word}%`)
        .limit(1);

      if (partialMatches && partialMatches.length > 0) {
        return partialMatches[0].synonyms || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting synonyms:', error);
      return [];
    }
  }

  /**
   * 2. Search Operators
   * Parse and handle search operators like quotes, exclusions, and boolean operators
   */
  parseOperators(query: string): {
    exactPhrases: string[];
    exclusions: string[];
    inclusions: string[];
    booleanOperators: string[];
    processedQuery: string;
  } {
    const exactPhrases: string[] = [];
    const exclusions: string[] = [];
    const inclusions: string[] = [];
    const booleanOperators: string[] = [];

    let processedQuery = query;

    // Extract exact phrases (quoted text)
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      exactPhrases.push(match[1]);
    }

    // Extract exclusions (words with - prefix)
    const exclusionRegex = /-(\w+)/g;
    while ((match = exclusionRegex.exec(query)) !== null) {
      exclusions.push(match[1]);
    }

    // Extract inclusions (words with + prefix)
    const inclusionRegex = /\+(\w+)/g;
    while ((match = inclusionRegex.exec(query)) !== null) {
      inclusions.push(match[1]);
    }

    // Extract boolean operators
    const booleanRegex = /\b(AND|OR|NOT)\b/gi;
    while ((match = booleanRegex.exec(query)) !== null) {
      booleanOperators.push(match[1].toUpperCase());
    }

    // Clean up the processed query
    processedQuery = processedQuery
      .replace(phraseRegex, '') // Remove quoted phrases
      .replace(exclusionRegex, '') // Remove exclusions
      .replace(inclusionRegex, '') // Remove inclusions
      .replace(booleanRegex, '') // Remove boolean operators
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim();

    return {
      exactPhrases,
      exclusions,
      inclusions,
      booleanOperators,
      processedQuery
    };
  }

  /**
   * Convert processed query to PostgreSQL tsquery format
   */
  toTsQuery(query: string): string {
    const operators = this.parseOperators(query);
    let tsquery = '';

    // Handle exact phrases
    if (operators.exactPhrases.length > 0) {
      const phrases = operators.exactPhrases.map(phrase => `'${phrase}'`);
      tsquery += phrases.join(' & ');
    }

    // Handle inclusions
    if (operators.inclusions.length > 0) {
      const inclusions = operators.inclusions.map(word => `'${word}'`);
      if (tsquery) tsquery += ' & ';
      tsquery += inclusions.join(' & ');
    }

    // Handle main query terms
    if (operators.processedQuery) {
      const terms = operators.processedQuery.split(' ').filter(term => term.length > 0);
      if (terms.length > 0) {
        if (tsquery) tsquery += ' & ';
        tsquery += terms.map(term => `'${term}'`).join(' & ');
      }
    }

    // Handle exclusions
    if (operators.exclusions.length > 0) {
      const exclusions = operators.exclusions.map(word => `!'${word}'`);
      if (tsquery) tsquery += ' & ';
      tsquery += exclusions.join(' & ');
    }

    // Handle boolean operators
    if (operators.booleanOperators.includes('OR')) {
      tsquery = tsquery.replace(/&/g, '|');
    }

    return tsquery || `'${query}'`;
  }

  /**
   * 3. Fuzzy Matching for Typos
   * Uses PostgreSQL's similarity functions and pg_trgm extension
   */
  async fuzzySearch(query: string, threshold: number = 0.3): Promise<{
    query: string;
    parameters: string[];
  }> {
    const words = this.extractWords(query);
    const fuzzyConditions: string[] = [];
    const parameters: string[] = [];

    words.forEach((word, index) => {
      if (word.length > 2) { // Only apply fuzzy matching to words longer than 2 characters
        fuzzyConditions.push(`
          similarity(title, $${index + 1}) > $${words.length + 1}
          OR similarity(description, $${index + 1}) > $${words.length + 1}
          OR similarity(content, $${index + 1}) > $${words.length + 1}
        `);
        parameters.push(word);
      }
    });

    if (fuzzyConditions.length === 0) {
      return { query: '', parameters: [] };
    }

    const fuzzyQuery = `
      SELECT *,
        similarity(title, $1) as title_score,
        similarity(description, $1) as desc_score,
        similarity(content, $1) as content_score
      FROM content
      WHERE ${fuzzyConditions.join(' OR ')}
      ORDER BY (title_score + desc_score + content_score) DESC
    `;

    parameters.push(threshold.toString());

    return {
      query: fuzzyQuery,
      parameters
    };
  }

  /**
   * 4. Category Detection
   * Maps keywords to content categories for boosting relevant results
   */
  detectCategory(query: string): CategoryDetection[] {
    const categoryKeywords: Record<string, string[]> = {
      'quran': [
        'quran', 'qur\'an', 'koran', 'recitation', 'memorization', 'hifz', 'hafiz',
        'surah', 'ayah', 'verse', 'tafsir', 'exegesis', 'interpretation'
      ],
      'hadith': [
        'hadith', 'sunnah', 'prophet', 'muhammad', 'pbuh', 'sahih', 'bukhari',
        'muslim', 'tirmidhi', 'abu dawood', 'nasai', 'ibn majah'
      ],
      'worship': [
        'prayer', 'salah', 'salat', 'namaz', 'fasting', 'ramadan', 'hajj', 'umrah',
        'zakat', 'charity', 'dhikr', 'dua', 'supplication', 'worship', 'ibadah'
      ],
      'family': [
        'marriage', 'nikah', 'wedding', 'parenting', 'children', 'family', 'husband',
        'wife', 'divorce', 'talaq', 'custody', 'inheritance'
      ],
      'finance': [
        'halal', 'haram', 'riba', 'interest', 'investment', 'business', 'trade',
        'zakat', 'charity', 'wealth', 'money', 'finance', 'economics'
      ],
      'spirituality': [
        'spirituality', 'soul', 'heart', 'purification', 'tazkiyah', 'character',
        'akhlaq', 'ethics', 'morals', 'patience', 'gratitude', 'forgiveness'
      ],
      'fiqh': [
        'fiqh', 'jurisprudence', 'law', 'ruling', 'fatwa', 'halal', 'haram',
        'permissible', 'forbidden', 'obligatory', 'recommended', 'discouraged'
      ],
      'aqeedah': [
        'aqeedah', 'creed', 'belief', 'faith', 'iman', 'allah', 'god', 'prophets',
        'angels', 'books', 'qadar', 'destiny', 'hereafter', 'judgment'
      ],
      'history': [
        'history', 'biography', 'sirah', 'companions', 'sahabah', 'caliphs',
        'islamic', 'civilization', 'golden age', 'andalusia', 'baghdad'
      ],
      'science': [
        'science', 'medicine', 'health', 'healing', 'prophetic', 'natural',
        'environment', 'ecology', 'astronomy', 'mathematics', 'chemistry'
      ]
    };

    const detectedCategories: CategoryDetection[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = this.extractWords(queryLower);

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matchedKeywords: string[] = [];
      let confidence = 0;

      keywords.forEach(keyword => {
        if (queryLower.includes(keyword)) {
          matchedKeywords.push(keyword);
          confidence += 1;
        }
      });

      // Also check for partial matches
      queryWords.forEach(word => {
        keywords.forEach(keyword => {
          if (keyword.includes(word) || word.includes(keyword)) {
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
              confidence += 0.5;
            }
          }
        });
      });

      if (matchedKeywords.length > 0) {
        detectedCategories.push({
          category,
          confidence: Math.min(confidence / keywords.length, 1),
          keywords: matchedKeywords
        });
      }
    });

    // Sort by confidence
    return detectedCategories.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 5. Language Detection
   * Detect the language of the search query
   */
  detectLanguage(query: string): string {
    const arabicRegex = /[\u0600-\u06FF]/;
    const urduRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    const englishRegex = /[a-zA-Z]/;

    if (arabicRegex.test(query)) {
      return 'ar';
    } else if (urduRegex.test(query)) {
      return 'ur';
    } else if (englishRegex.test(query)) {
      return 'en';
    }

    return 'en'; // Default to English
  }

  /**
   * 6. Query Complexity Analysis
   * Analyze the complexity of the search query
   */
  analyzeComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const operators = this.parseOperators(query);
    const wordCount = this.extractWords(query).length;
    const hasOperators = operators.exactPhrases.length > 0 || 
                        operators.exclusions.length > 0 || 
                        operators.inclusions.length > 0 ||
                        operators.booleanOperators.length > 0;

    if (wordCount <= 2 && !hasOperators) {
      return 'simple';
    } else if (wordCount <= 5 && (hasOperators || wordCount > 2)) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * 7. Complete Query Processing
   * Process the entire search query with all enhancements
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    try {
      // Basic parsing
      const operators = this.parseOperators(query);
      const searchTerms = this.extractWords(query);
      
      // Synonym expansion
      const expandedQuery = await this.expandQuery(query);
      
      // Convert to tsquery format
      const tsquery = this.toTsQuery(query);
      
      // Fuzzy search setup
      const fuzzyResult = await this.fuzzySearch(query);
      
      // Category detection
      const detectedCategories = this.detectCategory(query);
      
      // Language detection
      const language = this.detectLanguage(query);
      
      // Complexity analysis
      const complexity = this.analyzeComplexity(query);
      
      // Metadata
      const metadata = {
        hasSynonyms: expandedQuery !== query,
        hasOperators: operators.exactPhrases.length > 0 || 
                     operators.exclusions.length > 0 || 
                     operators.inclusions.length > 0 ||
                     operators.booleanOperators.length > 0,
        hasFuzzy: fuzzyResult.query !== '',
        complexity
      };

      return {
        originalQuery: query,
        expandedQuery,
        tsquery,
        fuzzyQuery: fuzzyResult.query,
        detectedCategories: detectedCategories.map(cat => cat.category),
        searchTerms,
        operators,
        metadata
      };
    } catch (error) {
      console.error('Error processing query:', error);
      // Return basic processing if advanced processing fails
      return {
        originalQuery: query,
        expandedQuery: query,
        tsquery: `'${query}'`,
        fuzzyQuery: '',
        detectedCategories: [],
        searchTerms: this.extractWords(query),
        operators: this.parseOperators(query),
        metadata: {
          hasSynonyms: false,
          hasOperators: false,
          hasFuzzy: false,
          complexity: 'simple'
        }
      };
    }
  }

  /**
   * 8. Search Suggestions
   * Generate search suggestions based on the query
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      if (query.length < 2) return [];

      const { data: suggestions } = await this.supabase
        .from('user_search_history')
        .select('search_query')
        .ilike('search_query', `${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!suggestions) return [];

      // Remove duplicates and return unique suggestions
      const uniqueSuggestions = [...new Set(suggestions.map(s => s.search_query))];
      return uniqueSuggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * 9. Query Optimization
   * Optimize the query for better performance
   */
  optimizeQuery(processedQuery: ProcessedQuery): ProcessedQuery {
    // Remove stop words for better performance
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    const optimizedTerms = processedQuery.searchTerms.filter(term => 
      !stopWords.includes(term.toLowerCase())
    );

    // Limit the number of terms for performance
    const maxTerms = 10;
    const limitedTerms = optimizedTerms.slice(0, maxTerms);

    return {
      ...processedQuery,
      searchTerms: limitedTerms,
      metadata: {
        ...processedQuery.metadata,
        complexity: limitedTerms.length > 5 ? 'complex' : 
                   limitedTerms.length > 2 ? 'medium' : 'simple'
      }
    };
  }

  /**
   * 10. Helper Methods
   */
  private extractWords(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Get search statistics for analytics
   */
  async getSearchStats(query: string): Promise<{
    wordCount: number;
    hasOperators: boolean;
    language: string;
    complexity: string;
    categories: string[];
  }> {
    const words = this.extractWords(query);
    const operators = this.parseOperators(query);
    const categories = this.detectCategory(query);

    return {
      wordCount: words.length,
      hasOperators: operators.exactPhrases.length > 0 || 
                   operators.exclusions.length > 0 || 
                   operators.inclusions.length > 0 ||
                   operators.booleanOperators.length > 0,
      language: this.detectLanguage(query),
      complexity: this.analyzeComplexity(query),
      categories: categories.map(cat => cat.category)
    };
  }

  /**
   * Save search query to history for analytics
   */
  async saveSearchQuery(query: string, userId?: string): Promise<void> {
    try {
      const stats = await this.getSearchStats(query);
      
      await this.supabase
        .from('user_search_history')
        .insert({
          search_query: query,
          user_id: userId,
          word_count: stats.wordCount,
          has_operators: stats.hasOperators,
          language: stats.language,
          complexity: stats.complexity,
          categories: stats.categories,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  }
}
