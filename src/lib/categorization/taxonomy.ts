// Intelligent Categorization System - Content Taxonomy
// Comprehensive taxonomy structure for Islamic content organization

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  subcategories?: string[];
  keywords?: string[];
  relatedCategories?: string[];
}

export interface ContentMetadata {
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Scholar";
  format: "Article" | "Video" | "Audio" | "PDF" | "Course" | "Infographic";
  duration: "< 5 min" | "5-15 min" | "15-30 min" | "30-60 min" | "> 60 min";
  language: "English" | "Arabic" | "Urdu" | "Turkish" | "Malay" | "French";
  targetAudience: "General" | "Youth" | "Adults" | "Scholars" | "Converts" | "Students";
  contentType: "Educational" | "Inspirational" | "Practical" | "Theoretical" | "Historical";
}

export interface ContentTag {
  id: string;
  name: string;
  category: string;
  weight: number; // 0-1, how strongly this tag applies
  confidence: number; // 0-1, how confident the AI is in this tag
  source: "manual" | "ai" | "auto";
}

export interface CategorizationResult {
  primaryCategory: string;
  subcategory?: string;
  tags: ContentTag[];
  confidence: number;
  suggestedCategories: string[];
  metadata: Partial<ContentMetadata>;
}

// Main Content Taxonomy
export const contentTaxonomy = {
  // Primary Categories
  mainCategories: [
    {
      id: "quran",
      name: "Qur'anic Studies",
      description: "Study and understanding of the Holy Quran",
      icon: "BookOpen",
      color: "#059669", // Green
      subcategories: [
        "Tafsir (Exegesis)",
        "Tajweed (Recitation)",
        "Memorization Techniques",
        "Sciences of Quran",
        "Quranic Arabic",
        "Stories of the Quran"
      ],
      keywords: [
        "quran", "qur'an", "tafsir", "exegesis", "tajweed", "recitation",
        "memorization", "hifz", "quranic", "arabic", "surah", "ayah",
        "verse", "chapter", "revelation", "mushaf", "qira'ah"
      ],
      relatedCategories: ["hadith", "arabic", "spirituality"]
    },
    {
      id: "hadith",
      name: "Hadith Studies",
      description: "Study of the sayings and actions of Prophet Muhammad (PBUH)",
      icon: "MessageSquare",
      color: "#7C3AED", // Purple
      subcategories: [
        "Hadith Explanation",
        "Sciences of Hadith",
        "40 Hadith Series",
        "Hadith Authentication",
        "Prophetic Biography"
      ],
      keywords: [
        "hadith", "sunnah", "prophet", "muhammad", "sahih", "bukhari",
        "muslim", "abu dawood", "tirmidhi", "nasai", "ibn majah",
        "authentic", "weak", "fabricated", "narrator", "chain"
      ],
      relatedCategories: ["quran", "fiqh", "spirituality"]
    },
    {
      id: "fiqh",
      name: "Islamic Jurisprudence",
      description: "Understanding and application of Islamic law",
      icon: "Scale",
      color: "#DC2626", // Red
      subcategories: [
        "Worship (Ibadah)",
        "Transactions (Muamalat)",
        "Family Law",
        "Contemporary Issues",
        "Comparative Fiqh",
        "Usul al-Fiqh"
      ],
      keywords: [
        "fiqh", "jurisprudence", "law", "worship", "prayer", "fasting",
        "zakat", "hajj", "halal", "haram", "permissible", "forbidden",
        "marriage", "divorce", "inheritance", "business", "contracts"
      ],
      relatedCategories: ["hadith", "aqeedah", "practical"]
    },
    {
      id: "aqeedah",
      name: "Islamic Creed",
      description: "Fundamental beliefs and theological concepts",
      icon: "Heart",
      color: "#EA580C", // Orange
      subcategories: [
        "Fundamentals of Faith",
        "Names of Allah",
        "Prophets and Messengers",
        "Afterlife",
        "Destiny (Qadr)"
      ],
      keywords: [
        "aqeedah", "creed", "belief", "faith", "iman", "allah", "god",
        "prophets", "messengers", "angels", "books", "day of judgment",
        "paradise", "hell", "destiny", "qadr", "predestination"
      ],
      relatedCategories: ["quran", "hadith", "spirituality"]
    },
    {
      id: "spirituality",
      name: "Spirituality & Character",
      description: "Personal development and spiritual growth",
      icon: "Sparkles",
      color: "#0891B2", // Cyan
      subcategories: [
        "Purification of Soul",
        "Islamic Ethics",
        "Dhikr & Dua",
        "Character Development",
        "Dealing with Trials"
      ],
      keywords: [
        "spirituality", "soul", "heart", "purification", "tazkiyah",
        "dhikr", "remembrance", "dua", "supplication", "character",
        "ethics", "morals", "patience", "gratitude", "forgiveness"
      ],
      relatedCategories: ["aqeedah", "practical", "hadith"]
    },
    {
      id: "practical",
      name: "Practical Life",
      description: "Applying Islamic principles in daily life",
      icon: "Users",
      color: "#9333EA", // Violet
      subcategories: [
        "Family & Parenting",
        "Youth Issues",
        "Convert/Revert Support",
        "Islamic Finance",
        "Health & Medicine",
        "Work & Career"
      ],
      keywords: [
        "practical", "daily", "life", "family", "parenting", "children",
        "youth", "teenagers", "converts", "reverts", "finance", "money",
        "health", "medicine", "work", "career", "education", "marriage"
      ],
      relatedCategories: ["fiqh", "spirituality", "practical"]
    },
    {
      id: "history",
      name: "Islamic History",
      description: "Historical events and figures in Islamic civilization",
      icon: "Clock",
      color: "#B45309", // Amber
      subcategories: [
        "Prophetic Era",
        "Rightly Guided Caliphs",
        "Islamic Empires",
        "Scholars & Saints",
        "Modern Islamic History"
      ],
      keywords: [
        "history", "historical", "caliphs", "companions", "sahaba",
        "tabi'een", "scholars", "ulama", "saints", "awliya", "empires",
        "civilization", "golden age", "andalusia", "baghdad", "cairo"
      ],
      relatedCategories: ["hadith", "aqeedah", "spirituality"]
    },
    {
      id: "arabic",
      name: "Arabic Language",
      description: "Learning and understanding Arabic language",
      icon: "Languages",
      color: "#16A34A", // Green
      subcategories: [
        "Arabic Grammar",
        "Vocabulary Building",
        "Classical Arabic",
        "Modern Arabic",
        "Arabic Literature"
      ],
      keywords: [
        "arabic", "language", "grammar", "nahw", "sarf", "morphology",
        "vocabulary", "words", "classical", "modern", "literature",
        "poetry", "prose", "calligraphy", "script"
      ],
      relatedCategories: ["quran", "hadith", "history"]
    }
  ],

  // Content Metadata Options
  difficulty: [
    { value: "Beginner", label: "Beginner", description: "Basic concepts, easy to understand" },
    { value: "Intermediate", label: "Intermediate", description: "Some prior knowledge required" },
    { value: "Advanced", label: "Advanced", description: "Deep understanding needed" },
    { value: "Scholar", label: "Scholar", description: "Academic level content" }
  ],

  formats: [
    { value: "Article", label: "Article", icon: "FileText" },
    { value: "Video", label: "Video", icon: "Video" },
    { value: "Audio", label: "Audio", icon: "Headphones" },
    { value: "PDF", label: "PDF", icon: "File" },
    { value: "Course", label: "Course", icon: "BookOpen" },
    { value: "Infographic", label: "Infographic", icon: "Image" }
  ],

  duration: [
    { value: "< 5 min", label: "< 5 min", description: "Quick read or watch" },
    { value: "5-15 min", label: "5-15 min", description: "Short content" },
    { value: "15-30 min", label: "15-30 min", description: "Medium length" },
    { value: "30-60 min", label: "30-60 min", description: "Long form content" },
    { value: "> 60 min", label: "> 60 min", description: "Extended content" }
  ],

  languages: [
    { value: "English", label: "English", flag: "🇺🇸" },
    { value: "Arabic", label: "العربية", flag: "🇸🇦" },
    { value: "Urdu", label: "اردو", flag: "🇵🇰" },
    { value: "Turkish", label: "Türkçe", flag: "🇹🇷" },
    { value: "Malay", label: "Bahasa Melayu", flag: "🇲🇾" },
    { value: "French", label: "Français", flag: "🇫🇷" }
  ],

  targetAudience: [
    { value: "General", label: "General", description: "All audiences" },
    { value: "Youth", label: "Youth", description: "Teenagers and young adults" },
    { value: "Adults", label: "Adults", description: "Mature audiences" },
    { value: "Scholars", label: "Scholars", description: "Academic and scholarly" },
    { value: "Converts", label: "Converts", description: "New Muslims" },
    { value: "Students", label: "Students", description: "Islamic students" }
  ],

  contentType: [
    { value: "Educational", label: "Educational", description: "Learning focused" },
    { value: "Inspirational", label: "Inspirational", description: "Motivational content" },
    { value: "Practical", label: "Practical", description: "Action-oriented" },
    { value: "Theoretical", label: "Theoretical", description: "Conceptual content" },
    { value: "Historical", label: "Historical", description: "Historical perspective" }
  ]
};

