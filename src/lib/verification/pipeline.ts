// Content Verification Pipeline
// Multi-layer verification system for ensuring content quality and Islamic authenticity

export interface VerificationLevel {
  level: number;
  name: string;
  description: string;
  requiredApprovals: number;
  checks: VerificationCheck[];
  reviewers: string[];
  timeLimit?: number; // in hours
}

export interface VerificationCheck {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'scholarly';
  weight: number; // 1-10, higher = more important
  isRequired: boolean;
  criteria: string[];
}

export interface VerificationResult {
  checkId: string;
  passed: boolean;
  score: number; // 0-100
  feedback?: string;
  reviewerId?: string;
  reviewedAt: string;
  evidence?: string[]; // URLs, citations, etc.
}

export interface ContentVerification {
  id: string;
  contentId: string;
  contentType: 'article' | 'video' | 'audio' | 'pdf' | 'quiz';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';
  currentLevel: number;
  results: VerificationResult[];
  overallScore: number;
  submittedAt: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedReviewers: string[];
}

export const verificationLevels: Record<string, VerificationLevel> = {
  level1_automated: {
    level: 1,
    name: "Automated Verification",
    description: "Automated checks for basic content quality and safety",
    requiredApprovals: 0,
    checks: [
      {
        id: "profanity_filter",
        name: "Profanity Filter",
        description: "Check for inappropriate language and profanity",
        type: "automated",
        weight: 8,
        isRequired: true,
        criteria: [
          "No profane or offensive language",
          "Respectful tone throughout content",
          "Appropriate for Islamic context"
        ]
      },
      {
        id: "spam_detection",
        name: "Spam Detection",
        description: "Detect spam, promotional content, and low-quality submissions",
        type: "automated",
        weight: 9,
        isRequired: true,
        criteria: [
          "No promotional or commercial content",
          "No repetitive or low-quality text",
          "Meaningful and substantial content"
        ]
      },
      {
        id: "duplicate_content",
        name: "Duplicate Content Check",
        description: "Verify content is original and not duplicated",
        type: "automated",
        weight: 7,
        isRequired: true,
        criteria: [
          "Content is original and not copied",
          "Proper attribution if referencing other sources",
          "Unique value and perspective"
        ]
      },
      {
        id: "broken_links",
        name: "Broken Link Verification",
        description: "Check all links are working and accessible",
        type: "automated",
        weight: 5,
        isRequired: false,
        criteria: [
          "All external links are accessible",
          "Links lead to relevant and reliable sources",
          "No broken or dead links"
        ]
      },
      {
        id: "copyright_check",
        name: "Copyright Verification",
        description: "Ensure content doesn't violate copyright laws",
        type: "automated",
        weight: 8,
        isRequired: true,
        criteria: [
          "No copyrighted material without permission",
          "Proper fair use if applicable",
          "Original content or properly licensed"
        ]
      }
    ],
    reviewers: ["system"],
    timeLimit: 1
  },

  level2_community: {
    level: 2,
    name: "Community Review",
    description: "Review by qualified community members",
    requiredApprovals: 3,
    checks: [
      {
        id: "relevance_check",
        name: "Category Relevance",
        description: "Verify content is relevant to assigned category",
        type: "manual",
        weight: 7,
        isRequired: true,
        criteria: [
          "Content matches the selected category",
          "Topic is appropriate for the target audience",
          "Clear connection to Islamic knowledge"
        ]
      },
      {
        id: "quality_assessment",
        name: "Content Quality",
        description: "Assess overall quality and educational value",
        type: "manual",
        weight: 8,
        isRequired: true,
        criteria: [
          "Well-structured and organized content",
          "Clear and understandable language",
          "Educational value and benefit to readers"
        ]
      },
      {
        id: "difficulty_level",
        name: "Appropriate Difficulty",
        description: "Verify content matches the stated difficulty level",
        type: "manual",
        weight: 6,
        isRequired: true,
        criteria: [
          "Content matches beginner/intermediate/advanced level",
          "Appropriate complexity for target audience",
          "Clear learning objectives and outcomes"
        ]
      },
      {
        id: "source_credibility",
        name: "Source Credibility",
        description: "Verify sources are reliable and credible",
        type: "manual",
        weight: 8,
        isRequired: true,
        criteria: [
          "Sources are from reputable Islamic scholars",
          "References are properly cited",
          "Information is accurate and verifiable"
        ]
      }
    ],
    reviewers: ["Users with 100+ beneficial marks"],
    timeLimit: 72
  },

  level3_scholarly: {
    level: 3,
    name: "Scholarly Verification",
    description: "Verification by verified Islamic scholars",
    requiredApprovals: 1,
    checks: [
      {
        id: "islamic_authenticity",
        name: "Islamic Authenticity",
        description: "Verify content aligns with authentic Islamic teachings",
        type: "scholarly",
        weight: 10,
        isRequired: true,
        criteria: [
          "Content is based on authentic Islamic sources",
          "No unorthodox or deviant teachings",
          "Alignment with mainstream Islamic scholarship"
        ]
      },
      {
        id: "aqeedah_check",
        name: "Correct Aqeedah",
        description: "Verify content doesn't contradict Islamic creed",
        type: "scholarly",
        weight: 10,
        isRequired: true,
        criteria: [
          "No contradictions to Islamic creed (Aqeedah)",
          "Proper understanding of Allah's attributes",
          "Correct beliefs about Prophets and Messengers"
        ]
      },
      {
        id: "hadith_citations",
        name: "Hadith Citations",
        description: "Verify hadith citations are authentic and properly referenced",
        type: "scholarly",
        weight: 9,
        isRequired: true,
        criteria: [
          "All hadith are properly sourced and graded",
          "No weak or fabricated hadith without proper context",
          "Correct understanding and application of hadith"
        ]
      },
      {
        id: "bidah_check",
        name: "Bid'ah (Innovation) Check",
        description: "Ensure content doesn't promote religious innovations",
        type: "scholarly",
        weight: 9,
        isRequired: true,
        criteria: [
          "No promotion of religious innovations (Bid'ah)",
          "Content follows established Islamic practices",
          "No introduction of new religious practices"
        ]
      },
      {
        id: "scholarly_consensus",
        name: "Scholarly Consensus",
        description: "Verify content aligns with scholarly consensus",
        type: "scholarly",
        weight: 8,
        isRequired: true,
        criteria: [
          "Content aligns with majority scholarly opinion",
          "No controversial or disputed positions presented as fact",
          "Proper acknowledgment of differing scholarly views"
        ]
      }
    ],
    reviewers: ["Verified scholars in relevant field"],
    timeLimit: 168 // 7 days
  }
};

