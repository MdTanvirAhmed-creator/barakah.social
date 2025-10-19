/**
 * Application configuration and feature flags
 * Centralized config for different environments
 */

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Application URLs
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: 'Barakah.Social',
    description: 'A modern Islamic social platform for meaningful connections',
  },

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    isConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  },

  // Feature Flags
  features: {
    debates: process.env.NEXT_PUBLIC_ENABLE_DEBATES !== 'false',
    knowledgeLibrary: process.env.NEXT_PUBLIC_ENABLE_KNOWLEDGE_LIBRARY !== 'false',
    islamicTools: process.env.NEXT_PUBLIC_ENABLE_ISLAMIC_TOOLS !== 'false',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    sentry: process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true',
  },

  // Analytics
  analytics: {
    plausible: {
      domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
      enabled: !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    },
    google: {
      id: process.env.NEXT_PUBLIC_GA_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_GA_ID,
    },
  },

  // Error Tracking
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production',
    environment: process.env.NODE_ENV || 'development',
  },

  // API Limits
  limits: {
    postMaxLength: 2000,
    commentMaxLength: 500,
    bioMaxLength: 500,
    usernameMinLength: 3,
    usernameMaxLength: 30,
    passwordMinLength: 8,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxImagesPerPost: 4,
  },

  // Pagination
  pagination: {
    postsPerPage: 10,
    commentsPerPage: 20,
    halaqasPerPage: 12,
    knowledgePerPage: 12,
    searchResultsPerPage: 20,
  },

  // Cache TTL (in seconds)
  cache: {
    posts: 60, // 1 minute
    profiles: 300, // 5 minutes
    halaqas: 600, // 10 minutes
    knowledge: 3600, // 1 hour
    static: 86400, // 24 hours
  },

  // Social Links
  social: {
    twitter: 'https://twitter.com/barakahsocial',
    facebook: 'https://facebook.com/barakahsocial',
    instagram: 'https://instagram.com/barakahsocial',
    github: 'https://github.com/barakahsocial',
  },

  // Contact
  contact: {
    email: 'contact@barakah.social',
    support: 'support@barakah.social',
  },
} as const;

/**
 * Get environment-specific configuration
 */
export function getEnvConfig() {
  switch (config.env) {
    case 'production':
      return {
        apiUrl: config.app.url,
        enableAnalytics: true,
        enableSentry: true,
        enableDebugTools: false,
      };
    case 'development':
      return {
        apiUrl: 'http://localhost:3000',
        enableAnalytics: false,
        enableSentry: false,
        enableDebugTools: true,
      };
    case 'test':
      return {
        apiUrl: 'http://localhost:3000',
        enableAnalytics: false,
        enableSentry: false,
        enableDebugTools: false,
      };
    default:
      return {
        apiUrl: config.app.url,
        enableAnalytics: false,
        enableSentry: false,
        enableDebugTools: true,
      };
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof config.features): boolean {
  return config.features[feature];
}

/**
 * Validate configuration on app start
 */
export function validateConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Supabase config
  if (!config.supabase.isConfigured && config.isProd) {
    errors.push('Supabase configuration is missing in production');
  }

  if (!config.supabase.isConfigured && config.isDev) {
    warnings.push('Supabase not configured - using placeholder client');
  }

  // Check app URL
  if (!config.app.url) {
    warnings.push('NEXT_PUBLIC_APP_URL is not set');
  }

  // Log results
  if (errors.length > 0) {
    console.error('❌ Configuration Errors:', errors);
    if (config.isProd) {
      throw new Error('Invalid configuration for production');
    }
  }

  if (warnings.length > 0 && config.isDev) {
    console.warn('⚠️  Configuration Warnings:', warnings);
  }

  if (errors.length === 0 && warnings.length === 0 && config.isDev) {
    console.log('✅ Configuration validated successfully');
  }

  return { errors, warnings };
}

