# 🤝 Companion System - Database Schema Documentation

## Overview

The Companion System is designed to foster meaningful Islamic brotherhood/sisterhood (Ukhuwah) by intelligently connecting users based on shared interests, goals, and Islamic values. This system is **woven into the existing 5-pillar structure** rather than being a separate section.

## Database Schema

### 1. 📊 Enum Types

#### `connection_status`
- `pending` - Connection request sent, awaiting response
- `accepted` - Connection established
- `declined` - Connection request declined
- `blocked` - User blocked

#### `knowledge_level`
- `beginner` - Just starting Islamic studies
- `intermediate` - Has foundational knowledge
- `advanced` - Deep knowledge and study
- `any` - No preference

#### `gender_preference`
- `same_only` - Only connect with same gender
- `educational_mixed` - Mixed for educational purposes only
- `any` - No restriction

#### `interaction_type`
- `beneficial_given` - Marked companion's post as beneficial
- `comment_reply` - Replied to companion's comment
- `halaqa_shared` - Invited companion to halaqa
- `knowledge_shared` - Shared knowledge/resource
- `message_sent` - Direct message sent
- `post_interaction` - Interacted with post
- `study_session` - Completed study session together

#### `partnership_type`
- `quran_memorization` - Quran memorization buddy
- `arabic_learning` - Arabic language learning
- `book_study` - Studying specific Islamic book
- `hadith_study` - Hadith study partnership
- `fiqh_study` - Fiqh study partnership
- `general` - General study partnership

#### `check_in_frequency`
- `daily` - Check in daily
- `weekly` - Check in weekly
- `biweekly` - Check in every two weeks
- `monthly` - Check in monthly

#### `mentor_status`
- `active` - Mentorship actively ongoing
- `paused` - Temporarily paused
- `completed` - Mentorship successfully completed
- `cancelled` - Mentorship cancelled

#### `life_stage`
- `student` - Full-time student
- `professional` - Working professional
- `parent` - Parent/homemaker
- `retiree` - Retired
- `seeker` - Seeking knowledge full-time
- `other` - Other life stage

---

### 2. 🗄️ Tables

#### `profiles` (Extended)

**New Fields:**
```sql
companion_score              INTEGER (0-100)     -- Internal matching algorithm score
is_available_for_connections BOOLEAN             -- User accepting new connections?
connection_capacity          INTEGER (0-200)     -- Max active connections (default: 50)
last_active                  TIMESTAMP           -- Last activity timestamp
personality_traits           TEXT[]              -- Islamic character traits
life_stage                   life_stage          -- Current life stage
```

**Personality Traits (Akhlaq):**
- `truthful` (Sadiq)
- `just` (Adil)
- `generous` (Karim)
- `patient` (Sabir)
- `grateful` (Shakir)
- `humble` (Mutawadi)
- `sincere` (Mukhlis)
- `kind` (Raheem)

---

#### `companion_connections`

**Purpose:** Core table for managing connection relationships between users.

**Fields:**
```sql
id                    UUID PRIMARY KEY
requester_id          UUID → profiles.id          -- User who initiated connection
recipient_id          UUID → profiles.id          -- User receiving connection request
status                connection_status            -- Current connection status
connection_strength   INTEGER (0-100)             -- Bond strength (grows with interactions)
last_interaction      TIMESTAMP                   -- Last interaction timestamp
created_at            TIMESTAMP
updated_at            TIMESTAMP
message               TEXT (max 500 chars)        -- Optional salam message with request
```

**Constraints:**
- `different_users`: requester_id ≠ recipient_id
- `unique_connection`: Only one connection per user pair
- Connection strength automatically increases with interactions

**Use Cases:**
- Send connection request with personal message
- Accept/decline connection requests
- Track connection strength over time
- View active companions

---

#### `user_matching_preferences`

**Purpose:** User preferences for the matching algorithm to find compatible companions.

**Fields:**
```sql
user_id                      UUID PRIMARY KEY → profiles.id
preferred_age_range          INT4RANGE                      -- e.g., [20, 35]
preferred_location_radius    INTEGER (0-10000 km)           -- Geographic preference
preferred_knowledge_level    knowledge_level                -- Preferred knowledge level
preferred_languages          TEXT[]                         -- e.g., ['English', 'Arabic']
gender_preference            gender_preference              -- Gender matching preference
is_seeking_mentor            BOOLEAN                        -- Looking for mentor?
can_be_mentor                BOOLEAN                        -- Can mentor others?
interests_weight             INTEGER (0-100, default 50)    -- How much interests matter
activity_weight              INTEGER (0-100, default 30)    -- How much activity matters
location_weight              INTEGER (0-100, default 20)    -- How much location matters
created_at                   TIMESTAMP
updated_at                   TIMESTAMP
```

**Matching Algorithm Weights:**
- **Interests (0-40 points)**: Shared interests in Quran, Hadith, Fiqh, etc.
- **Activity (0-30 points)**: Similar activity levels (beneficial_count)
- **Location (0-20 points)**: Geographic proximity (if location_weight > 0)
- **Mentor/Mentee (bonus +30)**: Perfect match if one seeks mentor and other can mentor

