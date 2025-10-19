# 🔗 Supabase Connection Guide

## ✅ Verifying Your Supabase Setup

You mentioned you've completed all Supabase steps. Let's verify and connect everything!

---

## 📋 **Step-by-Step Verification**

### **Step 1: Get Your Supabase Credentials**

1. **Go to your Supabase project dashboard:**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Settings → API:**
   - Click on the "Settings" icon (⚙️) in the left sidebar
   - Click on "API"

3. **Copy these values:**

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   ☝️ Copy this entire URL

   **Project API keys → anon/public:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```
   ☝️ This is a long string (200+ characters)

---

### **Step 2: Update Your .env.local File**

1. **Open `.env.local` in your project:**
   ```bash
   # In your project root
   open .env.local
   ```

2. **Replace the empty values:**
   ```bash
   # Before (current):
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_APP_URL=https://barakah.social

   # After (with your credentials):
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   ⚠️ **Important:** Use `http://localhost:3000` for local development!

3. **Save the file**

---

### **Step 3: Restart Your Development Server**

The environment variables are only loaded on server start, so we need to restart:

```bash
# Kill the current server
# Press Ctrl+C in the terminal running npm run dev

# OR if it's stuck:
pkill -f "next dev"

# Clear cache and restart
rm -rf .next && npm run dev
```

Wait for the server to start (about 10-15 seconds).

---

### **Step 4: Test the Connection**

**Visit these URLs to verify everything works:**

1. **Homepage:** http://localhost:3000
   - Should load without "Supabase not configured" warnings