// Smart categorization rules
export const categorizationRules = {
  // Keyword-based categorization
  keywordRules: {
    quran: {
      primary: ["quran", "qur'an", "tafsir", "exegesis", "tajweed", "recitation", "memorization", "hifz"],
      secondary: ["surah", "ayah", "verse", "chapter", "revelation", "mushaf", "qira'ah"],
      weight: 1.0
    },
    hadith: {
      primary: ["hadith", "sunnah", "prophet", "muhammad", "sahih", "bukhari", "muslim"],
      secondary: ["abu dawood", "tirmidhi", "nasai", "ibn majah", "authentic", "narrator"],
      weight: 1.0
    },
    fiqh: {
      primary: ["fiqh", "jurisprudence", "law", "worship", "prayer", "fasting", "zakat", "hajj"],
      secondary: ["halal", "haram", "permissible", "forbidden", "marriage", "divorce"],
      weight: 1.0
    },
    aqeedah: {
      primary: ["aqeedah", "creed", "belief", "faith", "iman", "allah", "god"],
      secondary: ["prophets", "messengers", "angels", "books", "day of judgment", "paradise"],
      weight: 1.0
    },
    spirituality: {
      primary: ["spirituality", "soul", "heart", "purification", "tazkiyah", "dhikr"],
      secondary: ["remembrance", "dua", "supplication", "character", "ethics", "patience"],
      weight: 1.0
    },
    practical: {
      primary: ["practical", "daily", "life", "family", "parenting", "children"],
      secondary: ["youth", "converts", "finance", "health", "work", "career"],
      weight: 1.0
    }
  },

  // Content type detection
  contentTypeDetection: {
    educational: ["learn", "study", "understand", "explain", "teach", "education"],
    inspirational: ["inspire", "motivate", "encourage", "uplift", "hope", "faith"],
    practical: ["how to", "step by step", "guide", "tips", "advice", "practical"],
    theoretical: ["theory", "concept", "principle", "philosophy", "theology"],
    historical: ["history", "historical", "past", "era", "century", "timeline"]
  },

  // Difficulty assessment
  difficultyAssessment: {
    beginner: ["basic", "simple", "easy", "introduction", "beginner", "start"],
    intermediate: ["intermediate", "moderate", "some knowledge", "familiar"],
    advanced: ["advanced", "complex", "detailed", "comprehensive", "in-depth"],
    scholar: ["scholarly", "academic", "research", "thesis", "dissertation", "phd"]
  }
};