**Use Cases:**
- Customize matching preferences
- Find study buddies with similar knowledge level
- Connect with nearby companions
- Match mentors with students

---

#### `companion_interactions`

**Purpose:** Track all interactions between companions to strengthen bonds and improve matching algorithm.

**Fields:**
```sql
id                        UUID PRIMARY KEY
companion_connection_id   UUID → companion_connections.id
interaction_type          interaction_type
metadata                  JSONB                          -- Additional interaction data
points                    INTEGER (0-100, default 1)     -- Points awarded for this interaction
created_at                TIMESTAMP
```

**Point System:**
- `beneficial_given`: 2 points
- `comment_reply`: 3 points
- `halaqa_shared`: 5 points
- `knowledge_shared`: 5 points
- `message_sent`: 1 point
- `study_session`: 10 points

**Auto-updates:**
- Automatically increases `connection_strength` in `companion_connections`
- Updates `last_interaction` timestamp
- Used by algorithm to learn and improve matches

**Use Cases:**
- Track engagement between companions
- Reward meaningful interactions
- Identify strong vs weak connections
- Analytics for matching improvement

---

#### `study_partnerships`

**Purpose:** Manage study buddy relationships for accountability and mutual growth.

**Fields:**
```sql
id                  UUID PRIMARY KEY
partnership_type    partnership_type              -- Type of study partnership
partner_1_id        UUID → profiles.id            -- First partner
partner_2_id        UUID → profiles.id            -- Second partner
current_progress    JSONB                         -- Progress tracking data
goal                TEXT (max 1000 chars)         -- Partnership goal
target_date         DATE                          -- Target completion date
check_in_frequency  check_in_frequency            -- How often to check in
is_active           BOOLEAN (default true)        -- Partnership active?
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Progress Tracking (JSONB):**
```json
{
  "quran_memorization": {
    "current_surah": "Al-Mulk",
    "ayahs_memorized": 30,
    "target_ayahs": 100,
    "last_review": "2024-10-14"
  },
  "check_ins": [
    {
      "date": "2024-10-14",
      "partner_1_completed": true,
      "partner_2_completed": true,
      "notes": "Reviewed Al-Fatihah together"
    }
  ]
}
```

**Use Cases:**
- Quran memorization buddies
- Arabic language learning partners
- Book study groups (2-person)
- Accountability for Islamic studies

---

#### `mentor_relationships`

**Purpose:** Formal mentor-student relationships for Islamic knowledge transfer.

**Fields:**
```sql
id             UUID PRIMARY KEY
mentor_id      UUID → profiles.id         -- The mentor
student_id     UUID → profiles.id         -- The student
subject_areas  TEXT[]                     -- e.g., ['Quran', 'Arabic', 'Fiqh']
status         mentor_status              -- Current status
notes          TEXT (max 2000 chars)      -- Relationship notes
created_at     TIMESTAMP
updated_at     TIMESTAMP
ended_at       TIMESTAMP                  -- When ended (if not active)
```

**Subject Areas Examples:**
- `Quran Recitation & Tajweed`
- `Quran Tafsir`
- `Arabic Language`
- `Hadith Sciences`
- `Fiqh & Islamic Jurisprudence`
- `Aqeedah`
- `Islamic History`
- `Spirituality & Ihsan`

**Use Cases:**
- Connect knowledge seekers with scholars
- Track mentorship progress
- Manage multiple student relationships
- Complete mentorship cycles

---

### 3. 🔐 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

#### `companion_connections`
- ✅ View own connections (requester or recipient)
- ✅ Create connection requests (as requester)
- ✅ Update own connections (both parties)
- ✅ Delete own connections (both parties)

#### `user_matching_preferences`
- ✅ View own preferences
- ✅ Insert own preferences
- ✅ Update own preferences

#### `companion_interactions`
- ✅ View interactions for own connections
- ✅ Create interactions for accepted connections only

#### `study_partnerships`
- ✅ View own partnerships (partner 1 or 2)
- ✅ Create partnerships (as partner 1)
- ✅ Update own partnerships (both partners)
- ✅ Delete own partnerships (both partners)

#### `mentor_relationships`
- ✅ View own mentor relationships (mentor or student)
- ✅ Create relationships (as mentor)
- ✅ Update relationships (both parties)
- ✅ Delete relationships (both parties)

---

### 4. 🚀 Helper Functions

#### `calculate_companion_match_score(user1_id, user2_id)`

**Purpose:** Calculate compatibility score between two users (0-100).

**Algorithm:**
1. **Availability Check**: Return 0 if either user is unavailable
2. **Shared Interests** (0-40 points): Count common interests
3. **Activity Level** (0-30 points): Compare beneficial_count
4. **Mentor/Mentee Bonus** (+30 points): If perfect mentor match
5. **Weights Applied**: Based on user preferences

**Returns:** INTEGER (0-100)

**Usage:**
```sql
SELECT calculate_companion_match_score(
  'user-1-uuid',
  'user-2-uuid'
) as match_score;
```

#### `update_connection_strength()`

**Purpose:** Automatically increase connection strength when interactions occur.

**Trigger:** Fires after INSERT on `companion_interactions`

**Behavior:**
- Adds `points` from interaction to `connection_strength`
- Caps at 100
- Updates `last_interaction` timestamp

---

### 5. 📊 Views

#### `active_companion_connections`

**Purpose:** Easy access to active connections with user details.

**Fields:**
- All from `companion_connections`
- `requester_name`, `requester_username`, `requester_avatar`
- `recipient_name`, `recipient_username`, `recipient_avatar`

**Usage:**
```sql
SELECT * FROM active_companion_connections
WHERE requester_id = auth.uid() OR recipient_id = auth.uid();
```

#### `mentor_mentee_matches`

**Purpose:** Find potential mentor-student matches with compatibility scores.

**Fields:**
- Mentor details (id, name, username, avatar, beneficial_count, subjects)
- Seeker details (id, name, username, avatar)
- `match_score` (calculated automatically)

**Usage:**
```sql
SELECT * FROM mentor_mentee_matches
WHERE seeker_id = auth.uid()
ORDER BY match_score DESC
LIMIT 10;
```

---

### 6. 🔄 Triggers

All companion tables have automatic `updated_at` triggers:
- `companion_connections`
- `user_matching_preferences`
- `study_partnerships`
- `mentor_relationships`

**Additional Trigger:**
- `update_connection_strength_trigger` on `companion_interactions`

---

### 7. 📈 Indexes

Performance-optimized indexes on all tables:

**Key Indexes:**
- `profiles_companion_matching_idx`: Fast companion searches
- `companion_connections_status_idx`: Filter by status
- `companion_connections_strength_idx`: Sort by bond strength
- `study_partnerships_active_idx`: Find active partnerships
- `mentor_relationships_active_idx`: Find active mentorships

---

### 8. 🎯 Integration Points

The Companion System integrates with existing features:

#### **Al-Minbar (Feed)**
- See companion activity
- Interact with companion posts
- Earn interaction points

#### **Halaqas**
- Invite companions to halaqas
- Study with companions
- Earn interaction points

#### **Al-Hikmah (Knowledge)**
- Share knowledge with companions
- Study resources together
- Track study progress

#### **Tools**
- Prayer time reminders with companions
- Qibla finder sharing
- Tasbih counter challenges

#### **Profile**
- Display active companions
- Show connection strength
- Manage preferences

---

### 9. 🔧 Next Steps

**Phase 2 - Backend API:**
1. Create Supabase Edge Functions for matching algorithm
2. Build connection request handlers
3. Implement interaction tracking
4. Add real-time connection notifications

**Phase 3 - Frontend UI:**
1. Companion discovery page
2. Connection request notifications
3. Companion profile cards
4. Study partnership dashboard
5. Mentor/mentee interface

---

### 10. 📝 Example Queries

#### Find Compatible Companions
```sql
SELECT 
  p.*,
  calculate_companion_match_score(auth.uid(), p.id) as match_score
