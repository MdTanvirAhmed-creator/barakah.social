# 🚀 Deploy Barakah.social to Vercel

## **Quick Deployment Steps**

### **1. Prepare Your Repository**
- ✅ Ensure all code is committed to GitHub
- ✅ Fix any TypeScript errors (optional for deployment)
- ✅ Test locally with `npm run dev`

### **2. Deploy to Vercel**

#### **Option A: Vercel Dashboard (Recommended)**
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your Barakah.social repository**
5. **Vercel will auto-detect Next.js settings**
6. **Click "Deploy"**

#### **Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: barakah-social
# - Directory: ./
# - Override settings? No
```

### **3. Configure Environment Variables**

In your Vercel dashboard, go to **Settings > Environment Variables** and add:

#### **Required Variables**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-project.vercel.app
```

#### **Optional Variables**
```bash
# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@barakah.social

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Analytics
GOOGLE_ANALYTICS_ID=your_ga_id
MIXPANEL_TOKEN=your_mixpanel_token

# Content Moderation
OPENAI_API_KEY=your_openai_api_key
MODERATION_ENABLED=true

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### **4. Database Setup**

#### **Supabase Production Setup**
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and API keys

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
   - Enable email authentication
   - Set up OAuth providers if needed
   - Configure email templates

### **5. Post-Deployment Configuration**

#### **Domain Setup**
1. **Custom Domain (Optional)**
   - Go to Vercel dashboard > Settings > Domains
   - Add your custom domain
   - Configure DNS records

2. **Update Environment Variables**
   - Update `NEXTAUTH_URL` to your custom domain
   - Update Supabase settings if needed

#### **SSL & Security**
- ✅ Vercel provides automatic SSL certificates
- ✅ Security headers are configured in `next.config.mjs`
- ✅ CORS is properly configured

### **6. Testing Your Deployment**

#### **Test Checklist**
- [ ] **Homepage loads**: `https://your-project.vercel.app`
- [ ] **Admin panel**: `https://your-project.vercel.app/admin`
- [ ] **All admin pages work**:
  - Publishers: `/admin/publishers`
  - Scholars: `/admin/scholars`
  - Reports: `/admin/reports`
  - Settings: `/admin/settings`
  - Content Review: `/admin/content-review`
- [ ] **Database connection works**
- [ ] **Authentication works** (if configured)

### **7. Monitoring & Analytics**

#### **Vercel Analytics**
- Enable Vercel Analytics in dashboard
- Monitor performance and errors
- Track user behavior

#### **External Monitoring**
- Set up Sentry for error tracking
- Configure Google Analytics
- Monitor database performance

### **8. Continuous Deployment**

#### **Automatic Deployments**
- ✅ Every push to main branch triggers deployment
- ✅ Preview deployments for pull requests
- ✅ Automatic rollback on deployment failures

#### **Environment Management**
- **Production**: `main` branch
- **Preview**: All other branches
- **Development**: Local development

## **🎉 Success!**

Your Barakah.social platform is now live on Vercel! 

### **Next Steps**
1. **Test all features**
2. **Configure custom domain**
3. **Set up monitoring**
4. **Launch to users**

### **Useful Links**
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)

### **Support**
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
- Review [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md) for configuration options
- See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for project status

---

**Your Islamic social networking platform is ready to serve the community! 🌟**
