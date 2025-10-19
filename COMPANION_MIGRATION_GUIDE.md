# 🚀 Companion System Migration Guide

## Prerequisites

Before applying this migration, ensure you have:
- ✅ Supabase project set up
- ✅ Existing `001_initial_schema.sql` migration applied
- ✅ Supabase CLI installed (optional, but recommended)
- ✅ Database connection credentials

---

## Method 1: Supabase Dashboard (Recommended for Beginners)

### Step 1: Access SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### Step 2: Copy Migration SQL
1. Open `supabase/migrations/002_companion_system.sql`
2. Copy the entire contents (Ctrl+A, Ctrl+C)

### Step 3: Execute Migration
1. Paste the SQL into the query editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait for execution to complete (should take 5-10 seconds)

### Step 4: Verify Success
Check for:
- ✅ Green success message
- ✅ No error messages in the output panel
- ✅ New tables visible in **Table Editor**

### Step 5: Verify Tables Created
Navigate to **Table Editor** and confirm these tables exist:
- `companion_connections`
- `user_matching_preferences`
- `companion_interactions`
- `study_partnerships`
- `mentor_relationships`

---

## Method 2: Supabase CLI (Recommended for Production)

### Step 1: Install Supabase CLI (if not installed)
```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Other platforms - see: https://supabase.com/docs/guides/cli
```

### Step 2: Link to Your Project
```bash
# From your project root
supabase link --project-ref your-project-ref

# You'll be prompted for your database password
```

### Step 3: Apply Migration
```bash
# Push the migration to your remote database
supabase db push

# Or apply specific migration
supabase migration up
```

### Step 4: Verify Migration
```bash
# Check migration status
supabase migration list

# Should show:
# 001_initial_schema.sql ✓ Applied
# 002_companion_system.sql ✓ Applied
```

---

## Method 3: Direct Database Connection (Advanced)

### Step 1: Get Connection String
From Supabase Dashboard:
1. Go to **Settings** → **Database**
2. Copy the **Connection String** (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password

### Step 2: Connect via psql
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres"
```

### Step 3: Execute Migration File
```sql
\i supabase/migrations/002_companion_system.sql
```

---

## Post-Migration Verification

### Test 1: Check New Enum Types
```sql
SELECT typname FROM pg_type 
WHERE typname IN (
  'connection_status',
  'knowledge_level',
  'gender_preference',
  'interaction_type',
  'partnership_type',
  'check_in_frequency',
  'mentor_status',
  'life_stage'
);
```

**Expected Result:** All 8 enum types listed

### Test 2: Verify Profile Extensions
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'companion_score',
  'is_available_for_connections',
  'connection_capacity',
  'last_active',
  'personality_traits',
  'life_stage'
);
```

**Expected Result:** All 6 new columns listed

### Test 3: Verify Helper Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'calculate_companion_match_score',
  'update_connection_strength',
  'update_companion_updated_at_column'
);
```

**Expected Result:** All 3 functions listed

### Test 4: Check Views
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN (
  'active_companion_connections',
  'mentor_mentee_matches'
);
```

**Expected Result:** Both views listed

### Test 5: Verify RLS Policies
```sql
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'companion_connections',
  'user_matching_preferences',
  'companion_interactions',
  'study_partnerships',
  'mentor_relationships'
)
GROUP BY schemaname, tablename;
```

**Expected Result:** Each table should have multiple policies

---

## Troubleshooting

### Issue: "type already exists" errors

**Cause:** Enum types already exist from previous migration attempt

**Solution:**
```sql
-- Drop enum types if they exist (run before migration)
DROP TYPE IF EXISTS connection_status CASCADE;
DROP TYPE IF EXISTS knowledge_level CASCADE;
DROP TYPE IF EXISTS gender_preference CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS partnership_type CASCADE;
DROP TYPE IF EXISTS check_in_frequency CASCADE;
DROP TYPE IF EXISTS mentor_status CASCADE;
DROP TYPE IF EXISTS life_stage CASCADE;
```

### Issue: "relation already exists" errors

**Cause:** Tables already exist from previous migration attempt

**Solution:**
```sql
-- Drop tables if they exist (CAUTION: This deletes data!)
DROP TABLE IF EXISTS companion_interactions CASCADE;
DROP TABLE IF EXISTS study_partnerships CASCADE;
DROP TABLE IF EXISTS mentor_relationships CASCADE;
DROP TABLE IF EXISTS companion_connections CASCADE;
DROP TABLE IF EXISTS user_matching_preferences CASCADE;
```

### Issue: "column already exists" errors

**Cause:** Profile columns already exist

**Solution:** The migration uses `IF NOT EXISTS`, so this shouldn't happen. If it does:
```sql
-- Check which columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Manually add missing columns only
```

### Issue: Permission denied errors

**Cause:** Insufficient database permissions

**Solution:**
- Ensure you're using the `postgres` role
- Check your connection string uses the correct user
- Verify database password is correct

### Issue: Migration hangs or times out

**Cause:** Large database or slow connection

**Solution:**
- Break migration into smaller chunks
- Run during low-traffic periods
- Increase timeout settings in your client

---

## Testing the Schema

