# 📥 Automated Content Pipelines - Implementation Guide

## 🎯 **Overview**

The Automated Content Pipelines system enables Barakah.Social to automatically import and process content from various trusted sources, including YouTube channels, RSS feeds, podcasts, and PDF documents. This system ensures a steady flow of high-quality Islamic content while maintaining proper categorization and review processes.

## 🏗️ **System Architecture**

### **Core Components**

1. **Content Importers** - Specialized classes for different content types
2. **Pipeline Manager** - Orchestrates automated import processes
3. **Database Schema** - Stores pipeline configurations and import logs
4. **Admin Interface** - Management dashboard for pipelines and sources
5. **Scheduling System** - Automated execution based on cron-like schedules

### **Content Types Supported**

- **YouTube Videos** - Scholar channels, educational content
- **RSS Feeds** - Islamic blogs, news sites, educational platforms
- **Podcasts** - Islamic audio content, lectures, discussions
- **PDF Documents** - Books, papers, research documents

## 🔧 **Implementation Details**

### **1. YouTube Content Importer**

```typescript
class YouTubeContentImporter {
  async importChannelVideos(channelId: string, scholarId: string): Promise<ContentImportResult>
  private async extractTranscript(videoId: string): Promise<string | null>
  private extractTags(title: string, description: string): string[]
  private detectLanguage(title: string, description: string): string
  private parseDuration(duration: string): number
}
```

**Features:**
- **Channel Integration** - Connects to verified scholar YouTube channels
- **Metadata Extraction** - Title, description, duration, thumbnails
- **Transcript Processing** - Extracts transcripts when available
- **Auto-tagging** - Intelligent tagging based on content analysis
- **Language Detection** - Automatic language identification
- **Duplicate Prevention** - Checks for existing content before import

**Example Usage:**
```typescript
const youtubeImporter = new YouTubeContentImporter();
const result = await youtubeImporter.importChannelVideos(
  'UCxqXjFh7iQ1Q2Q3Q4Q5Q6Q7', // Channel ID
  'scholar-uuid' // Scholar ID
);
```

### **2. RSS Feed Importer**

```typescript
class RSSFeedImporter {
  async importFeed(feedUrl: string, publisherId: string): Promise<ContentImportResult>
  private async extractContent(url: string, html: string): Promise<string>
  private extractImages(html: string): string[]
  private extractAuthors(creator?: string, author?: string): string[]
}
```

**Features:**
- **Feed Parsing** - Processes RSS/Atom feeds
- **Content Extraction** - Cleans HTML and extracts readable text
- **Image Processing** - Extracts and attributes images
- **Author Attribution** - Identifies content authors
- **Auto-tagging** - Categorizes content based on taxonomy

**Example Usage:**
```typescript
const rssImporter = new RSSFeedImporter();
const result = await rssImporter.importFeed(
  'https://seekersguidance.org/feed/',
  'publisher-uuid'
);
```

### **3. PDF Processor**

```typescript
class PDFProcessor {
  async processPDF(file: Buffer, filename: string, scholarId?: string): Promise<ContentImportResult>
  private generateTableOfContents(text: string): string[]
  private generatePreview(text: string): string
  private extractCitations(text: string): string[]
  private extractAuthorsFromText(text: string): string[]
}
```

**Features:**
- **Text Extraction** - Extracts searchable text from PDFs
- **Table of Contents** - Generates TOC from document structure
- **Page Previews** - Creates content previews
- **Citation Extraction** - Identifies Quranic verses and references
- **Author Detection** - Extracts author information from text

**Example Usage:**
```typescript
const pdfProcessor = new PDFProcessor();
const result = await pdfProcessor.processPDF(
  fileBuffer,
  'islamic-book.pdf',
  'scholar-uuid'
);
```

### **4. Podcast Importer**

```typescript
class PodcastImporter {
  async importPodcastFeed(feedUrl: string, publisherId: string): Promise<ContentImportResult>
  private extractAudioUrl(item: any): string | null
  private async getAudioDuration(audioUrl: string | null): Promise<number | null>
  private extractShowNotes(content: string): string
  private extractEpisodeNumber(title: string): number | null
}
```

**Features:**
- **Episode Processing** - Imports podcast episodes and metadata
- **Audio File Handling** - Manages audio file URLs and streaming
- **Show Notes Extraction** - Processes episode descriptions
- **Duration Calculation** - Calculates audio duration
- **Series Organization** - Groups episodes by series