2. **Signup:** http://localhost:3000/signup
   - Try to create an account
   - Use a real email (you'll receive verification email)
   - **Expected:** Account created successfully!

3. **Login:** http://localhost:3000/login
   - Login with your new account
   - **Expected:** Redirected to onboarding/welcome

4. **Check browser console:**
   - Press F12 (or Cmd+Option+I on Mac)
   - Look at Console tab
   - **Should NOT see:** "Supabase environment variables not set"
   - **Should see:** Normal logs

---

## ✅ **Verification Checklist**

### **A. Database Tables Created**

Check in Supabase Dashboard → Table Editor:

- [ ] `profiles` table exists
- [ ] `posts` table exists
- [ ] `halaqas` table exists
- [ ] `halaqa_members` table exists
- [ ] `comments` table exists
- [ ] `beneficial_marks` table exists
- [ ] `bookmarks` table exists
- [ ] `reports` table exists

**How to check:**
1. Go to Supabase Dashboard
2. Click "Table Editor" in sidebar
3. You should see all 8 tables

### **B. Storage Buckets Created**

Check in Supabase Dashboard → Storage:

- [ ] `avatars` bucket (public)
- [ ] `cover-images` bucket (public)
- [ ] `post-media` bucket (public)

**How to check:**
1. Go to Supabase Dashboard
2. Click "Storage" in sidebar
3. You should see all 3 buckets

### **C. Storage Policies Created**

For EACH bucket (`avatars`, `cover-images`, `post-media`):

- [ ] Policy: "Public access for reading"
  - Operation: SELECT
  - Policy: `true`

- [ ] Policy: "Users can upload their own files"
  - Operation: INSERT
  - Policy: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

- [ ] Policy: "Users can update their own files"
  - Operation: UPDATE
  - Policy: Same as INSERT

- [ ] Policy: "Users can delete their own files"
  - Operation: DELETE
  - Policy: Same as INSERT

**How to check:**
1. Go to Storage → Click on a bucket
2. Click "Policies" tab
3. Should see 4 policies per bucket

### **D. Authentication Configured**

Check in Supabase Dashboard → Authentication → Settings:

- [ ] Site URL: `http://localhost:3000` (for dev)
- [ ] Redirect URLs includes:
  - `http://localhost:3000/auth/callback`
- [ ] Email provider enabled
- [ ] (Optional) Google OAuth configured

**How to check:**
1. Go to Authentication → URL Configuration
2. Verify Site URL and Redirect URLs

### **E. RLS (Row Level Security) Enabled**

Check that RLS is enabled on all tables:

1. Go to Table Editor
2. Click on `profiles` table
3. Click settings icon
4. Should see "RLS enabled" ✅

Repeat for all 8 tables.

---

## 🧪 **Testing Your Connection**

### **Test 1: Check Server Logs**

After restarting the server with your credentials:

**Expected logs:**
```
✓ Ready in 2s
✓ Compiled /src/middleware in 500ms
○ Compiling / ...
✓ Compiled / in 3s
GET / 200 in 3500ms
```

**Should NOT see:**
```
Supabase environment variables not set. Using placeholder client.
```

### **Test 2: Try Signup**

1. Visit http://localhost:3000/signup
2. Fill in email and password
3. Click "Continue"

**Expected behavior:**
- ✅ Form submits
- ✅ Moves to step 2 (Mithaq/covenant)
- ✅ Email sent to inbox
- ✅ No errors in console

**If you see errors:**
- Check browser console (F12)
- Check server terminal
- Copy the error message

### **Test 3: Check Database**

After signup:

1. Go to Supabase Dashboard → Authentication → Users
2. Should see your new user account!
3. Go to Table Editor → `profiles`
4. Should see a new row with your profile

### **Test 4: Try Login**

1. Visit http://localhost:3000/login
2. Enter your credentials
3. Click "Sign In"

**Expected:**
- ✅ Redirects to welcome page
- ✅ Shows your name
- ✅ Can navigate to feed

### **Test 5: Create a Post**

1. Navigate to http://localhost:3000/feed
2. Click on "Share beneficial knowledge..." 
3. Type a post
4. Click "Post"

**Expected:**
- ✅ Post created
- ✅ Appears in feed
- ✅ Stored in database

**Verify in Supabase:**
1. Table Editor → `posts`
2. Should see your new post!

---

## 🐛 **Troubleshooting**

### **Issue: "Supabase environment variables not set"**

**Solution:**
1. Double-check `.env.local` has correct values
2. Make sure there are no extra spaces
3. Restart server completely:
   ```bash
   pkill -f "next dev"
   rm -rf .next
   npm run dev
   ```

### **Issue: "Invalid API key"**

**Solution:**
1. Go back to Supabase Dashboard → Settings → API
2. Make sure you copied the **anon/public** key (not service_role!)
3. Copy the entire key (it's very long)
4. Paste in `.env.local`

### **Issue: "Failed to create user"**

**Solution:**
1. Check Supabase Dashboard → Authentication
2. Make sure Email provider is enabled
3. Check if email confirmations are required:
   - Settings → Auth → Email Auth
   - "Enable email confirmations" toggle
4. For testing, you can disable email confirmation

### **Issue: "INSERT permission denied"**

**Solution:**
1. Go to Table Editor → Select table
2. Click "RLS disabled" badge to enable it
3. Go to SQL Editor
4. Run the RLS policies from `supabase/migrations/001_initial_schema.sql`
5. Look for sections like:
   ```sql
   -- Enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view own profile"...
   ```

### **Issue: "Storage upload failed"**

**Solution:**
1. Go to Storage
2. Click on bucket (e.g., `avatars`)
3. Click "Policies" tab
4. Add the 4 policies manually:
   - Public SELECT
   - Authenticated INSERT/UPDATE/DELETE with user check

---

## ✅ **Success Indicators**

### **You'll know it's working when:**

1. ✅ **No warnings in terminal:**
   ```
   ✓ Compiled /feed in 2s
   GET /feed 200 in 2500ms
   ```
   (No "Supabase not configured" message)

2. ✅ **Can create account:**
   - Signup works
   - User appears in Supabase Auth
   - Profile created in `profiles` table

3. ✅ **Can login:**
   - Login succeeds
   - Session persists
   - Can navigate app

4. ✅ **Can create content:**
   - Posts save to database
   - Comments work
   - Beneficial marks increment

5. ✅ **Can upload files:**
   - Avatar upload works
   - Images appear in storage bucket
   - URLs are accessible

---

## 📞 **Need Help?**

### **If you're stuck, provide:**

1. **Error message from browser console:**
   - Press F12
   - Go to Console tab
   - Copy any red errors

2. **Error message from server terminal:**
   - The terminal running `npm run dev`
   - Copy any error messages

3. **Screenshots:**
   - Supabase Dashboard (Settings → API page)
   - Browser error
   - Terminal error

4. **What you tried:**
   - Did you update `.env.local`?
   - Did you restart the server?
   - Did you run the migrations?

---

## 🎯 **Quick Test Command**

Run this to verify your setup:

```bash
# Check .env.local
echo "Checking environment variables..."
cat .env.local

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If the values are empty, you need to add them!

---

## 🚀 **Once Connected**

When Supabase is connected successfully, you can:

1. ✅ **Create real accounts** (with email verification)
2. ✅ **Login with Google** (after OAuth setup)
3. ✅ **Create posts** (saved to database)
4. ✅ **Upload images** (to Supabase Storage)
5. ✅ **Join halaqas** (real-time updates)
6. ✅ **Comment on posts** (threaded discussions)
7. ✅ **Mark beneficial** (persistent counts)
8. ✅ **Bookmark posts** (saved to your account)
9. ✅ **Edit profile** (avatar, bio, interests)
10. ✅ **Search** (real database queries)

---

## 📊 **Expected Result**

### **Before Connection:**
```
Terminal:
Supabase environment variables not set. Using placeholder client.
GET /feed 200 in 2500ms

Browser:
- Mock data showing
- Can't create account
- Can't login
```

### **After Connection:**
```
Terminal:
✓ Compiled /feed in 2s
GET /feed 200 in 2500ms

Browser:
- Real authentication works
- Database queries work
- File uploads work
- Everything persists!
```

---

## 🎊 **Your Credentials Location**

The credentials you need are here:

1. **Supabase Dashboard** → Click your project
2. **Settings** (⚙️ icon) → **API**
3. **Copy:**
   - Project URL (under "Project URL")
   - anon public key (under "Project API keys" → anon public)

**Paste into `.env.local` file in your project root!**

---

**Let me know what you see in your `.env.local` file, and I'll help verify everything is set up correctly!** 🚀

---

*Ready to connect: YES | Waiting for: Your Supabase credentials in .env.local*