// Helper functions
export function getCategoryById(id: string): Category | undefined {
  return contentTaxonomy.mainCategories.find(cat => cat.id === id);
}

export function getSubcategories(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
}

export function getAllKeywords(): string[] {
  return contentTaxonomy.mainCategories.flatMap(cat => cat.keywords || []);
}

export function getRelatedCategories(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  return category?.relatedCategories || [];
}

export function getCategoryColor(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.color || "#6B7280";
}

export function getCategoryIcon(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.icon || "BookOpen";
}

// Content similarity scoring
export function calculateContentSimilarity(content1: string, content2: string): number {
  const words1 = content1.toLowerCase().split(/\s+/);
  const words2 = content2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Smart tag generation
export function generateSmartTags(content: string, title: string): ContentTag[] {
  const tags: ContentTag[] = [];
  const text = `${title} ${content}`.toLowerCase();
  
  // Check each category's keywords
  contentTaxonomy.mainCategories.forEach(category => {
    if (category.keywords) {
      const matchedKeywords = category.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        const confidence = Math.min(matchedKeywords.length / category.keywords.length, 1);
        const weight = confidence * 0.8; // Base weight
        
        tags.push({
          id: `${category.id}-${matchedKeywords[0]}`,
          name: matchedKeywords[0],
          category: category.id,
          weight,
          confidence,
          source: "ai"
        });
      }
    }
  });
  
  return tags.sort((a, b) => b.weight - a.weight);
}

// Auto-categorization
export function autoCategorizeContent(title: string, content: string, tags: string[] = []): CategorizationResult {
  const text = `${title} ${content} ${tags.join(' ')}`.toLowerCase();
  const results: { category: string; score: number }[] = [];
  
  // Score each category
  contentTaxonomy.mainCategories.forEach(category => {
    if (category.keywords) {
      const matchedKeywords = category.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        const score = matchedKeywords.length / category.keywords.length;
        results.push({ category: category.id, score });
      }
    }
  });
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  const primaryCategory = results[0]?.category || "general";
  const confidence = results[0]?.score || 0;
  
  // Generate smart tags
  const smartTags = generateSmartTags(content, title);
  
  // Determine metadata
  const metadata: Partial<ContentMetadata> = {};
  
  // Difficulty assessment
  if (text.includes("beginner") || text.includes("basic") || text.includes("introduction")) {
    metadata.difficulty = "Beginner";
  } else if (text.includes("advanced") || text.includes("scholarly") || text.includes("research")) {
    metadata.difficulty = "Advanced";
  } else if (text.includes("intermediate")) {
    metadata.difficulty = "Intermediate";
  }
  
  // Content type detection
  if (text.includes("learn") || text.includes("study") || text.includes("teach")) {
    metadata.contentType = "Educational";
  } else if (text.includes("inspire") || text.includes("motivate")) {
    metadata.contentType = "Inspirational";
  } else if (text.includes("how to") || text.includes("guide") || text.includes("tips")) {
    metadata.contentType = "Practical";
  }
  
  return {
    primaryCategory,
    subcategory: getSubcategories(primaryCategory)[0],
    tags: smartTags,
    confidence,
    suggestedCategories: results.slice(1, 4).map(r => r.category),
    metadata
  };
}