**Example Usage:**
```typescript
const podcastImporter = new PodcastImporter();
const result = await podcastImporter.importPodcastFeed(
  'https://podcast.example.com/feed.xml',
  'publisher-uuid'
);
```

## 📊 **Database Schema**

### **Content Pipelines Table**
```sql
CREATE TABLE content_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('youtube', 'rss', 'podcast', 'pdf')),
  config JSONB NOT NULL,
  schedule VARCHAR(100), -- Cron-like schedule
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'disabled')),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  last_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Content Sources Table**
```sql
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('youtube_channel', 'rss_feed', 'podcast_feed', 'file_upload')),
  source_url TEXT,
  scholar_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  publisher_id UUID REFERENCES trusted_publishers(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
  last_imported TIMESTAMP WITH TIME ZONE,
  import_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Content Import Logs Table**
```sql
CREATE TABLE content_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES content_pipelines(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error')),
  imported_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);
```

## 🎛️ **Admin Interface**

### **Pipeline Management Dashboard**
- **Pipeline Overview** - List all configured pipelines
- **Status Monitoring** - Real-time status of pipeline executions
- **Execution Controls** - Manual trigger, pause/resume pipelines
- **Schedule Management** - Configure automated schedules
- **Performance Metrics** - Import statistics and success rates

### **Content Sources Management**
- **Source Configuration** - Add/edit content sources
- **Quality Scoring** - Set quality scores for sources
- **Auto-approval Settings** - Configure automatic content approval
- **Import Statistics** - Track import counts and success rates

### **Key Features**
- **Real-time Monitoring** - Live status updates
- **Bulk Operations** - Manage multiple pipelines simultaneously
- **Error Handling** - Detailed error reporting and resolution
- **Performance Analytics** - Import speed and success metrics

## ⚙️ **Configuration Examples**

### **YouTube Channel Pipeline**
```json
{
  "name": "Dr. Yasir Qadhi YouTube",
  "type": "youtube",
  "config": {
    "channel_id": "UCxqXjFh7iQ1Q2Q3Q4Q5Q6Q7",
    "scholar_id": "scholar-uuid",
    "auto_approve": true,
    "quality_score": 95
  },
  "schedule": "daily"
}
```

### **RSS Feed Pipeline**
```json
{
  "name": "Islamic RSS Feeds",
  "type": "rss",
  "config": {
    "feeds": [
      "https://seekersguidance.org/feed/",
      "https://yaqeeninstitute.org/feed/"
    ],
    "auto_approve": true,
    "quality_score": 98
  },
  "schedule": "daily"
}
```

### **Podcast Pipeline**
```json
{
  "name": "Islamic Podcasts",
  "type": "podcast",
  "config": {
    "feeds": [
      "https://podcast.example.com/feed.xml"
    ],
    "auto_approve": false,
    "quality_score": 85
  },
  "schedule": "weekly"
}
```

## 🔄 **Automated Scheduling**

### **Schedule Types**
- **Hourly** - Import content every hour
- **Daily** - Import content once per day
- **Weekly** - Import content once per week
- **Manual** - Trigger imports manually only

### **Cron-like Syntax**
```javascript
// Examples of schedule configurations
"0 */6 * * *"    // Every 6 hours
"0 0 * * *"      // Daily at midnight
"0 0 * * 0"      // Weekly on Sunday
"0 0 1 * *"      // Monthly on the 1st
```

## 📈 **Performance Monitoring**

### **Import Statistics**
- **Total Imports** - Number of content items imported
- **Success Rate** - Percentage of successful imports
- **Error Rate** - Percentage of failed imports
- **Average Duration** - Time taken for import processes
- **Content Quality** - Quality scores of imported content

### **Pipeline Health**
- **Last Run Status** - Success/failure of last execution
- **Next Scheduled Run** - When the next import will occur
- **Error Logs** - Detailed error information
- **Performance Metrics** - Speed and efficiency metrics

## 🛡️ **Quality Control**

### **Auto-approval System**
- **Scholar Content** - Auto-approve content from verified scholars
- **Quality Thresholds** - Set minimum quality scores for auto-approval
- **Source Verification** - Verify content sources before import
- **Duplicate Detection** - Prevent duplicate content imports

### **Content Review Process**
- **Manual Review** - Human review for non-auto-approved content
- **Quality Scoring** - Rate content quality (0-100)
- **Categorization** - Automatic content categorization
- **Tag Management** - Intelligent tag assignment

## 🚀 **Getting Started**

### **1. Set Up Environment Variables**
```bash
# YouTube API Key
YOUTUBE_API_KEY=your_youtube_api_key

# Database connection (already configured)
DATABASE_URL=your_database_url
```

### **2. Install Required Dependencies**
```bash
npm install googleapis rss-parser pdf-parse fluent-ffmpeg
```

### **3. Run Database Migration**
```bash
# Apply the content pipelines migration
supabase db push
```

### **4. Configure Content Sources**
1. Navigate to `/admin/pipelines`
2. Click "New Source" to add content sources
3. Configure quality scores and auto-approval settings
4. Test the source connection

### **5. Create Content Pipelines**
1. Click "New Pipeline" to create import pipelines
2. Select the pipeline type (YouTube, RSS, Podcast, PDF)
3. Configure the pipeline settings
4. Set up automated scheduling
5. Test the pipeline execution

## 📋 **Best Practices**

### **Content Source Management**
- **Verify Sources** - Ensure content sources are reputable and reliable
- **Quality Scoring** - Set appropriate quality scores for different sources
- **Regular Monitoring** - Monitor import success rates and adjust settings
- **Source Diversity** - Import from diverse, high-quality sources

### **Pipeline Configuration**
- **Appropriate Scheduling** - Don't overwhelm sources with too frequent imports
- **Error Handling** - Configure proper error handling and retry logic
- **Resource Management** - Monitor system resources during imports
- **Content Validation** - Validate imported content before approval

### **Quality Assurance**
- **Regular Audits** - Periodically review imported content quality
- **User Feedback** - Monitor user feedback on imported content
- **Content Updates** - Keep content sources and configurations updated
- **Performance Optimization** - Optimize import processes for efficiency

## 🔧 **Troubleshooting**

### **Common Issues**

#### **YouTube API Quota Exceeded**
- **Solution**: Implement rate limiting and quota management
- **Prevention**: Monitor API usage and implement backoff strategies

#### **RSS Feed Parsing Errors**
- **Solution**: Implement robust error handling for malformed feeds
- **Prevention**: Validate feed URLs before adding to pipelines

#### **PDF Processing Failures**
- **Solution**: Implement fallback processing for corrupted PDFs
- **Prevention**: Validate PDF files before processing

#### **Podcast Audio Issues**
- **Solution**: Implement audio file validation and error handling
- **Prevention**: Test audio URLs before processing

### **Performance Issues**

#### **Slow Import Processes**
- **Solution**: Implement parallel processing and caching
- **Monitoring**: Track import duration and optimize bottlenecks

#### **High Memory Usage**
- **Solution**: Implement streaming processing for large files
- **Monitoring**: Monitor memory usage during imports

#### **Database Connection Issues**
- **Solution**: Implement connection pooling and retry logic
- **Monitoring**: Monitor database connection health

## 📊 **Analytics and Reporting**

### **Import Analytics**
- **Content Volume** - Track total content imported over time
- **Source Performance** - Analyze performance by content source
- **Quality Metrics** - Monitor content quality scores
- **User Engagement** - Track user interaction with imported content

### **Pipeline Performance**
- **Execution Times** - Monitor pipeline execution duration
- **Success Rates** - Track pipeline success and failure rates
- **Error Analysis** - Analyze and categorize import errors
- **Resource Usage** - Monitor system resource consumption

## 🎯 **Future Enhancements**

### **Planned Features**
- **AI Content Analysis** - Advanced AI-powered content analysis
- **Multi-language Support** - Enhanced language detection and processing
- **Content Recommendations** - AI-powered content recommendations
- **Advanced Scheduling** - More sophisticated scheduling options
- **Real-time Monitoring** - Live pipeline monitoring dashboard
- **Content Analytics** - Advanced content performance analytics

### **Integration Opportunities**
- **Social Media** - Import from Islamic social media accounts
- **News Aggregators** - Integration with Islamic news sources
- **Academic Databases** - Import from academic Islamic databases
- **Translation Services** - Automatic content translation
- **Content Syndication** - Syndicate content to other platforms

---

**Status:** ✅ **Implementation Complete**
**Last Updated:** December 2024
**Version:** 1.0.0

The Automated Content Pipelines system is now fully integrated into Barakah.Social, providing comprehensive content acquisition and management capabilities for the Al-Hikmah Knowledge Hub! 📥✨
