import { createClient } from '@/lib/supabase/client';
import { contentTaxonomy } from '@/lib/categorization/taxonomy';

// YouTube API setup
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = YOUTUBE_API_KEY ? require('googleapis').google.youtube('v3') : null;

// RSS parsing
const Parser = require('rss-parser');
const rssParser = new Parser();

// PDF processing
const pdf = require('pdf-parse');
const multer = require('multer');

// Audio processing
const ffmpeg = require('fluent-ffmpeg');

interface ContentImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

interface ImportedContent {
  title: string;
  description?: string;
  content?: string;
  original_url: string;
  content_type: 'video' | 'audio' | 'article' | 'pdf' | 'podcast';
  authors: string[];
  tags: string[];
  language: string;
  duration?: number;
  thumbnail_url?: string;
  transcript?: string;
  scholar_id?: string;
  publisher_id?: string;
  review_status: 'auto_approved' | 'pending_review' | 'approved' | 'rejected';
  metadata?: Record<string, any>;
}

/**
 * YouTube Content Importer
 * Imports videos from verified scholar channels
 */
export class YouTubeContentImporter {
  private youtube: any;
  private supabase: any;

  constructor() {
    this.youtube = youtube;
    this.supabase = createClient();
  }

  async importChannelVideos(channelId: string, scholarId: string): Promise<ContentImportResult> {
    if (!this.youtube) {
      throw new Error('YouTube API not configured');
    }

    const result: ContentImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Get channel videos
      const response = await this.youtube.search.list({
        key: YOUTUBE_API_KEY,
        channelId,
        maxResults: 50,
        order: 'date',
        type: 'video',
        part: 'snippet'
      });

      const videos = response.data.items || [];

      for (const video of videos) {
        try {
          // Check if already imported
          const { data: exists } = await this.supabase
            .from('imported_content')
            .select('id')
            .eq('original_url', `https://youtube.com/watch?v=${video.id.videoId}`)
            .single();

          if (exists) {
            result.skipped++;
            continue;
          }

          // Get video details
          const videoDetails = await this.youtube.videos.list({
            key: YOUTUBE_API_KEY,
            id: video.id.videoId,
            part: 'snippet,contentDetails,statistics'
          });

          const videoData = videoDetails.data.items?.[0];
          if (!videoData) continue;

          // Extract transcript if available
          const transcript = await this.extractTranscript(video.id.videoId);

          // Generate thumbnail
          const thumbnailUrl = videoData.snippet.thumbnails?.maxres?.url || 
                              videoData.snippet.thumbnails?.high?.url ||
                              videoData.snippet.thumbnails?.medium?.url;

          // Auto-tag based on title/description
          const tags = this.extractTags(videoData.snippet.title, videoData.snippet.description);

          // Create content object
          const content: ImportedContent = {
            title: videoData.snippet.title,
            description: videoData.snippet.description,
            original_url: `https://youtube.com/watch?v=${video.id.videoId}`,
            content_type: 'video',
            authors: [videoData.snippet.channelTitle],
            tags,
            language: this.detectLanguage(videoData.snippet.title, videoData.snippet.description),
            duration: this.parseDuration(videoData.contentDetails.duration),
            thumbnail_url: thumbnailUrl,
            transcript,
            scholar_id: scholarId,
            review_status: 'auto_approved', // for verified scholars
            metadata: {
              view_count: videoData.statistics?.viewCount,
              like_count: videoData.statistics?.likeCount,
              published_at: videoData.snippet.publishedAt,
              channel_title: videoData.snippet.channelTitle
            }
          };

          // Insert into database
          await this.supabase
            .from('imported_content')
            .insert(content);

          result.imported++;
        } catch (error) {
          result.errors.push(`Video ${video.id.videoId}: ${error.message}`);
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Channel import failed: ${error.message}`);
    }

    return result;
  }

  private async extractTranscript(videoId: string): Promise<string | null> {
    try {
      // This would require YouTube Data API v3 with transcript access
      // For now, return null - would need additional setup
      return null;
    } catch (error) {
      return null;
    }
  }

  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];

    // Extract tags from taxonomy keywords
    contentTaxonomy.mainCategories.forEach(category => {
      if (category.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        tags.push(category.id);
      }
      
      category.subcategories.forEach(subcategory => {
        if (text.includes(subcategory.toLowerCase())) {
          tags.push(subcategory.toLowerCase().replace(/\s+/g, '_'));
        }
      });
    });

    // Extract common Islamic terms
    const islamicTerms = [
      'quran', 'hadith', 'sunnah', 'islam', 'muslim', 'allah', 'muhammad',
      'prayer', 'fasting', 'zakat', 'hajj', 'ramadan', 'eid', 'dua',
      'tafsir', 'fiqh', 'aqeedah', 'spirituality', 'character'
    ];

    islamicTerms.forEach(term => {
      if (text.includes(term)) {
        tags.push(term);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private detectLanguage(title: string, description: string): string {
    const text = `${title} ${description}`;
    
    // Simple language detection based on character patterns
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[\u0750-\u077F]/.test(text)) return 'ar'; // Arabic Supplement
    if (/[\uFB50-\uFDFF]/.test(text)) return 'ar'; // Arabic Presentation Forms
    
    return 'en'; // Default to English
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration (PT4M13S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}

/**
 * RSS Feed Importer
 * Imports content from trusted Islamic blogs and websites
 */
export class RSSFeedImporter {
  private supabase: any;

  constructor() {
    this.supabase = createClient();
  }

  async importFeed(feedUrl: string, publisherId: string): Promise<ContentImportResult> {
    const result: ContentImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      const feed = await rssParser.parseURL(feedUrl);
      
      for (const item of feed.items) {
        try {
          // Check if already imported
          const { data: exists } = await this.supabase
            .from('imported_content')
            .select('id')
            .eq('original_url', item.link)
            .single();

          if (exists) {
            result.skipped++;
            continue;
          }

          // Extract and clean content
          const content = await this.extractContent(item.link, item.content || item.description);

          // Extract images
          const images = this.extractImages(item.content || item.description);

          // Auto-tag content
          const tags = this.extractTags(item.title, item.content || item.description);

          const importedContent: ImportedContent = {
            title: item.title || 'Untitled',
            description: item.contentSnippet || item.description,
            content,
            original_url: item.link,
            content_type: 'article',
            authors: this.extractAuthors(item.creator, item.author),
            tags,
            language: this.detectLanguage(item.title, item.content || item.description),
            publisher_id: publisherId,
            review_status: 'pending_review',
            metadata: {
              published_at: item.pubDate,
              images,
              categories: item.categories || []
            }
          };

          await this.supabase
            .from('imported_content')
            .insert(importedContent);

          result.imported++;
        } catch (error) {
          result.errors.push(`Item ${item.link}: ${error.message}`);
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Feed import failed: ${error.message}`);
    }

    return result;
  }

