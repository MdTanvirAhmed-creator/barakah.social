# Storage Setup Guide 📦

## Why Use Dashboard for Storage Policies?

Storage policies in Supabase require special permissions that the SQL Editor doesn't have. You need to create storage bucket policies through the Supabase Dashboard UI instead.

---

## ✅ Step-by-Step Setup

### Part 1: Create Storage Buckets (via SQL Editor)

The bucket creation part of `002_storage_policies.sql` will work fine. Run this in SQL Editor:

```sql
-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Post media bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Halaqa avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'halaqa-avatars',
  'halaqa-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

### Part 2: Create Storage Policies (via Dashboard)

After creating the buckets, you need to create policies for each one.

---

## 📁 Bucket 1: Avatars

### Go to Dashboard
1. Open your Supabase project
2. Click **Storage** in the left sidebar
3. Click on the **avatars** bucket
4. Click on the **Policies** tab
5. Click **New Policy**

### Policy 1: Public Read Access

```
Policy Name: Avatars are publicly accessible
Allowed operation: SELECT
Target roles: public

Policy definition:
bucket_id = 'avatars'
```

**Steps:**
1. Click "New Policy"
2. Select "For full customization" (or similar option)
3. Enter the policy name
4. Check **SELECT** operation
5. For "Target roles", select **public**
6. In the "Policy Definition (USING)" field, paste:
   ```sql
   bucket_id = 'avatars'
   ```
7. Click **Review** then **Save policy**

### Policy 2: Users Can Upload

```
Policy Name: Users can upload their own avatar
Allowed operation: INSERT
Target roles: authenticated

Policy definition (WITH CHECK):
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Steps:**
1. Click "New Policy"
2. Enter the policy name
3. Check **INSERT** operation
4. For "Target roles", select **authenticated**
5. In the "Policy Definition (WITH CHECK)" field, paste:
   ```sql
   bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
   ```
6. Click **Save policy**

### Policy 3: Users Can Update

```
Policy Name: Users can update their own avatar
Allowed operation: UPDATE
Target roles: authenticated

Policy definition (USING):
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]

Policy definition (WITH CHECK):
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Steps:**
1. Click "New Policy"
2. Enter the policy name
3. Check **UPDATE** operation
4. For "Target roles", select **authenticated**
5. In the "USING" field, paste the policy definition
6. In the "WITH CHECK" field, paste the same policy definition
7. Click **Save policy**

### Policy 4: Users Can Delete

```
Policy Name: Users can delete their own avatar
Allowed operation: DELETE
Target roles: authenticated

Policy definition (USING):
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Steps:**
1. Click "New Policy"
2. Enter the policy name
3. Check **DELETE** operation
4. For "Target roles", select **authenticated**
5. In the "Policy Definition (USING)" field, paste:
   ```sql
   bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
   ```
6. Click **Save policy**

---

## 📁 Bucket 2: Post Media

### Go to Dashboard
1. Click **Storage** in the left sidebar
2. Click on the **post-media** bucket
3. Click on the **Policies** tab

### Policy 1: Public Read Access

```
Policy Name: Post media is publicly accessible
Allowed operation: SELECT
Target roles: public

Policy definition:
bucket_id = 'post-media'
```

### Policy 2: Authenticated Upload

```
Policy Name: Authenticated users can upload post media
Allowed operation: INSERT
Target roles: authenticated

Policy definition (WITH CHECK):
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 3: Users Can Update

```
Policy Name: Users can update their own post media
Allowed operation: UPDATE
Target roles: authenticated

Policy definition (USING and WITH CHECK):
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 4: Users Can Delete

```
Policy Name: Users can delete their own post media
Allowed operation: DELETE
Target roles: authenticated

Policy definition (USING):
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

---

## 📁 Bucket 3: Halaqa Avatars

### Go to Dashboard
1. Click **Storage** in the left sidebar
2. Click on the **halaqa-avatars** bucket
3. Click on the **Policies** tab

### Policy 1: Public Read Access

```
Policy Name: Halaqa avatars are publicly accessible
Allowed operation: SELECT
Target roles: public

Policy definition:
bucket_id = 'halaqa-avatars'
```

### Policy 2: Authenticated Upload

```
Policy Name: Halaqa admins can upload halaqa avatars
Allowed operation: INSERT
Target roles: authenticated

Policy definition (WITH CHECK):
bucket_id = 'halaqa-avatars' AND auth.uid() IS NOT NULL
```

### Policy 3: Authenticated Update

```
Policy Name: Halaqa admins can update halaqa avatars
Allowed operation: UPDATE
Target roles: authenticated

