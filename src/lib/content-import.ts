import { createClient } from "@/lib/supabase/client";

export interface ImportedContent {
  id: string;
  publisher_id: string;
  original_url: string;
  title: string;
  description?: string;
  content_type: "article" | "video" | "audio" | "book" | "pdf";
  authors: string[];
  tags: string[];
  language: string;
  import_date: string;
  review_status: "auto_approved" | "pending_review" | "approved" | "rejected";
  reviewer_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  content_data?: Record<string, any>;
  file_url?: string;
  thumbnail_url?: string;
  duration?: number;
  word_count?: number;
  reading_time?: number;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  view_count: number;
  like_count: number;
  share_count: number;
  quality_rating: number;
}

export interface PublisherAPIResponse {
  success: boolean;
  data: {
    content: Array<{
      id: string;
      title: string;
      description?: string;
      content_type: string;
      authors: string[];
      tags: string[];
      language: string;
      url: string;
      published_date: string;
      metadata?: Record<string, any>;
    }>;
    pagination?: {
      page: number;
      total_pages: number;
      total_items: number;
    };
  };
  error?: string;
}

export class ContentImportService {
  private supabase = createClient();

  /**
   * Import content from a trusted publisher
   */
  async importFromPublisher(
    publisherId: string,
    options: {
      limit?: number;
      offset?: number;
      contentTypes?: string[];
      languages?: string[];
      since?: string;
    } = {}
  ): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      // Get publisher information
      const { data: publisher, error: publisherError } = await this.supabase
        .from("trusted_publishers")
        .select("*")
        .eq("id", publisherId)
        .single();

      if (publisherError || !publisher) {
        throw new Error(`Publisher not found: ${publisherError?.message}`);
      }

      if (publisher.verification_status !== "approved") {
        throw new Error("Publisher is not approved for content import");
      }

      if (!publisher.api_endpoint) {
        throw new Error("Publisher does not have API endpoint configured");
      }

