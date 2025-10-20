# 🔧 **Supabase Production Configuration Guide**

## ⚠️ **CRITICAL: Update Supabase Settings Before Deployment**

You **MUST** update your Supabase project settings before deploying to production. The localhost URLs will not work in production.

## 📋 **Step-by-Step Configuration**

### **1. Access Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Barakah.social project

### **2. Update Authentication Settings**

#### **Navigate to Authentication:**
- Go to **Authentication** → **URL Configuration**

#### **Update Site URL:**
```
Current: http://localhost:3000
New: https://your-app-name.vercel.app
```

#### **Update Redirect URLs:**
Add these URLs to your redirect list:
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/signin
https://your-app-name.vercel.app/auth/signup
https://your-app-name.vercel.app/dashboard
```

### **3. Update Email Templates (Optional)**

#### **Navigate to Authentication → Email Templates**

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

### **4. Update RLS Policies (If Needed)**

If you have any RLS policies that reference localhost, update them:

```sql
-- Example: Update any policies that might reference localhost
UPDATE auth.policies 
SET definition = REPLACE(definition, 'localhost:3000', 'your-app-name.vercel.app')
WHERE definition LIKE '%localhost%';
```

### **5. Test Your Configuration**

#### **Before Deployment:**
1. Update your local `.env.local` with production URLs temporarily
2. Test authentication flows locally
3. Verify all redirects work correctly

#### **After Deployment:**
1. Test signup flow
2. Test login flow
3. Test password reset
4. Test email confirmations

## 🔐 **Security Considerations**

### **Environment Variables:**
- Never commit production URLs to version control
- Use Vercel's environment variable system for production secrets
- Rotate your Supabase service role key if it's been exposed

### **Domain Configuration:**
- Ensure your Vercel domain is properly configured
- Consider setting up a custom domain for production
- Update CORS settings if needed

## 📝 **Checklist**

- [ ] Site URL updated to production domain
- [ ] Redirect URLs added for production
- [ ] Email templates updated (if using custom templates)
- [ ] RLS policies checked for localhost references
- [ ] Environment variables configured in Vercel
- [ ] Authentication flows tested in production

## 🚨 **Common Issues**

### **Issue 1: "Invalid redirect URL"**
**Solution:** Ensure all redirect URLs are added to Supabase settings

### **Issue 2: "Site URL mismatch"**
**Solution:** Update the Site URL in Supabase to match your Vercel domain

### **Issue 3: "CORS errors"**
**Solution:** Check that your domain is properly configured in Supabase

## 📞 **Need Help?**

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify all URLs are correctly formatted
3. Ensure no trailing slashes in URLs
4. Test with a fresh browser session

---

**Remember:** Always test your authentication flows after updating Supabase settings!
