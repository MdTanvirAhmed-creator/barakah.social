# 🚀 Barakah.social Deployment Guide

## Quick Start

### **Option 1: Vercel (Recommended)**
1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Deploy**
   - Click "Deploy" and wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### **Option 2: Railway**
1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway will auto-detect Next.js

2. **Configure Environment Variables**
   - Add all required environment variables in Railway dashboard
   - Set `NEXTAUTH_URL` to your Railway domain

3. **Deploy**
   - Railway will automatically deploy on every push
   - Your app will be live at `https://your-project.railway.app`

### **Option 3: Netlify**
1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Configure Environment Variables**
   - Add all required environment variables in Netlify dashboard

3. **Deploy**
   - Netlify will automatically deploy on every push

## Database Setup

### **Supabase Production Setup**
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Run Database Migration**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run the master migration
   supabase db push
   ```

3. **Configure Authentication**
   - Enable email authentication in Supabase dashboard
   - Configure OAuth providers if needed
   - Set up email templates

## Environment Variables

### **Required Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

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
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@your-domain.com

# File Upload
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,audio/mpeg,video/mp4

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Analytics
GOOGLE_ANALYTICS_ID=your_ga_id
MIXPANEL_TOKEN=your_mixpanel_token

# Content Moderation
OPENAI_API_KEY=your_openai_api_key
MODERATION_ENABLED=true

# CDN
CDN_URL=your_cdn_url
CDN_KEY=your_cdn_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## Pre-Deployment Checklist

- [ ] **Database Migration**
  - [ ] Supabase project created
  - [ ] Master migration script executed
  - [ ] RLS policies configured
  - [ ] Authentication enabled

- [ ] **Environment Variables**
  - [ ] All required variables set
  - [ ] Production URLs configured
  - [ ] Secrets properly secured

- [ ] **Build Configuration**
  - [ ] Next.js config optimized
  - [ ] TypeScript errors resolved
  - [ ] Build process tested

- [ ] **Security**
  - [ ] HTTPS enabled
  - [ ] Security headers configured
  - [ ] Rate limiting enabled
  - [ ] CORS properly configured

- [ ] **Performance**
  - [ ] CDN configured
  - [ ] Image optimization enabled
  - [ ] Caching strategies implemented
  - [ ] Bundle size optimized

## Post-Deployment Steps

1. **Test All Features**
   - [ ] User registration/login
   - [ ] Content creation
   - [ ] Admin panel access
   - [ ] Search functionality
   - [ ] File uploads

2. **Configure Domain**
   - [ ] Custom domain added
   - [ ] SSL certificate installed
   - [ ] DNS records configured

3. **Set Up Monitoring**
   - [ ] Error tracking (Sentry)
   - [ ] Analytics (Google Analytics)
   - [ ] Performance monitoring
   - [ ] Uptime monitoring

4. **Backup Strategy**
   - [ ] Database backups enabled
   - [ ] File storage backups
   - [ ] Configuration backups

## Troubleshooting

### **Common Issues**

1. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Check environment variables

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Test database connection

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET
   - Check Supabase auth configuration
   - Test OAuth providers

4. **Performance Issues**
   - Enable CDN
   - Optimize images
   - Check bundle size
   - Monitor database queries

### **Getting Help**

- Check the [deployment-config.md](./deployment-config.md) for detailed configuration
- Review the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step process
- Check platform-specific documentation:
  - [Vercel Docs](https://vercel.com/docs)
  - [Railway Docs](https://docs.railway.app)
  - [Netlify Docs](https://docs.netlify.com)

## Success! 🎉

Once deployed, your Barakah.social platform will be live and ready for users. Remember to:

- Monitor performance and errors
- Keep dependencies updated
- Regular security audits
- User feedback collection
- Feature iteration

Your Islamic social networking platform is now ready to serve the community! 🌟