      // Create import job
      const { data: job, error: jobError } = await this.supabase
        .from("content_import_jobs")
        .insert({
          publisher_id: publisherId,
          job_type: "scheduled_import",
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create import job: ${jobError.message}`);
      }

      // Fetch content from publisher API
      const apiResponse = await this.fetchContentFromAPI(publisher, options);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || "Failed to fetch content from publisher API");
      }

      const contentItems = apiResponse.data.content;
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process each content item
      for (const item of contentItems) {
        try {
          await this.processContentItem(item, publisherId);
          imported++;
        } catch (error) {
          failed++;
          errors.push(`Failed to import "${item.title}": ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Update import job
      await this.supabase
        .from("content_import_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          total_items: contentItems.length,
          processed_items: imported,
          failed_items: failed,
        })
        .eq("id", job.id);

      // Update publisher last import time
      await this.supabase
        .from("trusted_publishers")
        .update({ last_import: new Date().toISOString() })
        .eq("id", publisherId);

      return {
        success: true,
        imported,
        failed,
        errors,
      };

    } catch (error) {
      console.error("Content import error:", error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Fetch content from publisher API
   */
  private async fetchContentFromAPI(
    publisher: any,
    options: {
      limit?: number;
      offset?: number;
      contentTypes?: string[];
      languages?: string[];
      since?: string;
    }
  ): Promise<PublisherAPIResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset.toString());
      if (options.contentTypes?.length) params.append("content_types", options.contentTypes.join(","));
      if (options.languages?.length) params.append("languages", options.languages.join(","));
      if (options.since) params.append("since", options.since);

      const url = `${publisher.api_endpoint}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${publisher.api_key}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };

    } catch (error) {
      return {
        success: false,
        data: { content: [] },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process individual content item
   */
  private async processContentItem(item: any, publisherId: string): Promise<void> {
    // Check if content already exists
    const { data: existing } = await this.supabase
      .from("imported_content")
      .select("id")
      .eq("original_url", item.url)
      .single();

    if (existing) {
      throw new Error("Content already exists");
    }

    // Calculate reading time and word count
    const wordCount = this.calculateWordCount(item.description || "");
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

    // Determine review status based on publisher quality score
    const { data: publisher } = await this.supabase
      .from("trusted_publishers")
      .select("quality_score")
      .eq("id", publisherId)
      .single();

    const reviewStatus = publisher?.quality_score >= 90 ? "auto_approved" : "pending_review";

    // Insert content
    const { error } = await this.supabase
      .from("imported_content")
      .insert({
        publisher_id: publisherId,
        original_url: item.url,
        title: item.title,
        description: item.description,
        content_type: item.content_type,
        authors: item.authors || [],
        tags: item.tags || [],
        language: item.language || "en",
        content_data: item.metadata || {},
        word_count: wordCount,
        reading_time: readingTime,
        review_status: reviewStatus,
        is_published: reviewStatus === "auto_approved",
        published_at: reviewStatus === "auto_approved" ? new Date().toISOString() : null,
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Calculate word count from text
   */
  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get import job status
   */
  async getImportJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    total: number;
    processed: number;
    failed: number;
  } | null> {
    try {
      const { data: job, error } = await this.supabase
        .from("content_import_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error || !job) {
        return null;
      }

      const progress = job.total_items > 0 ? (job.processed_items / job.total_items) * 100 : 0;

      return {
        status: job.status,
        progress: Math.round(progress),
        total: job.total_items,
        processed: job.processed_items,
        failed: job.failed_items,
      };
    } catch (error) {
      console.error("Error getting import job status:", error);
      return null;
    }
  }

  /**
   * Get content review queue
   */
  async getContentReviewQueue(limit: number = 50): Promise<ImportedContent[]> {
    try {
      const { data, error } = await this.supabase
        .from("imported_content")
        .select(`
          *,
          trusted_publishers!inner(name, website)
        `)
        .in("review_status", ["pending_review", "auto_approved"])
        .order("import_date", { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch review queue: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error getting content review queue:", error);
      return [];
    }
  }

  /**
   * Review content item
   */
  async reviewContent(
    contentId: string,
    action: "approve" | "reject",
    reviewerId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("imported_content")
        .update({
          review_status: action === "approve" ? "approved" : "rejected",
          reviewer_id: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
          is_published: action === "approve",
          published_at: action === "approve" ? new Date().toISOString() : null,
        })
        .eq("id", contentId);

      if (error) {
        throw new Error(`Failed to review content: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Error reviewing content:", error);
      return false;
    }
  }

  /**
   * Get publisher statistics
   */
  async getPublisherStats(publisherId: string): Promise<{
    total_content: number;
    published_content: number;
    pending_content: number;
    average_rating: number;
    total_views: number;
    total_likes: number;
    total_shares: number;
  } | null> {
    try {
      const { data, error } = await this.supabase
        .from("imported_content")
        .select("is_published, review_status, quality_rating, view_count, like_count, share_count")
        .eq("publisher_id", publisherId);

      if (error) {
        throw new Error(`Failed to fetch publisher stats: ${error.message}`);
      }

      if (!data) return null;

      const stats = {
        total_content: data.length,
        published_content: data.filter(item => item.is_published).length,
        pending_content: data.filter(item => item.review_status === "pending_review").length,
        average_rating: data.length > 0 ? data.reduce((sum, item) => sum + (item.quality_rating || 0), 0) / data.length : 0,
        total_views: data.reduce((sum, item) => sum + (item.view_count || 0), 0),
        total_likes: data.reduce((sum, item) => sum + (item.like_count || 0), 0),
        total_shares: data.reduce((sum, item) => sum + (item.share_count || 0), 0),
      };

      return stats;
    } catch (error) {
      console.error("Error getting publisher stats:", error);
      return null;
    }
  }

  /**
   * Schedule automatic imports for all approved publishers
   */
  async scheduleAutomaticImports(): Promise<void> {
    try {
      const { data: publishers, error } = await this.supabase
        .from("trusted_publishers")
        .select("*")
        .eq("verification_status", "approved")
        .not("api_endpoint", "is", null)
        .in("import_schedule", ["daily", "weekly", "monthly"]);

      if (error) {
        throw new Error(`Failed to fetch publishers: ${error.message}`);
      }

      if (!publishers) return;

      for (const publisher of publishers) {
        const shouldImport = this.shouldImport(publisher);
        
        if (shouldImport) {
          // Create import job
          await this.supabase
            .from("content_import_jobs")
            .insert({
              publisher_id: publisher.id,
              job_type: "scheduled_import",
              status: "pending",
            });

          // Update last import time
          await this.supabase
            .from("trusted_publishers")
            .update({ last_import: new Date().toISOString() })
            .eq("id", publisher.id);
        }
      }
    } catch (error) {
      console.error("Error scheduling automatic imports:", error);
    }
  }

  /**
   * Check if publisher should import content based on schedule
   */
  private shouldImport(publisher: any): boolean {
    if (!publisher.last_import) return true;

    const lastImport = new Date(publisher.last_import);
    const now = new Date();
    const daysSinceLastImport = Math.floor((now.getTime() - lastImport.getTime()) / (1000 * 60 * 60 * 24));

    switch (publisher.import_schedule) {
      case "daily":
        return daysSinceLastImport >= 1;
      case "weekly":
        return daysSinceLastImport >= 7;
      case "monthly":
        return daysSinceLastImport >= 30;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const contentImportService = new ContentImportService();