Policy definition (USING and WITH CHECK):
bucket_id = 'halaqa-avatars'
```

### Policy 4: Authenticated Delete

```
Policy Name: Halaqa admins can delete halaqa avatars
Allowed operation: DELETE
Target roles: authenticated

Policy definition (USING):
bucket_id = 'halaqa-avatars'
```

---

## 🧪 Testing Storage

After creating all policies, test them:

### Test Upload (Frontend)

```typescript
import { createClient } from '@/lib/supabase/client';

async function uploadAvatar(file: File) {
  const supabase = createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) return;

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (error) {
    console.error('Upload error:', error);
    return;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  console.log('Avatar uploaded:', publicUrl);
  return publicUrl;
}
```

### Test via Supabase Dashboard

1. Go to **Storage** > **avatars**
2. Click **Upload file**
3. Select a file and upload
4. Check if it appears in the bucket
5. Try to view the file (should be publicly accessible)

---

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy"

**Cause:** Policy definition is incorrect or user isn't authenticated

**Solution:**
- Verify the policy definition matches exactly
- Check that `auth.uid()` returns a valid user ID
- Make sure user is authenticated before uploading

### Error: "permission denied for bucket"

**Cause:** Bucket might be set to private or no policies exist

**Solution:**
- Check bucket is set to **public** (for avatars and post-media)
- Verify at least one policy exists for the operation
- Check policy target roles include the right users

### Files Upload but Can't View Them

**Cause:** Missing SELECT policy or bucket isn't public

**Solution:**
- Add a SELECT policy with `bucket_id = 'bucket-name'`
- Make sure the bucket's "Public" toggle is ON
- Check the policy's target roles include **public**

### Can Upload Files from Other Users' Folders

**Cause:** Policy doesn't check user ownership

**Solution:**
- Make sure your INSERT/UPDATE policies include:
  ```sql
  auth.uid()::text = (storage.foldername(name))[1]
  ```
- This ensures users can only upload to their own folder

---

## 📊 Policy Summary

| Bucket | Policy | Operation | Who Can Access |
|--------|--------|-----------|----------------|
| avatars | Public read | SELECT | Everyone |
| avatars | Own folder upload | INSERT | Authenticated users (their folder only) |
| avatars | Own folder update | UPDATE | Authenticated users (their folder only) |
| avatars | Own folder delete | DELETE | Authenticated users (their folder only) |
| post-media | Public read | SELECT | Everyone |
| post-media | Own folder upload | INSERT | Authenticated users (their folder only) |
| post-media | Own folder update | UPDATE | Authenticated users (their folder only) |
| post-media | Own folder delete | DELETE | Authenticated users (their folder only) |
| halaqa-avatars | Public read | SELECT | Everyone |
| halaqa-avatars | Authenticated upload | INSERT | All authenticated users |
| halaqa-avatars | Authenticated update | UPDATE | All authenticated users |
| halaqa-avatars | Authenticated delete | DELETE | All authenticated users |

---

## 📝 Quick Copy-Paste Policies

For faster setup, here are all the policy definitions in one place:

### Avatars Bucket
```sql
-- SELECT (public)
bucket_id = 'avatars'

-- INSERT, UPDATE, DELETE (authenticated)
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Post-Media Bucket
```sql
-- SELECT (public)
bucket_id = 'post-media'

-- INSERT, UPDATE, DELETE (authenticated)
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
```

### Halaqa-Avatars Bucket
```sql
-- SELECT (public)
bucket_id = 'halaqa-avatars'

-- INSERT (authenticated)
bucket_id = 'halaqa-avatars' AND auth.uid() IS NOT NULL

-- UPDATE, DELETE (authenticated)
bucket_id = 'halaqa-avatars'
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] 3 buckets created (avatars, post-media, halaqa-avatars)
- [ ] All buckets are set to **public**
- [ ] Avatars bucket has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Post-media bucket has 4 policies
- [ ] Halaqa-avatars bucket has 4 policies
- [ ] Test upload works from your app
- [ ] Test that users can only modify their own files
- [ ] Test that public files are viewable without auth

---

## 🚀 Next Steps

After storage is set up:

1. Update your frontend to use the storage functions
2. Implement file upload UI components
3. Add image preview and cropping features
4. Set up image optimization (resize, compress)
5. Add file validation on the client side

---

**Storage is now ready for use!** 📦✨