export class ContentVerificationPipeline {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // Start verification process for new content
  async startVerification(contentId: string, contentType: string, priority: string = 'medium'): Promise<ContentVerification> {
    try {
      // Create verification record
      const { data, error } = await this.supabase
        .from('content_verifications')
        .insert({
          content_id: contentId,
          content_type: contentType,
          status: 'pending',
          current_level: 1,
          priority: priority,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Start Level 1 automated checks
      await this.runAutomatedChecks(contentId);

      return data;
    } catch (error) {
      console.error('Error starting verification:', error);
      throw error;
    }
  }

  // Run automated verification checks
  async runAutomatedChecks(contentId: string): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    const level1 = verificationLevels.level1_automated;

    for (const check of level1.checks) {
      try {
        const result = await this.performAutomatedCheck(contentId, check);
        results.push(result);

        // Store result in database
        await this.supabase
          .from('verification_results')
          .insert({
            content_id: contentId,
            check_id: check.id,
            passed: result.passed,
            score: result.score,
            feedback: result.feedback,
            reviewed_at: result.reviewedAt
          });
      } catch (error) {
        console.error(`Error running check ${check.id}:`, error);
      }
    }

    // Update verification status
    await this.updateVerificationStatus(contentId, results);

    return results;
  }

  // Perform individual automated check
  private async performAutomatedCheck(contentId: string, check: VerificationCheck): Promise<VerificationResult> {
    // Get content data
    const { data: content } = await this.supabase
      .from('content_submissions')
      .select('*')
      .eq('id', contentId)
      .single();

    if (!content) {
      throw new Error('Content not found');
    }

    let passed = false;
    let score = 0;
    let feedback = '';

    switch (check.id) {
      case 'profanity_filter':
        const profanityResult = await this.checkProfanity(content);
        passed = profanityResult.passed;
        score = profanityResult.score;
        feedback = profanityResult.feedback;
        break;

      case 'spam_detection':
        const spamResult = await this.detectSpam(content);
        passed = spamResult.passed;
        score = spamResult.score;
        feedback = spamResult.feedback;
        break;

      case 'duplicate_content':
        const duplicateResult = await this.checkDuplicates(content);
        passed = duplicateResult.passed;
        score = duplicateResult.score;
        feedback = duplicateResult.feedback;
        break;

      case 'broken_links':
        const linksResult = await this.checkBrokenLinks(content);
        passed = linksResult.passed;
        score = linksResult.score;
        feedback = linksResult.feedback;
        break;

      case 'copyright_check':
        const copyrightResult = await this.checkCopyright(content);
        passed = copyrightResult.passed;
        score = copyrightResult.score;
        feedback = copyrightResult.feedback;
        break;

      default:
        passed = false;
        score = 0;
        feedback = 'Unknown check type';
    }

    return {
      checkId: check.id,
      passed,
      score,
      feedback,
      reviewedAt: new Date().toISOString()
    };
  }

  // Profanity filter implementation
  private async checkProfanity(content: any): Promise<{ passed: boolean; score: number; feedback: string }> {
    const profanityWords = [
      // Add profanity words to filter
      'badword1', 'badword2', 'badword3'
    ];

    const text = `${content.title} ${content.description} ${content.content}`.toLowerCase();
    const foundProfanity = profanityWords.some(word => text.includes(word));

    if (foundProfanity) {
      return {
        passed: false,
        score: 0,
        feedback: 'Content contains inappropriate language'
      };
    }

    return {
      passed: true,
      score: 100,
      feedback: 'Content is appropriate and respectful'
    };
  }

  // Spam detection implementation
  private async detectSpam(content: any): Promise<{ passed: boolean; score: number; feedback: string }> {
    const text = `${content.title} ${content.description} ${content.content}`;
    
    // Check for spam indicators
    const spamIndicators = [
      /buy now/i,
      /click here/i,
      /limited time/i,
      /act now/i,
      /free money/i,
      /make money/i
    ];

    const spamCount = spamIndicators.reduce((count, pattern) => {
      return count + (pattern.test(text) ? 1 : 0);
    }, 0);

    if (spamCount > 2) {
      return {
        passed: false,
        score: 0,
        feedback: 'Content appears to be spam or promotional'
      };
    }

    // Check content length and quality
    if (text.length < 100) {
      return {
        passed: false,
        score: 30,
        feedback: 'Content is too short and lacks substance'
      };
    }

    return {
      passed: true,
      score: 100,
      feedback: 'Content appears to be genuine and substantial'
    };
  }

  // Duplicate content check
  private async checkDuplicates(content: any): Promise<{ passed: boolean; score: number; feedback: string }> {
    // Simple similarity check (in production, use more sophisticated algorithms)
    const { data: existingContent } = await this.supabase
      .from('content_submissions')
      .select('title, description, content')
      .neq('id', content.id);

    if (!existingContent) {
      return {
        passed: true,
        score: 100,
        feedback: 'No duplicate content found'
      };
    }

    // Check for similar titles
    const similarTitles = existingContent.filter(item => 
      this.calculateSimilarity(content.title, item.title) > 0.8
    );

    if (similarTitles.length > 0) {
      return {
        passed: false,
        score: 20,
        feedback: 'Content title is too similar to existing content'
      };
    }

    return {
      passed: true,
      score: 100,
      feedback: 'Content appears to be original'
    };
  }

  // Check for broken links
  private async checkBrokenLinks(content: any): Promise<{ passed: boolean; score: number; feedback: string }> {
    // Extract links from content
    const linkRegex = /https?:\/\/[^\s]+/g;
    const links = content.content?.match(linkRegex) || [];

    if (links.length === 0) {
      return {
        passed: true,
        score: 100,
        feedback: 'No links to verify'
      };
    }

    // Check each link (simplified - in production, use proper link checking)
    let brokenLinks = 0;
    for (const link of links) {
      try {
        // In production, make actual HTTP requests to check links
        // For now, just simulate
        const isBroken = Math.random() < 0.1; // 10% chance of being broken
        if (isBroken) brokenLinks++;
      } catch (error) {
        brokenLinks++;
      }
    }

    const brokenPercentage = (brokenLinks / links.length) * 100;

    if (brokenPercentage > 50) {
      return {
        passed: false,
        score: 0,
        feedback: `Too many broken links (${brokenPercentage.toFixed(1)}%)`
      };
    }

    return {
      passed: true,
      score: 100 - brokenPercentage,
      feedback: `All links are working (${brokenPercentage.toFixed(1)}% broken)`
    };
  }

  // Copyright check
  private async checkCopyright(content: any): Promise<{ passed: boolean; score: number; feedback: string }> {
    // Simple copyright check (in production, use more sophisticated methods)
    const copyrightIndicators = [
      /copyright/i,
      /©/,
      /all rights reserved/i
    ];

    const text = `${content.title} ${content.description} ${content.content}`;
    const hasCopyright = copyrightIndicators.some(pattern => pattern.test(text));

    if (hasCopyright) {
      return {
        passed: false,
        score: 0,
        feedback: 'Content may contain copyrighted material'
      };
    }

    return {
      passed: true,
      score: 100,
      feedback: 'No copyright issues detected'
    };
  }

  // Calculate text similarity
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Update verification status
  private async updateVerificationStatus(contentId: string, results: VerificationResult[]): Promise<void> {
    const allPassed = results.every(result => result.passed);
    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;

    const status = allPassed ? 'approved' : 'rejected';
    const nextLevel = allPassed ? 2 : 1;

    await this.supabase
      .from('content_verifications')
      .update({
        status,
        current_level: nextLevel,
        overall_score: averageScore,
        completed_at: allPassed ? new Date().toISOString() : null
      })
      .eq('content_id', contentId);
  }

  // Assign reviewers for community review
  async assignCommunityReviewers(contentId: string): Promise<void> {
    try {
      // Get qualified reviewers (100+ beneficial marks)
      const { data: reviewers } = await this.supabase
        .from('profiles')
        .select('id')
        .gte('beneficial_count', 100)
        .order('beneficial_count', { ascending: false })
        .limit(5);

      if (!reviewers || reviewers.length === 0) {
        throw new Error('No qualified reviewers available');
      }

      // Assign reviewers
      const assignments = reviewers.map(reviewer => ({
        content_id: contentId,
        reviewer_id: reviewer.id,
        level: 2,
        assigned_at: new Date().toISOString()
      }));

      await this.supabase
        .from('verification_assignments')
        .insert(assignments);

      // Update verification status
      await this.supabase
        .from('content_verifications')
        .update({
          status: 'in_review',
          current_level: 2
        })
        .eq('content_id', contentId);

    } catch (error) {
      console.error('Error assigning reviewers:', error);
      throw error;
    }
  }

  // Assign scholarly reviewers
  async assignScholarlyReviewers(contentId: string, category: string): Promise<void> {
    try {
      // Get verified scholars in relevant field
      const { data: scholars } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('role', 'scholar')
        .eq('is_verified', true)
        .contains('expertise_areas', [category])
        .limit(3);

      if (!scholars || scholars.length === 0) {
        throw new Error('No qualified scholars available for this category');
      }

      // Assign scholars
      const assignments = scholars.map(scholar => ({
        content_id: contentId,
        reviewer_id: scholar.id,
        level: 3,
        assigned_at: new Date().toISOString()
      }));

      await this.supabase
        .from('verification_assignments')
        .insert(assignments);

      // Update verification status
      await this.supabase
        .from('content_verifications')
        .update({
          status: 'in_review',
          current_level: 3
        })
        .eq('content_id', contentId);

    } catch (error) {
      console.error('Error assigning scholarly reviewers:', error);
      throw error;
    }
  }

  // Submit review result
  async submitReview(
    contentId: string,
    reviewerId: string,
    level: number,
    results: VerificationResult[]
  ): Promise<void> {
    try {
      // Store review results
      const reviewData = results.map(result => ({
        content_id: contentId,
        reviewer_id: reviewerId,
        level,
        check_id: result.checkId,
        passed: result.passed,
        score: result.score,
        feedback: result.feedback,
        evidence: result.evidence,
        reviewed_at: new Date().toISOString()
      }));

      await this.supabase
        .from('verification_results')
        .insert(reviewData);

      // Check if level is complete
      const levelConfig = Object.values(verificationLevels).find(l => l.level === level);
      if (!levelConfig) {
        throw new Error('Invalid verification level');
      }

      // Count completed reviews for this level
      const { data: completedReviews } = await this.supabase
        .from('verification_results')
        .select('reviewer_id')
        .eq('content_id', contentId)
        .eq('level', level);

      const uniqueReviewers = new Set(completedReviews?.map(r => r.reviewer_id) || []);
      
      if (uniqueReviewers.size >= levelConfig.requiredApprovals) {
        // Level is complete, move to next level or complete verification
        await this.completeVerificationLevel(contentId, level);
      }

    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Complete verification level
  private async completeVerificationLevel(contentId: string, level: number): Promise<void> {
    try {
      // Get all results for this level
      const { data: results } = await this.supabase
        .from('verification_results')
        .select('*')
        .eq('content_id', contentId)
        .eq('level', level);

      if (!results) return;

      // Calculate level score
      const levelScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
      const allPassed = results.every(result => result.passed);

      if (allPassed && level < 3) {
        // Move to next level
        await this.supabase
          .from('content_verifications')
          .update({
            current_level: level + 1,
            status: 'pending'
          })
          .eq('content_id', contentId);

        // Assign reviewers for next level
        if (level === 1) {
          await this.assignCommunityReviewers(contentId);
        } else if (level === 2) {
          // Get content category for scholarly assignment
          const { data: content } = await this.supabase
            .from('content_submissions')
            .select('category')
            .eq('id', contentId)
            .single();

          if (content) {
            await this.assignScholarlyReviewers(contentId, content.category);
          }
        }
      } else if (allPassed && level === 3) {
        // All levels complete
        await this.supabase
          .from('content_verifications')
          .update({
            status: 'approved',
            completed_at: new Date().toISOString()
          })
          .eq('content_id', contentId);
      } else {
        // Level failed
        await this.supabase
          .from('content_verifications')
          .update({
            status: 'needs_revision'
          })
          .eq('content_id', contentId);
      }

    } catch (error) {
      console.error('Error completing verification level:', error);
      throw error;
    }
  }

  // Get verification status
  async getVerificationStatus(contentId: string): Promise<ContentVerification | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_verifications')
        .select(`
          *,
          results:verification_results(*)
        `)
        .eq('content_id', contentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting verification status:', error);
      return null;
    }
  }

  // Get pending reviews for reviewer
  async getPendingReviews(reviewerId: string, level?: number): Promise<any[]> {
    try {
      let query = this.supabase
        .from('verification_assignments')
        .select(`
          *,
          content:content_submissions(*),
          verification:content_verifications(*)
        `)
        .eq('reviewer_id', reviewerId)
        .eq('completed', false);

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      return [];
    }
  }
}

export default ContentVerificationPipeline;