  private async extractContent(url: string, html: string): Promise<string> {
    try {
      // This would use a library like cheerio or jsdom to extract clean text
      // For now, return the HTML content
      return html;
    } catch (error) {
      return html;
    }
  }

  private extractImages(html: string): string[] {
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const images: string[] = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  private extractAuthors(creator?: string, author?: string): string[] {
    const authors: string[] = [];
    if (creator) authors.push(creator);
    if (author && author !== creator) authors.push(author);
    return authors;
  }

  private extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const tags: string[] = [];

    // Use the same tagging logic as YouTube importer
    contentTaxonomy.mainCategories.forEach(category => {
      if (category.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        tags.push(category.id);
      }
    });

    return [...new Set(tags)];
  }

  private detectLanguage(title: string, content: string): string {
    const text = `${title} ${content}`;
    
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    return 'en';
  }
}

/**
 * PDF Processor
 * Processes Islamic books, papers, and documents
 */
export class PDFProcessor {
  private supabase: any;

  constructor() {
    this.supabase = createClient();
  }

  async processPDF(file: Buffer, filename: string, scholarId?: string): Promise<ContentImportResult> {
    const result: ContentImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Extract text from PDF
      const pdfData = await pdf(file);
      const text = pdfData.text;

      // Generate table of contents
      const toc = this.generateTableOfContents(text);

      // Create page previews (first few pages)
      const preview = this.generatePreview(text);

      // Extract citation information
      const citations = this.extractCitations(text);

      // Auto-tag content
      const tags = this.extractTags(filename, text);

      const importedContent: ImportedContent = {
        title: filename.replace('.pdf', ''),
        description: `PDF document: ${filename}`,
        content: text,
        original_url: `file://${filename}`,
        content_type: 'pdf',
        authors: this.extractAuthorsFromText(text),
        tags,
        language: this.detectLanguage(text),
        scholar_id: scholarId,
        review_status: scholarId ? 'auto_approved' : 'pending_review',
        metadata: {
          page_count: pdfData.numpages,
          file_size: file.length,
          table_of_contents: toc,
          preview,
          citations,
          filename
        }
      };

      await this.supabase
        .from('imported_content')
        .insert(importedContent);

      result.imported = 1;
      result.success = true;
    } catch (error) {
      result.errors.push(`PDF processing failed: ${error.message}`);
    }

