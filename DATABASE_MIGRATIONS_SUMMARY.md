# Database Migrations Summary 🗄️

## ✅ SQL Migrations Complete!

Comprehensive database schema for Barakah.Social Islamic social platform with 8 tables, RLS policies, triggers, and helper functions.

---

## 📦 Created Files

### 1. `supabase/migrations/001_initial_schema.sql` (750+ lines)
Complete database schema with all tables, relationships, and security.

### 2. `supabase/migrations/002_storage_policies.sql` (150+ lines)
Storage buckets and RLS policies for file uploads.

### 3. `supabase/seed.sql` (300+ lines)
Sample data for testing and development.

### 4. `supabase/example_queries.sql` (500+ lines)
Common queries with examples.

### 5. `supabase/migrations/README.md` (400+ lines)
Complete migration documentation.

---

## 🗃️ Database Tables

### 1. **profiles** (User Profiles)
```sql
- id (UUID, FK to auth.users)
- username (VARCHAR, unique, 3-30 chars)
- full_name (VARCHAR)
- bio (TEXT, max 500 chars)
- avatar_url (TEXT)
- interests (TEXT[])
- madhab_preference (ENUM: hanafi, shafi, maliki, hanbali, jafari)
- joined_at (TIMESTAMP)
- is_verified_scholar (BOOLEAN)
- beneficial_count (INTEGER)
```

**Features:**
- Automatic creation on user signup
- Username validation (alphanumeric + underscore)
- Full-text search on username
- Beneficial count tracking

### 2. **posts** (Content Posts)
```sql
- id (UUID)
- author_id (UUID, FK)
- content (TEXT, 1-2000 chars)
- post_type (ENUM: standard, question, poll, debate)
- media_urls (TEXT[])
- tags (TEXT[], max 10)
- beneficial_count (INTEGER)
- created_at, updated_at (TIMESTAMP)
- is_pinned, is_deleted (BOOLEAN)
```

**Features:**
- Multiple post types
- Tag system (max 10 tags)
- Beneficial count auto-increment
- Soft delete support
- Pinned posts

### 3. **halaqas** (Study Circles)
```sql
- id (UUID)
- name (VARCHAR, 3-100 chars)
- description (TEXT, min 10 chars)
- category (VARCHAR)
- rules (TEXT)
- member_count (INTEGER)
- is_public (BOOLEAN)
- created_by (UUID, FK)
- created_at, updated_at (TIMESTAMP)
```

**Features:**
- Public/private circles
- Auto member count tracking
- Creator automatically becomes admin
- Full-text search on name

### 4. **halaqa_members** (Circle Members)
```sql
- halaqa_id (UUID, FK)
- user_id (UUID, FK)
- role (ENUM: member, moderator, admin)
- joined_at (TIMESTAMP)
```

**Features:**
- Role-based permissions
- Composite primary key
- Auto-updates halaqa member_count

### 5. **comments** (Post Comments)
```sql
- id (UUID)
- post_id (UUID, FK)
- author_id (UUID, FK)
- content (TEXT, 1-1000 chars)
- parent_comment_id (UUID, nullable)
- created_at, updated_at (TIMESTAMP)
- is_deleted (BOOLEAN)
- beneficial_count (INTEGER)
```

**Features:**
- Threaded comments (parent_comment_id)
- Soft delete
- Beneficial count tracking

### 6. **beneficial_marks** (Like System)
```sql
- user_id (UUID, FK)
- post_id (UUID, FK)
- created_at (TIMESTAMP)
- UNIQUE(user_id, post_id)
```

**Features:**
- One mark per user per post
- Auto-increments post beneficial_count
- Auto-increments author beneficial_count

### 7. **bookmarks** (Saved Posts)
```sql
- user_id (UUID, FK)
- post_id (UUID, FK)
- created_at (TIMESTAMP)
- PRIMARY KEY(user_id, post_id)
```

**Features:**
- Simple save/unsave functionality
- Private to user

### 8. **reports** (Content Moderation)
```sql
- id (UUID)
- reporter_id (UUID, FK)
- content_type (ENUM: post, comment, profile)
- content_id (UUID)
- reason (ENUM: ghibah, takfir, fitna, hate_speech, misinformation, etc.)
- description (TEXT, max 1000 chars)
- status (ENUM: pending, reviewed, resolved, dismissed)
- created_at (TIMESTAMP)
- reviewed_at, reviewed_by, resolution_note
```

**Features:**
- Islamic-specific report reasons
- Workflow: pending → reviewed → resolved/dismissed
- Tracks reviewer and resolution

---

## 🔒 Row Level Security (RLS)

### Profiles
- ✅ Anyone can view profiles
- ✅ Users can update their own profile
- ❌ Cannot delete (use auth deletion)

### Posts
- ✅ Anyone can view non-deleted posts
- ✅ Authenticated users can create
- ✅ Authors can edit/delete their own

