# 🚀 **Vercel Update Guide**

## **Automatic Deployment (Recommended)**

If your Vercel project is connected to GitHub:
1. **Vercel will automatically detect the push** and start a new deployment
2. **Check your Vercel dashboard** at [vercel.com/dashboard](https://vercel.com/dashboard)
3. **Monitor the deployment** in the "Deployments" tab

## **Manual Deployment (If Needed)**

If automatic deployment isn't working:

### **Option A: Vercel CLI**
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel --prod
```

### **Option B: Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your Barakah.social project
3. Click "Deploy" or "Redeploy"

## **Environment Variables Update**

### **Required Environment Variables in Vercel:**

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add/Update these variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_SECRET=mbpA6mxXQTpzsSZr8heXrMKqoLc4w2GLsMAoyw1kgkc=
NEXTAUTH_URL=https://your-app-name.vercel.app

# Optional: Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@barakah.social

# Optional: Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Optional: Analytics
GOOGLE_ANALYTICS_ID=your_ga_id
MIXPANEL_TOKEN=your_mixpanel_token
```

## **Domain Configuration**

### **If using custom domain:**
1. **Go to Settings → Domains**
2. **Add your custom domain**
3. **Update DNS records** as instructed by Vercel

### **If using Vercel subdomain:**
- Your app will be available at: `https://your-project-name.vercel.app`
- Update Supabase redirect URLs accordingly

## **Deployment Status Check**

### **Check deployment status:**
1. **Vercel Dashboard** → Your Project → Deployments
2. **Look for the latest deployment** (should show "Ready" status)
3. **Click on the deployment** to see build logs

### **Common Issues:**
- **Build failures:** Check build logs for errors
- **Environment variables:** Ensure all required variables are set
- **Domain issues:** Verify domain configuration

## **Post-Deployment Testing**

### **Test your deployed app:**
1. **Visit your Vercel URL**
2. **Test navigation** from home page to main app
3. **Test authentication** (sign up/sign in)
4. **Test main app features** (feed, knowledge, halaqas, etc.)

## **Performance Optimization**

### **Vercel Analytics (Optional):**
1. **Enable Vercel Analytics** in project settings
2. **Monitor performance** and user behavior
3. **Optimize based on analytics data**

---

**Your Vercel deployment should be automatically updated! 🚀**