FROM profiles p
WHERE p.is_available_for_connections = true
  AND p.id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM companion_connections cc
    WHERE (cc.requester_id = auth.uid() AND cc.recipient_id = p.id)
       OR (cc.requester_id = p.id AND cc.recipient_id = auth.uid())
  )
ORDER BY match_score DESC
LIMIT 20;
```

#### Get User's Active Companions
```sql
SELECT * FROM active_companion_connections
WHERE (requester_id = auth.uid() OR recipient_id = auth.uid())
  AND status = 'accepted'
ORDER BY connection_strength DESC, last_interaction DESC;
```

#### Track Study Partnership Progress
```sql
SELECT 
  sp.*,
  p1.full_name as partner_1_name,
  p2.full_name as partner_2_name
FROM study_partnerships sp
JOIN profiles p1 ON sp.partner_1_id = p1.id
JOIN profiles p2 ON sp.partner_2_id = p2.id
WHERE (sp.partner_1_id = auth.uid() OR sp.partner_2_id = auth.uid())
  AND sp.is_active = true;
```

#### Find Available Mentors
```sql
SELECT * FROM mentor_mentee_matches
WHERE seeker_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM mentor_relationships mr
    WHERE mr.student_id = auth.uid() 
      AND mr.mentor_id = mentor_id
      AND mr.status IN ('active', 'paused')
  )
ORDER BY match_score DESC
LIMIT 10;
```

---

## 🎉 Summary

The Companion System database schema provides:
- ✅ **5 Core Tables**: Connections, Preferences, Interactions, Partnerships, Mentorships
- ✅ **8 Enum Types**: For type safety and consistency
- ✅ **Smart Matching**: Algorithm-based compatibility scoring
- ✅ **Full Security**: RLS policies on all tables
- ✅ **Auto-tracking**: Triggers for interactions and timestamps
- ✅ **Easy Querying**: Helper functions and views
- ✅ **Scalable**: Optimized indexes for performance

This schema is ready for migration to your Supabase database! 🚀