### Halaqas
- ✅ Anyone can view public halaqas
- ✅ Members can view private halaqas
- ✅ Authenticated users can create
- ✅ Only admins can edit/delete

### Halaqa Members
- ✅ Members can view halaqa members
- ✅ Users can join public halaqas
- ✅ Moderators can add members
- ✅ Admins can change roles
- ✅ Users can leave or be removed

### Comments
- ✅ Anyone can view non-deleted
- ✅ Authenticated users can create
- ✅ Authors can edit/delete their own

### Beneficial Marks
- ✅ Anyone can view marks
- ✅ Users can mark/unmark posts

### Bookmarks
- ✅ Users see only their own
- ✅ Users can save/unsave posts

### Reports
- ✅ Users see only their reports
- ✅ Authenticated users can report
- ✅ Users can update pending reports

---

## ⚙️ Triggers & Functions

### Automatic Triggers

1. **`update_updated_at_column()`**
   - Updates `updated_at` timestamp on UPDATE
   - Applied to: profiles, posts, halaqas, comments

2. **`handle_new_user()`**
   - Creates profile on auth.users INSERT
   - Sets default username and name

3. **`increment/decrement_post_beneficial_count()`**
   - Updates post beneficial_count
   - Updates author beneficial_count
   - Triggered on beneficial_marks INSERT/DELETE

4. **`update_halaqa_member_count()`**
   - Updates halaqa member_count
   - Triggered on halaqa_members INSERT/DELETE

5. **`add_halaqa_creator_as_admin()`**
   - Adds creator as admin
   - Triggered on halaqas INSERT

### Helper Functions

1. **`is_halaqa_moderator(halaqa_id, user_id)`**
   - Returns BOOLEAN
   - Checks if user is moderator/admin

2. **`has_marked_beneficial(post_id, user_id)`**
   - Returns BOOLEAN
   - Checks if user marked post

3. **`has_bookmarked(post_id, user_id)`**
   - Returns BOOLEAN
   - Checks if user bookmarked post

4. **`get_post_with_details(post_id)`**
   - Returns complete post info
   - Includes author details
   - Includes user engagement

### Storage Functions

1. **`get_avatar_url(user_id, filename)`**
2. **`get_post_media_url(user_id, filename)`**
3. **`get_halaqa_avatar_url(halaqa_id, filename)`**

---

## 🎨 Islamic-Specific Features

### Madhab Preferences
Users can select their school of jurisprudence:
- **Hanafi** - Abu Hanifa (RA)
- **Shafi** - Imam Shafi (RA)
- **Maliki** - Imam Malik (RA)
- **Hanbali** - Imam Ahmad ibn Hanbal (RA)
- **Jafari** - Imam Ja'far al-Sadiq (RA)

### Report Reasons
Islamic-specific content moderation:
- **Ghibah** (غيبة) - Backbiting/gossip
- **Takfir** (تكفير) - Inappropriate declarations of disbelief
- **Fitna** (فتنة) - Causing discord or mischief
- **Hate Speech** - General hate speech
- **Misinformation** - False Islamic information
- **Inappropriate** - Other inappropriate content
- **Spam** - Spam content

### Verified Scholars
- Special badge for verified Islamic scholars
- Higher credibility in discussions
- Can be assigned by platform admins

### Halaqas (Circles)
- Islamic study groups
- Three roles: member, moderator, admin
- Can be public or private
- Custom rules and categories

### Beneficial System
Instead of "likes", uses Islamic concept of "beneficial":
- Based on hadith: "Best of people are most beneficial"
- Tracks beneficial contributions
- Rewards quality content

---

## 📊 Storage Buckets

### 1. **avatars** (Public)
- Max size: 5MB
- Types: JPEG, PNG, WebP, GIF
- Path: `avatars/{user_id}/{filename}`

### 2. **post-media** (Public)
- Max size: 10MB
- Types: Images + MP4/WebM videos
- Path: `post-media/{user_id}/{filename}`

### 3. **halaqa-avatars** (Public)
- Max size: 5MB
- Types: JPEG, PNG, WebP, GIF
- Path: `halaqa-avatars/{halaqa_id}/{filename}`

---

## 📈 Indexes

### Performance Optimizations

**Profiles:**
- username (unique + trgm for fuzzy search)
- is_verified_scholar (filtered)
- joined_at (DESC)

**Posts:**
- author_id
- created_at (DESC)
- post_type
- tags (GIN index)
- is_pinned (filtered)
- beneficial_count (DESC)
- is_deleted (filtered)

**Halaqas:**
- created_by
- category
- is_public
- created_at (DESC)
- member_count (DESC)
- name (trgm for fuzzy search)

**Comments:**
- post_id
- author_id
- parent_comment_id
- created_at (DESC)
- is_deleted (filtered)

**Beneficial Marks:**
- post_id
- user_id
- created_at (DESC)

**Bookmarks:**
- user_id
- post_id
- created_at (DESC)

**Reports:**
- reporter_id
- content_type
- content_id
- status
- reason
- created_at (DESC)

---