### Test 1: Create a Connection Request
```sql
-- Insert test connection request
INSERT INTO companion_connections (
  requester_id,
  recipient_id,
  status,
  message
) VALUES (
  'your-user-id',
  'friend-user-id',
  'pending',
  'Assalamu alaikum! I noticed we share interests in Quran study. Would love to connect!'
);
```

### Test 2: Set Matching Preferences
```sql
-- Insert test preferences
INSERT INTO user_matching_preferences (
  user_id,
  preferred_knowledge_level,
  is_seeking_mentor,
  interests_weight,
  activity_weight
) VALUES (
  'your-user-id',
  'intermediate',
  true,
  70,
  30
);
```

### Test 3: Calculate Match Score
```sql
-- Test matching algorithm
SELECT calculate_companion_match_score(
  'user-1-id',
  'user-2-id'
) as match_score;
```

### Test 4: Create Study Partnership
```sql
-- Insert test partnership
INSERT INTO study_partnerships (
  partnership_type,
  partner_1_id,
  partner_2_id,
  goal,
  target_date,
  check_in_frequency
) VALUES (
  'quran_memorization',
  'your-user-id',
  'partner-user-id',
  'Memorize Juz Amma together',
  '2025-03-01',
  'weekly'
);
```

### Test 5: Track Interaction
```sql
-- First, accept a connection (if pending)
UPDATE companion_connections
SET status = 'accepted'
WHERE id = 'connection-id';

-- Then log an interaction
INSERT INTO companion_interactions (
  companion_connection_id,
  interaction_type,
  points
) VALUES (
  'connection-id',
  'beneficial_given',
  2
);

-- Check if connection_strength increased
SELECT connection_strength 
FROM companion_connections 
WHERE id = 'connection-id';
```

---

## Rollback (Emergency Only)

If you need to rollback the migration:

### ⚠️ WARNING: This will delete all companion data!

```sql
-- 1. Drop views
DROP VIEW IF EXISTS active_companion_connections CASCADE;
DROP VIEW IF EXISTS mentor_mentee_matches CASCADE;

-- 2. Drop functions
DROP FUNCTION IF EXISTS calculate_companion_match_score CASCADE;
DROP FUNCTION IF EXISTS update_connection_strength CASCADE;
DROP FUNCTION IF EXISTS update_companion_updated_at_column CASCADE;

-- 3. Drop tables
DROP TABLE IF EXISTS companion_interactions CASCADE;
DROP TABLE IF EXISTS study_partnerships CASCADE;
DROP TABLE IF EXISTS mentor_relationships CASCADE;
DROP TABLE IF EXISTS companion_connections CASCADE;
DROP TABLE IF EXISTS user_matching_preferences CASCADE;

-- 4. Remove profile columns
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS companion_score,
  DROP COLUMN IF EXISTS is_available_for_connections,
  DROP COLUMN IF EXISTS connection_capacity,
  DROP COLUMN IF EXISTS last_active,
  DROP COLUMN IF EXISTS personality_traits,
  DROP COLUMN IF EXISTS life_stage;

-- 5. Drop enum types
DROP TYPE IF EXISTS connection_status CASCADE;
DROP TYPE IF EXISTS knowledge_level CASCADE;
DROP TYPE IF EXISTS gender_preference CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS partnership_type CASCADE;
DROP TYPE IF EXISTS check_in_frequency CASCADE;
DROP TYPE IF EXISTS mentor_status CASCADE;
DROP TYPE IF EXISTS life_stage CASCADE;
```

---

## Performance Considerations

### Expected Impact
- **Migration Time**: 5-10 seconds for empty database
- **Storage Added**: ~50KB for schema, minimal for indexes
- **Query Performance**: All tables have optimized indexes
- **RLS Overhead**: Minimal, policies are efficient

### Monitoring
After migration, monitor:
- Query performance on new tables
- Index usage statistics
- RLS policy execution time
- Connection strength calculation performance

### Optimization Tips
- Run `ANALYZE` after migration: `ANALYZE;`
- Monitor slow queries: Check `pg_stat_statements`
- Add more indexes if needed based on usage patterns

---

## Next Steps

After successful migration:

1. **✅ Update TypeScript Types**
   - Create interfaces for new tables
   - Add types for enum values
   - Update existing Profile type

2. **✅ Create API Endpoints**
   - Connection request handlers
   - Matching algorithm endpoint
   - Interaction tracking
   - Study partnership CRUD

3. **✅ Build Frontend Components**
   - Companion discovery page
   - Connection request notifications
   - Study partnership dashboard
   - Mentor/mentee interface

4. **✅ Test Thoroughly**
   - Unit tests for helper functions
   - Integration tests for API
   - E2E tests for user flows
   - Load testing for matching algorithm

---

## Support

If you encounter issues:

1. **Check Supabase Logs**: Dashboard → Logs
2. **Review Error Messages**: Look for specific table/column names
3. **Consult Documentation**: `COMPANION_SYSTEM.md`
4. **Database State**: Verify existing schema before migration

---

## Success Checklist

Migration is successful when:
- ✅ All 5 tables created
- ✅ All 8 enum types exist
- ✅ Profile table extended with 6 new columns
- ✅ All RLS policies active
- ✅ Helper functions working
- ✅ Views accessible
- ✅ Triggers firing correctly
- ✅ Test queries run successfully
- ✅ No error messages in logs

---

**🎉 Congratulations! Your Companion System database is ready!**

Next: Proceed to Phase 2 - Backend API Development

