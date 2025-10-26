# 🔧 **Supabase Production Update Steps**

## **⚠️ CRITICAL: Update Supabase Settings Before Testing**

You **MUST** update your Supabase project settings for production deployment.

## **Step 1: Access Supabase Dashboard**

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign in to your account**
3. **Select your Barakah.social project**

## **Step 2: Update Authentication Settings**

### **Navigate to Authentication:**
- Go to **Authentication** → **URL Configuration**

### **Update Site URL:**
```
Current: http://localhost:3000
New: https://your-app-name.vercel.app
```

### **Update Redirect URLs:**
Add these URLs to your redirect list:
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/signin
https://your-app-name.vercel.app/auth/signup
https://your-app-name.vercel.app/dashboard
https://your-app-name.vercel.app/feed
```

## **Step 3: Update Email Templates (Optional)**

### **Navigate to Authentication → Email Templates**

Update the following templates with your production domain:

#### **Confirm Signup Template:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### **Reset Password Template:**
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
```

## **Step 4: Database Migration (If Needed)**

### **If you haven't run the master migration yet:**

1. **Go to SQL Editor** in your Supabase dashboard
2. **Run the MASTER_MIGRATION_SCRIPT.sql** file
3. **Verify all tables are created** in the Table Editor

### **Check Migration Status:**
- **Go to Database → Tables**
- **Verify these key tables exist:**
  - `profiles`
  - `content_submissions`
  - `halaqas`
  - `companions`
  - `learning_paths`
  - `trusted_publishers`

## **Step 5: Update RLS Policies (If Needed)**

### **Check Row Level Security:**
1. **Go to Authentication → Policies**
2. **Verify RLS is enabled** for all tables
3. **Check that policies are properly configured**

### **Test RLS Policies:**
```sql
-- Test if RLS is working
SELECT * FROM profiles LIMIT 1;
```

## **Step 6: Update API Keys (If Needed)**

### **Check API Keys:**
1. **Go to Settings → API**
2. **Copy your current keys:**
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret!)

### **Update Vercel Environment Variables:**
Make sure these match your Supabase project:
```
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

## **Step 7: Test Supabase Connection**

### **Test from Vercel:**
1. **Visit your deployed Vercel app**
2. **Try to sign up/sign in**
3. **Check if authentication works**
4. **Test database operations**

### **Check Supabase Logs:**
1. **Go to Logs in Supabase dashboard**
2. **Look for any errors** during authentication
3. **Check API request logs**

## **Step 8: Security Checklist**

### **Verify Security Settings:**
- [ ] **Site URL updated** to production domain
- [ ] **Redirect URLs added** for production
- [ ] **RLS policies enabled** for all tables
- [ ] **API keys are secure** (service_role key not exposed)
- [ ] **Email templates updated** (if using custom templates)

## **Common Issues & Solutions**

### **Issue 1: "Invalid redirect URL"**
**Solution:** Add all production URLs to Supabase redirect settings

### **Issue 2: "Site URL mismatch"**
**Solution:** Update Site URL in Supabase to match your Vercel domain

### **Issue 3: "CORS errors"**
**Solution:** Check that your domain is properly configured in Supabase

### **Issue 4: "Database connection failed"**
**Solution:** Verify API keys in Vercel environment variables

## **Post-Update Testing**

### **Test Authentication Flow:**
1. **Sign up** with a new account
2. **Sign in** with existing account
3. **Password reset** functionality
4. **Email confirmation** (if enabled)

### **Test Database Operations:**
1. **Create a profile** after signup
2. **Access main app features**
3. **Test data persistence**

---

**Your Supabase configuration is now ready for production! 🔧**