## 🚀 How to Use

### 1. Run Initial Schema
```bash
# Via Supabase CLI
supabase db push --file supabase/migrations/001_initial_schema.sql

# Or via Dashboard SQL Editor
# Copy/paste the file contents and run
```

### 2. Run Storage Policies
```bash
supabase db push --file supabase/migrations/002_storage_policies.sql
```

### 3. (Optional) Add Seed Data
```bash
supabase db push --file supabase/seed.sql
```

### 4. Generate TypeScript Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## 📝 Example Usage

### Create a Post
```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    author_id: user.id,
    content: 'Assalamu alaikum...',
    post_type: 'standard',
    tags: ['Quran', 'Reflection']
  })
  .select()
  .single();
```

### Mark Post as Beneficial
```typescript
const { error } = await supabase
  .from('beneficial_marks')
  .insert({
    user_id: user.id,
    post_id: post.id
  });
// Automatically increments beneficial_count
```

### Get Post with Details
```typescript
const { data, error } = await supabase
  .rpc('get_post_with_details', {
    post_id_param: postId
  });
// Returns post with author info and user engagement
```

### Join a Halaqa
```typescript
const { error } = await supabase
  .from('halaqa_members')
  .insert({
    halaqa_id: halaqaId,
    user_id: user.id,
    role: 'member'
  });
// Automatically increments member_count
```

### Report Content
```typescript
const { error } = await supabase
  .from('reports')
  .insert({
    reporter_id: user.id,
    content_type: 'post',
    content_id: postId,
    reason: 'ghibah',
    description: 'This post contains backbiting...'
  });
```

---

## 🧪 Testing

### Verify Installation
```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Test a query
SELECT * FROM profiles LIMIT 5;
```

### Test RLS Policies
```javascript
// Test as authenticated user
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .limit(10);

// Test create
const { error } = await supabase
  .from('posts')
  .insert({ content: 'Test post', author_id: user.id });
```

---

## 🔄 Migration Order

1. **001_initial_schema.sql** - Run first (creates tables, enums, triggers)
2. **002_storage_policies.sql** - Run second (sets up storage)
3. **seed.sql** - Optional (sample data for testing)

---

## 📚 Documentation Files

- `supabase/migrations/README.md` - Detailed migration guide
- `supabase/example_queries.sql` - Common query examples
- `SUPABASE_SETUP.md` - General Supabase setup
- `DATABASE_MIGRATIONS_SUMMARY.md` - This file

---

## ⚠️ Important Notes

### Before Production

1. **Review RLS Policies** - Ensure they match your security requirements
2. **Test All Queries** - Verify queries work with RLS enabled
3. **Add Indexes** - Monitor query performance and add indexes as needed
4. **Backup Strategy** - Set up automatic backups
5. **Monitoring** - Enable query performance monitoring
6. **Rate Limiting** - Configure rate limiting for public endpoints

### Security Considerations

1. ✅ All tables have RLS enabled
2. ✅ Users can only modify their own content
3. ✅ Private halaqas require membership
4. ✅ Reports are private to reporter
5. ✅ Moderator functions use SECURITY DEFINER
6. ⚠️ Admin features should use service role key
7. ⚠️ Validate all user input on client side
8. ⚠️ Monitor for SQL injection attempts

### Performance Tips

1. Use indexed columns in WHERE clauses
2. Use pagination (LIMIT/OFFSET) for large datasets
3. Use `select('*')` sparingly - select only needed columns
4. Use RPC functions for complex queries
5. Cache frequently accessed data
6. Use database connection pooling
7. Monitor slow queries in Supabase dashboard

---

## 🎯 Next Steps

After running migrations:

1. ✅ **Test Migrations** - Verify all tables created
2. ✅ **Test RLS** - Check policies work correctly
3. ✅ **Generate Types** - Create TypeScript types
4. ✅ **Update Frontend** - Use new schema in app
5. ✅ **Add Sample Data** - Run seed.sql for testing
6. ✅ **Test Queries** - Try example queries
7. ✅ **Monitor Performance** - Check query speed
8. ✅ **Document** - Update API documentation

---

## 📊 Statistics

| Item | Count |
|------|-------|
| **Tables** | 8 |
| **Enums** | 6 |
| **Triggers** | 9 |
| **Functions** | 11 |
| **RLS Policies** | 35+ |
| **Indexes** | 40+ |
| **Storage Buckets** | 3 |
| **Total Lines of SQL** | 1,700+ |

---

## ✅ **Migrations are Complete!**

Your Islamic social platform database is ready with:
- ✅ Complete schema (8 tables)
- ✅ RLS security (35+ policies)
- ✅ Auto triggers (9 triggers)
- ✅ Helper functions (11 functions)
- ✅ Storage setup (3 buckets)
- ✅ Example queries (50+ queries)
- ✅ Sample data (seed file)
- ✅ Full documentation

**Ready to build your Islamic social platform!** 🚀

---

*May your database be blessed with barakah* ✨

