# Barakah.Social Database Migrations

## Overview

This directory contains Supabase database migrations for the Barakah.Social platform.

## Migration Files

### `001_initial_schema.sql`
Initial database schema including:

#### Tables
1. **profiles** - User profiles with Islamic preferences
2. **posts** - Content posts (standard, questions, polls, debates)
3. **halaqas** - Islamic study circles/groups
4. **halaqa_members** - Circle membership with roles
5. **comments** - Threaded comments on posts
6. **beneficial_marks** - "Beneficial" marks (like system)
7. **bookmarks** - Saved posts
8. **reports** - Content moderation with Islamic-specific reasons

#### Enums
- `madhab_type`: hanafi, shafi, maliki, hanbali, jafari
- `post_type`: standard, question, poll, debate
- `halaqa_role`: member, moderator, admin
- `content_type`: post, comment, profile
- `report_reason`: ghibah, takfir, fitna, hate_speech, misinformation, etc.
- `report_status`: pending, reviewed, resolved, dismissed

#### Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Automatic profile creation on user signup
- ✅ Automatic beneficial count tracking
- ✅ Automatic halaqa member count tracking
- ✅ Automatic updated_at timestamps
- ✅ Full-text search indexes
- ✅ Proper foreign key relationships
- ✅ Check constraints for data validation

## Running Migrations

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/001_initial_schema.sql
```

### Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the migration file contents
5. Click **Run** or press `Cmd/Ctrl + Enter`

### Using psql

```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
```

## Row Level Security (RLS) Policies

### Profiles
- ✅ Everyone can view profiles
- ✅ Users can update their own profile
- ❌ Users cannot delete profiles (use auth deletion)

### Posts
- ✅ Everyone can view non-deleted posts
- ✅ Authenticated users can create posts
- ✅ Users can edit/delete their own posts

### Halaqas (Circles)
- ✅ Everyone can view public halaqas
- ✅ Members can view private halaqas they belong to
- ✅ Authenticated users can create halaqas
- ✅ Only admins can edit/delete halaqas

### Halaqa Members
- ✅ Members can view other members in their halaqas
- ✅ Users can join public halaqas
- ✅ Moderators/admins can add members
- ✅ Admins can update member roles
- ✅ Users can leave halaqas
- ✅ Moderators/admins can remove members

### Comments
- ✅ Everyone can view non-deleted comments
- ✅ Authenticated users can create comments
- ✅ Users can edit/delete their own comments

### Beneficial Marks
- ✅ Everyone can view beneficial marks
- ✅ Users can mark posts as beneficial
- ✅ Users can remove their own marks

### Bookmarks
- ✅ Users can only view their own bookmarks
- ✅ Users can create/delete bookmarks

### Reports
- ✅ Users can view their own reports
- ✅ Authenticated users can create reports
- ✅ Users can update/delete their pending reports

## Triggers

### Automatic Profile Creation
When a new user signs up via Supabase Auth, a profile is automatically created.

### Beneficial Count Tracking
When a post is marked as beneficial:
- Post's beneficial_count increments
- Author's beneficial_count increments

When unmarked:
- Both counts decrement (never below 0)

### Halaqa Member Count
When a user joins a halaqa, the member_count increments.
When a user leaves, the member_count decrements.

### Updated At Timestamps
Automatically updates `updated_at` field on:
- profiles
- posts
- halaqas
- comments

## Helper Functions

### `is_halaqa_moderator(halaqa_id, user_id)`
Check if user is a moderator or admin of a halaqa.

### `has_marked_beneficial(post_id, user_id)`
Check if user has marked a post as beneficial.

### `has_bookmarked(post_id, user_id)`
Check if user has bookmarked a post.

### `get_post_with_details(post_id)`
Get complete post information including author details and user engagement.

## Data Validation

### Profiles
- Username: 3-30 characters, alphanumeric + underscore
- Bio: Max 500 characters
- Beneficial count: >= 0

### Posts
- Content: 1-2000 characters
- Tags: Max 10 tags
- Beneficial count: >= 0

### Halaqas
- Name: 3-100 characters
- Description: Min 10 characters
- Member count: >= 0

### Comments
- Content: 1-1000 characters
- Beneficial count: >= 0

### Reports
- Description: Max 1000 characters

## Indexes

All tables have proper indexes for:
- Foreign keys
- Frequently queried columns
- Sort/filter columns
- Full-text search (username, halaqa name)

## Islamic-Specific Features

### Madhab Preferences
Users can select their preferred school of Islamic jurisprudence:
- Hanafi
- Shafi
- Maliki
- Hanbali
- Jafari

### Report Reasons
Islamic-specific content moderation:
- **Ghibah**: Backbiting/gossip
- **Takfir**: Inappropriate declarations of disbelief
- **Fitna**: Causing discord or mischief
- **Hate Speech**: General hate speech
- **Misinformation**: False information
- **Inappropriate**: Other inappropriate content
- **Spam**: Spam content

### Verified Scholars
Users can be marked as verified Islamic scholars for credibility.

### Halaqas (Study Circles)
Community-organized groups for Islamic learning and discussion.

## Next Steps

After running the migration:

1. **Set up Storage Buckets** (for avatars, media):
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('avatars', 'avatars', true),
     ('post-media', 'post-media', true);
   ```

2. **Configure Storage Policies** (see `STORAGE_SETUP_GUIDE.md` for step-by-step instructions)

3. **Test RLS Policies** with different user roles

4. **Add sample data** for testing

5. **Generate TypeScript types**:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
   ```

## Troubleshooting

### Migration Fails
- Check if extensions are enabled
- Verify you have proper permissions
- Check for existing tables with same names

### RLS Policies Not Working
- Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Test policies with different authenticated users
- Check policy conditions match your use case

### Performance Issues
- Ensure indexes are created
- Use `EXPLAIN ANALYZE` for slow queries
- Consider adding composite indexes for common queries

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review RLS policy guide: https://supabase.com/docs/guides/auth/row-level-security
- Test in Supabase SQL Editor with different auth contexts

---

**May your database be blessed with barakah!** ✨

