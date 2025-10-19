# Storage Policy Error - FIXED ✅

## The Problem

When running `002_storage_policies.sql` in Supabase SQL Editor, you encountered:
```
ERROR: 42501: must be owner of relation objects
```

## Why It Happened

The `storage.objects` table is owned by the `supabase_storage_admin` role. Regular users (including the postgres user in SQL Editor) don't have permission to directly create policies on this table.

## The Solution

Storage policies **must be created via the Supabase Dashboard UI**, not through SQL.

---

## ✅ What to Do Now

### Step 1: Run Bucket Creation (SQL Editor)

The bucket creation part works fine. Run this in your SQL Editor:

```sql
-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Post media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Halaqa avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'halaqa-avatars',
  'halaqa-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Create Policies via Dashboard

Follow the detailed guide in: **`supabase/STORAGE_SETUP_GUIDE.md`**

**Quick Summary:**

1. Go to **Storage** in Supabase Dashboard
2. Click on each bucket (avatars, post-media, halaqa-avatars)
3. Click **Policies** tab
4. Create 4 policies for each bucket:
   - **SELECT** - Public read access
   - **INSERT** - Authenticated users can upload to their folder
   - **UPDATE** - Users can update their own files
   - **DELETE** - Users can delete their own files

### Step 3: Test Upload

```typescript
// Test in your app
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file);
```

---

## 📚 Files Updated

1. ✅ **`supabase/migrations/002_storage_policies.sql`**
   - Commented out the policy creation (they would fail)
   - Added policy definitions as comments for reference
   - Kept bucket creation (this works fine)

2. ✅ **`supabase/STORAGE_SETUP_GUIDE.md`** (NEW)
   - Complete step-by-step guide
   - All policy definitions
   - Testing instructions
   - Troubleshooting section

3. ✅ **`supabase/migrations/README.md`**
   - Updated to reference the storage setup guide

---

## 🔍 Policy Definitions

For quick reference, here are the main policies:

### For Avatars & Post-Media (User-Specific Folders)

```sql
-- Public read
bucket_id = 'avatars'

-- User can only access their own folder
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

### For Halaqa-Avatars (Shared Access)

```sql
-- Public read
bucket_id = 'halaqa-avatars'

-- Any authenticated user can upload
bucket_id = 'halaqa-avatars' AND auth.uid() IS NOT NULL
```

---

## ⚡ Quick Setup (5 Minutes)

1. **Run bucket creation SQL** (30 seconds)
2. **Create 4 policies for avatars bucket** (2 minutes)
3. **Create 4 policies for post-media bucket** (2 minutes)
4. **Create 4 policies for halaqa-avatars bucket** (2 minutes)
5. **Test upload** (30 seconds)

**Total: ~7 minutes** ⏱️

---

## ✅ Verification

After setup, you should have:
- ✅ 3 storage buckets created
- ✅ 12 storage policies (4 per bucket)
- ✅ Successful file uploads from your app
- ✅ Public access to uploaded files

---

## 📖 Documentation

- **Detailed Guide**: `supabase/STORAGE_SETUP_GUIDE.md`
- **Migration README**: `supabase/migrations/README.md`
- **Database Summary**: `DATABASE_MIGRATIONS_SUMMARY.md`

---

## 🎉 Next Steps

After storage is configured:

1. ✅ Implement file upload in your app
2. ✅ Add image preview components
3. ✅ Add file validation (size, type)
4. ✅ Consider image optimization (resize, compress)
5. ✅ Add progress indicators for uploads

---

**Your storage is almost ready! Just create the policies via Dashboard and you're done.** 🚀