    return result;
  }

  private generateTableOfContents(text: string): string[] {
    const toc: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Look for chapter/section headers (simple heuristic)
      if (line.match(/^(Chapter|Section|Part)\s+\d+/i) || 
          line.match(/^\d+\.\s+[A-Z]/) ||
          line.match(/^[A-Z][a-z]+\s+[A-Z]/)) {
        toc.push(line.trim());
      }
    }

    return toc.slice(0, 20); // Limit to first 20 entries
  }

  private generatePreview(text: string): string {
    // Return first 1000 characters as preview
    return text.substring(0, 1000) + (text.length > 1000 ? '...' : '');
  }

  private extractCitations(text: string): string[] {
    const citations: string[] = [];
    
    // Look for common citation patterns
    const citationRegex = /(?:Quran|Qur'an)\s+\d+:\d+/gi;
    const matches = text.match(citationRegex);
    
    if (matches) {
      citations.push(...matches);
    }

    return citations.slice(0, 10); // Limit to first 10 citations
  }

  private extractAuthorsFromText(text: string): string[] {
    // Simple author extraction - look for common patterns
    const authorRegex = /(?:By|Author|Written by)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi;
    const matches = text.match(authorRegex);
    
    if (matches) {
      return matches.map(match => match.replace(/(?:By|Author|Written by)\s+/i, ''));
    }

    return [];
  }

  private extractTags(filename: string, content: string): string[] {
    const text = `${filename} ${content}`.toLowerCase();
    const tags: string[] = [];

    contentTaxonomy.mainCategories.forEach(category => {
      if (category.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        tags.push(category.id);
      }
    });

    return [...new Set(tags)];
  }

  private detectLanguage(text: string): string {
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    return 'en';
  }
}

/**
 * Podcast Importer
 * Imports Islamic podcast episodes and series
 */
export class PodcastImporter {
  private supabase: any;

  constructor() {
    this.supabase = createClient();
  }

