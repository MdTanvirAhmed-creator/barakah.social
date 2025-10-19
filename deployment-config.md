# 🚀 Barakah.social Deployment Configuration

## Environment Variables Required

### **Required Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration
DATABASE_URL=your_database_url_here

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### **Optional Variables**
```bash
# Email Configuration
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_user_here
SMTP_PASS=your_smtp_password_here
SMTP_FROM=noreply@barakah.social

# File Upload
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,audio/mpeg,video/mp4

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Analytics
GOOGLE_ANALYTICS_ID=your_ga_id_here
MIXPANEL_TOKEN=your_mixpanel_token_here

# Content Moderation
OPENAI_API_KEY=your_openai_api_key_here
MODERATION_ENABLED=true

# CDN
CDN_URL=your_cdn_url_here
CDN_KEY=your_cdn_key_here

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_GUEST_ACCESS=false
ENABLE_CONTENT_REVIEW=true
ENABLE_TWO_FACTOR=true
ENABLE_RATE_LIMITING=true
ENABLE_NOTIFICATIONS=true
ENABLE_ANALYTICS=true
ENABLE_MODERATION=true
```

## Deployment Platforms

### **1. Vercel (Recommended)**
- **Pros**: Excellent Next.js support, automatic deployments, edge functions
- **Setup**: Connect GitHub repo, add environment variables
- **Cost**: Free tier available, scales with usage

### **2. Netlify**
- **Pros**: Great for static sites, form handling, edge functions
- **Setup**: Connect GitHub repo, add environment variables
- **Cost**: Free tier available, scales with usage

### **3. Railway**
- **Pros**: Full-stack support, database hosting, simple deployment
- **Setup**: Connect GitHub repo, add environment variables
- **Cost**: Pay-as-you-go pricing

### **4. DigitalOcean App Platform**
- **Pros**: Full control, scalable, cost-effective
- **Setup**: Connect GitHub repo, configure build settings
- **Cost**: Starting at $5/month

## Build Configuration

### **Next.js Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-supabase-url.supabase.co'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Enable compression
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Enable static optimization
  output: 'standalone',
}

module.exports = nextConfig
```

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Database Setup

### **Supabase Production Setup**
1. Create new Supabase project
2. Run migration scripts
3. Set up RLS policies
4. Configure authentication
5. Set up storage buckets

### **Database Migration**
```bash
# Run the master migration script
supabase db reset
supabase db push
```

## Security Checklist

- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Enable backup
- [ ] Configure CDN
- [ ] Set up error tracking
- [ ] Enable security headers

## Performance Optimization

- [ ] Enable compression
- [ ] Set up CDN
- [ ] Optimize images
- [ ] Enable caching
- [ ] Set up monitoring
- [ ] Configure load balancing
- [ ] Enable database indexing
- [ ] Set up query optimization

## Monitoring & Analytics

### **Essential Monitoring**
- Application performance
- Error tracking
- User analytics
- Database performance
- Security monitoring

### **Recommended Tools**
- Sentry (error tracking)
- Google Analytics (user analytics)
- Supabase Analytics (database)
- Vercel Analytics (performance)

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] CDN configured
- [ ] Monitoring set up
- [ ] Backup configured
- [ ] Security headers enabled
- [ ] Performance optimized
- [ ] Testing completed