  async importPodcastFeed(feedUrl: string, publisherId: string): Promise<ContentImportResult> {
    const result: ContentImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      const feed = await rssParser.parseURL(feedUrl);
      
      for (const item of feed.items) {
        try {
          // Check if already imported
          const { data: exists } = await this.supabase
            .from('imported_content')
            .select('id')
            .eq('original_url', item.link)
            .single();

          if (exists) {
            result.skipped++;
            continue;
          }

          // Extract audio file URL
          const audioUrl = this.extractAudioUrl(item);

          // Get audio duration if available
          const duration = await this.getAudioDuration(audioUrl);

          // Extract show notes
          const showNotes = this.extractShowNotes(item.content || item.description);

          // Auto-tag content
          const tags = this.extractTags(item.title, item.content || item.description);

          const importedContent: ImportedContent = {
            title: item.title || 'Untitled Episode',
            description: item.contentSnippet || item.description,
            content: showNotes,
            original_url: item.link,
            content_type: 'podcast',
            authors: this.extractAuthors(item.creator, item.author),
            tags,
            language: this.detectLanguage(item.title, item.content || item.description),
            duration,
            publisher_id: publisherId,
            review_status: 'pending_review',
            metadata: {
              audio_url: audioUrl,
              published_at: item.pubDate,
              series_title: feed.title,
              episode_number: this.extractEpisodeNumber(item.title),
              show_notes: showNotes
            }
          };

          await this.supabase
            .from('imported_content')
            .insert(importedContent);

          result.imported++;
        } catch (error) {
          result.errors.push(`Episode ${item.link}: ${error.message}`);
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Podcast import failed: ${error.message}`);
    }

    return result;
  }

  private extractAudioUrl(item: any): string | null {
    // Look for audio file in enclosure
    if (item.enclosure && item.enclosure.type?.includes('audio')) {
      return item.enclosure.url;
    }

    // Look for audio links in content
    const audioRegex = /<a[^>]+href="([^"]+\.(mp3|wav|m4a|ogg))"/i;
    const match = (item.content || item.description || '').match(audioRegex);
    
    return match ? match[1] : null;
  }

  private async getAudioDuration(audioUrl: string | null): Promise<number | null> {
    if (!audioUrl) return null;

    try {
      // This would use ffmpeg to get duration
      // For now, return null
      return null;
    } catch (error) {
      return null;
    }
  }

  private extractShowNotes(content: string): string {
    // Extract show notes from HTML content
    const showNotesRegex = /<p[^>]*>([^<]+)<\/p>/gi;
    const matches = content.match(showNotesRegex);
    
    if (matches) {
      return matches.join('\n');
    }

    return content;
  }

  private extractEpisodeNumber(title: string): number | null {
    const episodeRegex = /(?:Episode|Ep\.?)\s*(\d+)/i;
    const match = title.match(episodeRegex);
    
    return match ? parseInt(match[1]) : null;
  }

  private extractAuthors(creator?: string, author?: string): string[] {
    const authors: string[] = [];
    if (creator) authors.push(creator);
    if (author && author !== creator) authors.push(author);
    return authors;
  }

  private extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const tags: string[] = [];

    contentTaxonomy.mainCategories.forEach(category => {
      if (category.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        tags.push(category.id);
      }
    });

    return [...new Set(tags)];
  }

  private detectLanguage(title: string, content: string): string {
    const text = `${title} ${content}`;
    
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    return 'en';
  }
}

/**
 * Content Pipeline Manager
 * Manages automated content import scheduling and execution
 */
export class ContentPipelineManager {
  private supabase: any;

  constructor() {
    this.supabase = createClient();
  }

  async scheduleImport(pipelineId: string, schedule: string): Promise<void> {
    // Schedule content import using cron-like syntax
    // This would integrate with a job queue system
    console.log(`Scheduling pipeline ${pipelineId} with schedule: ${schedule}`);
  }

  async executePipeline(pipelineId: string): Promise<ContentImportResult> {
    const { data: pipeline } = await this.supabase
      .from('content_pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single();

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    let result: ContentImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      switch (pipeline.type) {
        case 'youtube':
          const youtubeImporter = new YouTubeContentImporter();
          result = await youtubeImporter.importChannelVideos(
            pipeline.config.channel_id,
            pipeline.config.scholar_id
          );
          break;

        case 'rss':
          const rssImporter = new RSSFeedImporter();
          result = await rssImporter.importFeed(
            pipeline.config.feed_url,
            pipeline.config.publisher_id
          );
          break;

        case 'podcast':
          const podcastImporter = new PodcastImporter();
          result = await podcastImporter.importPodcastFeed(
            pipeline.config.feed_url,
            pipeline.config.publisher_id
          );
          break;

        default:
          throw new Error(`Unknown pipeline type: ${pipeline.type}`);
      }

      // Update pipeline status
      await this.supabase
        .from('content_pipelines')
        .update({
          last_run: new Date().toISOString(),
          status: result.success ? 'success' : 'error',
          last_result: result
        })
        .eq('id', pipelineId);

    } catch (error) {
      result.errors.push(`Pipeline execution failed: ${error.message}`);
    }

    return result;
  }

  async createPipeline(config: {
    name: string;
    type: 'youtube' | 'rss' | 'podcast';
    config: Record<string, any>;
    schedule?: string;
  }): Promise<string> {
    const { data, error } = await this.supabase
      .from('content_pipelines')
      .insert({
        name: config.name,
        type: config.type,
        config: config.config,
        schedule: config.schedule,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    if (config.schedule) {
      await this.scheduleImport(data.id, config.schedule);
    }

    return data.id;
  }
}

// Export all classes
export {
  YouTubeContentImporter,
  RSSFeedImporter,
  PDFProcessor,
  PodcastImporter,
  ContentPipelineManager
};
