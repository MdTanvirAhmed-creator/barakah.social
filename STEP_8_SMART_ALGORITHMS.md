# Step 8: Companion-Aware Algorithm Updates - Complete Documentation

## Overview

Step 8 implements intelligent algorithms that integrate companion data throughout the platform, making content discovery and matching significantly more personalized and relevant.

---

## 🎯 What Was Built

### 1. **Feed Algorithm** (`src/lib/feed-algorithm.ts`)
Companion-aware content ranking system for the "For You" feed.

### 2. **Companion Matcher** (`src/lib/companions/matcher.ts`)
Sophisticated matching algorithm that finds compatible companions.

### 3. **Notification System** (`src/lib/companions/notifications.ts`)
Companion-aware notification preferences and delivery system.

---

## 📊 Feed Algorithm (`feed-algorithm.ts`)

### Purpose
Ranks content for the "For You" feed based on user preferences, companion interactions, and content quality.

### Key Features

#### **Content Boosting**:
- **Companion Content**: 1.5x weight multiplier + bonus points
- **Companion Interactions**: +20-40 points if companions liked/commented
- **Companion-of-Companion**: 0.75x weight for 2nd degree connections
- **Shows "Your companion liked this"** indicators

#### **Scoring Factors** (Total: 0-100+ points):
1. **Engagement Score** (0-50 points)
   - Beneficial marks × 2
   - Comments × 3
   - Capped at 50

2. **Recency Score** (0-30 points)
   - Loses 5 points per day
   - Fresh content prioritized

3. **Quality Indicators** (0-20 points)
   - Well-formatted content (+10)
   - Pinned posts (+10)

4. **Companion Boost** (1.5x multiplier)
   - Content from direct companions
   - Automatic 50% score increase

5. **Companion Interaction Boost** (+20-40 points)
   - Companions liked/commented
   - Shows which companion interacted

6. **2nd Degree Boost** (0.75x multiplier)
   - Content from companion's companions
   - Expands discovery

### Main Functions

#### `getForYouFeed(options)`
```typescript
interface FeedAlgorithmOptions {
  userId: string;
  limit?: number; // Default: 50
  includeCompanionOfCompanion?: boolean; // Default: true
  timeDecayHours?: number; // Default: 168 (1 week)
}

// Returns: ScoredPost[] - sorted by score
```

**Example Usage**:
```typescript
import { getForYouFeed } from "@/lib/feed-algorithm";

const feed = await getForYouFeed({
  userId: currentUser.id,
  limit: 20,
  includeCompanionOfCompanion: true,
});

// Each post includes:
// - score: number (ranking)
// - boostReasons: string[] (why it was boosted)
// - companionInteraction?: { companionName, action }
```

#### `getTrendingPosts(userId, limit)`
Gets trending posts with companion awareness.

**Features**:
- Last 48 hours only
- Minimum 5 beneficial marks
- Companion content boosted 1.3x
- Sorted by adjusted score

---

## 🤝 Companion Matcher (`matcher.ts`)

### Purpose
Finds highly compatible companions using multi-factor analysis.

### Compatibility Factors (Total: 0-100 points)

#### 1. **Halaqa Overlap** (0-25 points)
- **Scoring**: 10 points per shared Halaqa, max 25
- **Why**: Shared community = strong foundation
- **Shows**: List of shared Halaqa names

#### 2. **Content Overlap** (0-20 points)
- **Scoring**: Based on % of overlapping beneficial marks
- **Why**: Similar content preferences = aligned interests
- **Algorithm**: Compares last 50 beneficial marks

#### 3. **Activity Pattern Match** (0-15 points)
- **Scoring**: Based on last_active timestamps
  - Same day: 15 points
  - Within 3 days: 10 points
  - Within week: 5 points
- **Why**: Similar schedules = better interaction timing
- **Future**: Will analyze hourly activity logs

#### 4. **Interaction Style** (0-15 points)
- **Scoring**: Based on beneficial_count similarity
- **Why**: Similar engagement levels = compatible interaction
- **Algorithm**: Ratio of activity levels

#### 5. **Geographic Proximity** (0-10 points)
- **Scoring**:
  - Exact location match: 10 points
  - Same city/region: 7 points
  - Different: 0 points
- **Why**: Local companions enable in-person meetups
- **Future**: Will use geocoding for distance-based scoring

#### 6. **Interest Alignment** (0-15 points)
- **Scoring**: 5 points per shared interest, max 15
- **Why**: Common interests = conversation starters
- **Algorithm**: Compares interests arrays

### Main Functions

#### `findCompanionMatches(options)`
```typescript
interface MatchingOptions {
  userId: string;
  limit?: number; // Default: 10
  minScore?: number; // Default: 30
  excludeExistingConnections?: boolean; // Default: true
  preferredInterests?: string[];
  locationRadius?: number; // in km
}

// Returns: CompanionMatch[] - sorted by score
```

**Example Usage**:
```typescript
import { findCompanionMatches } from "@/lib/companions/matcher";

const matches = await findCompanionMatches({
  userId: currentUser.id,
  limit: 10,
  minScore: 40, // Only high compatibility
  preferredInterests: ["Quran", "Hadith"],
});

// Each match includes:
// - compatibilityScore: 0-100
// - factors: breakdown of score
// - matchReasons: ["3 shared Halaqas", "Similar content preferences"]
// - sharedHalaqas: ["Tafsir Study", "Arabic Learning"]
```

#### `findStudyPartners(userId, topic, limit)`
Finds companions interested in a specific topic.

**Example**:
```typescript
const partners = await findStudyPartners(
  userId,
  "Arabic",
  5
);
// Returns companions with "Arabic" in interests
```

#### `findMentors(userId, subjectArea?, limit)`
Finds users available as mentors.

**Features**:
- Queries `user_matching_preferences` for `can_be_mentor = true`
- +10 bonus points
- Can filter by subject area

---

## 🔔 Notification System (`notifications.ts`)

### Purpose
Manages companion-aware notifications with granular preferences.

### Notification Types

1. **`companion_new_post`**
   - Triggered when companion posts new content
   - Shows post preview (first 100 chars)
   - Links to post

2. **`companion_joined_halaqa`**
   - Triggered when companion joins a Halaqa
   - Shows Halaqa name
   - Links to Halaqa

3. **`companion_weekly_digest`**
   - Weekly summary of companion activity
   - Configurable day and time
   - Shows highlights

4. **`companion_beneficial_mark`**
   - Companion liked your content
   - Shows which post

5. **`companion_comment`**
   - Companion commented on your post
   - Shows comment preview

6. **`companion_study_invitation`**
   - Companion invites you to study together
   - Shows study topic

7. **`companion_milestone`**
   - Companion achieves milestone (100 beneficial, etc.)
   - Celebrates together

### Preferences Structure

```typescript
interface CompanionNotificationPreferences {
  user_id: string;
  companion_new_post: boolean; // Default: true
  companion_joined_halaqa: boolean; // Default: true
  companion_weekly_digest: boolean; // Default: true
  companion_beneficial_mark: boolean; // Default: true
  companion_comment: boolean; // Default: true
  companion_study_invitation: boolean; // Default: true
  companion_milestone: boolean; // Default: true
  digest_day: "monday" | "friday" | "sunday"; // Default: "friday"
  digest_time: string; // "09:00" format
  enabled: boolean; // Master switch
}
```

### Main Functions

#### `getCompanionNotificationPreferences(userId)`
Gets user's notification preferences (with defaults if not set).

#### `updateCompanionNotificationPreferences(userId, preferences)`
Updates specific preferences.

**Example**:
```typescript
import { updateCompanionNotificationPreferences } from "@/lib/companions/notifications";

await updateCompanionNotificationPreferences(userId, {
  companion_new_post: true,
  companion_weekly_digest: true,
  digest_day: "friday",
  digest_time: "09:00",
});
```

#### `createCompanionNotification(userId, type, companionId, metadata)`
Creates a new notification (respects preferences).

#### `getCompanionNotifications(userId, limit, unreadOnly)`
Gets recent notifications.

#### `generateWeeklyDigest(userId)`
Generates weekly activity summary.

**Returns**:
```typescript
{
  totalInteractions: number;
  newPosts: number;
  newHalaqaJoins: number;
  topCompanion: { name: string; interactions: number } | null;
  highlights: string[];
}
```

**Example Digest**:
```
This Week with Your Companions:

- 5 new posts from your companions
- 2 companions joined new Halaqas
- Ahmad Ibn Abdullah was most active with 12 interactions
- Total: 23 interactions across your companion network
```

---

## 🚀 Integration Examples

### 1. **Feed Page Integration**

```typescript
// src/app/(platform)/feed/page.tsx
import { getForYouFeed } from "@/lib/feed-algorithm";
import { useEffect, useState } from "react";

function FeedPage() {
  const [posts, setPosts] = useState<ScoredPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const feed = await getForYouFeed({
        userId: user.id,
        limit: 20,
      });

      setPosts(feed);
      setLoading(false);
    }
    loadFeed();
  }, []);

  return (
    <div>
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post}
          // Show companion indicator
          companionInteraction={post.companionInteraction}
          boostReasons={post.boostReasons}
        />
      ))}
    </div>
  );
}
```

### 2. **Companion Discovery Integration**

```typescript
// src/app/(platform)/tools/companions/page.tsx
import { findCompanionMatches } from "@/lib/companions/matcher";

async function loadMatches() {
  const matches = await findCompanionMatches({
    userId: currentUser.id,
    limit: 10,
    minScore: 40,
  });

  // Display matches with compatibility scores
  matches.forEach(match => {
    console.log(`${match.full_name}: ${match.compatibilityScore}%`);
    console.log(`Reasons: ${match.matchReasons.join(", ")}`);
    console.log(`Shared Halaqas: ${match.sharedHalaqas.join(", ")}`);
  });
}
```

### 3. **Notification Settings Page**

```typescript
// src/app/(platform)/settings/notifications/page.tsx
import { 
  getCompanionNotificationPreferences,
  updateCompanionNotificationPreferences
} from "@/lib/companions/notifications";

function NotificationSettings() {
  const [prefs, setPrefs] = useState<CompanionNotificationPreferences>();

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    const preferences = await getCompanionNotificationPreferences(userId);
    setPrefs(preferences);
  }

  async function handleToggle(key: string, value: boolean) {
    await updateCompanionNotificationPreferences(userId, {
      [key]: value,
    });
    toast.success("Preferences updated!");
  }

  return (
    <div>
      <h2>Companion Notifications</h2>
      <Switch
        checked={prefs?.companion_new_post}
        onChange={(v) => handleToggle("companion_new_post", v)}
        label="New posts from companions"
      />
      {/* More switches... */}
    </div>
  );
}
```

---

## 📊 Algorithm Performance

### Feed Algorithm Complexity:
- **Time**: O(n log n) for sorting n posts
- **Space**: O(n + m) where m = number of companions
- **Database Queries**: 3-5 queries per feed load
- **Optimization**: Caches companion list, uses single JOIN query

### Matcher Algorithm Complexity:
- **Time**: O(n × k) where n = candidates, k = complexity calculation
- **Space**: O(n)
- **Database Queries**: 2-4 queries per candidate
- **Optimization**: Limits candidates to 100, parallelizable

### Notification System Complexity:
- **Time**: O(1) for single notification
- **Space**: O(1)
- **Database Queries**: 1-2 per notification
- **Optimization**: Batch processing possible

---

## 🔧 Database Requirements

### Tables Needed (if not exist):
```sql
-- Companion notification preferences
CREATE TABLE IF NOT EXISTS companion_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  companion_new_post BOOLEAN DEFAULT true,
  companion_joined_halaqa BOOLEAN DEFAULT true,
  companion_weekly_digest BOOLEAN DEFAULT true,
  companion_beneficial_mark BOOLEAN DEFAULT true,
  companion_comment BOOLEAN DEFAULT true,
  companion_study_invitation BOOLEAN DEFAULT true,
  companion_milestone BOOLEAN DEFAULT true,
  digest_day TEXT DEFAULT 'friday',
  digest_time TEXT DEFAULT '09:00',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companion notifications
CREATE TABLE IF NOT EXISTS companion_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  companion_id UUID REFERENCES profiles(id),
  companion_name TEXT NOT NULL,
  companion_avatar_url TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companion_notifications_user 
  ON companion_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companion_notifications_unread 
  ON companion_notifications(user_id, read) WHERE read = false;
```

---

## 🧪 Testing Guide

### Test Feed Algorithm:
```typescript
// Test with mock user
const feed = await getForYouFeed({
  userId: "test-user-id",
  limit: 10,
});

console.log("Feed loaded:", feed.length, "posts");
feed.forEach(post => {
  console.log(`Score: ${post.score}, Reasons: ${post.boostReasons.join(", ")}`);
  if (post.companionInteraction) {
    console.log(`  → ${post.companionInteraction.companionName} ${post.companionInteraction.action} this`);
  }
});
```

### Test Matcher:
```typescript
// Find matches
const matches = await findCompanionMatches({
  userId: "test-user-id",
  limit: 5,
  minScore: 30,
});

console.log("Found", matches.length, "matches");
matches.forEach(match => {
  console.log(`\n${match.full_name} (${match.compatibilityScore}%)`);
  console.log(`  Factors:`, match.factors);
  console.log(`  Reasons:`, match.matchReasons.join(", "));
  console.log(`  Shared:`, match.sharedHalaqas.join(", "));
});
```

### Test Notifications:
```typescript
// Create test notification
await createCompanionNotification(
  "user-id",
  "companion_new_post",
  "companion-id",
  {
    title: "Test Notification",
    message: "This is a test message",
    link: "/test",
  }
);

// Get notifications
const notifications = await getCompanionNotifications("user-id", 10);
console.log("Unread:", notifications.filter(n => !n.read).length);
```

---

## 🎯 Success Metrics

### Feed Algorithm:
- ✅ Companion content boosted 1.5x
- ✅ Shows companion interaction indicators
- ✅ Includes 2nd degree connections
- ✅ Recency decay implemented
- ✅ Quality signals integrated

### Matcher Algorithm:
- ✅ 6 compatibility factors
- ✅ Scores from 0-100
- ✅ Match reasons explained
- ✅ Shared Halaqas shown
- ✅ Study partner & mentor finding

### Notification System:
- ✅ 7 notification types
- ✅ Granular preferences
- ✅ Weekly digest generation
- ✅ Respects user preferences
- ✅ Includes companion details

---

## 📚 Files Created

1. **`src/lib/feed-algorithm.ts`** (400+ lines)
   - getForYouFeed()
   - getTrendingPosts()
   - Companion boosting logic

2. **`src/lib/companions/matcher.ts`** (600+ lines)
   - findCompanionMatches()
   - findStudyPartners()
   - findMentors()
   - Compatibility calculation

3. **`src/lib/companions/notifications.ts`** (400+ lines)
   - Notification CRUD operations
   - Preference management
   - Weekly digest generation
   - Notification triggers

---

## 🚀 Future Enhancements

### Feed Algorithm:
1. **Machine Learning**: Train on user interactions
2. **A/B Testing**: Test different boost multipliers
3. **Personalization**: Learn individual preferences
4. **Real-time**: Update scores based on live interactions

### Matcher Algorithm:
1. **AI-Powered**: Use embeddings for deeper analysis
2. **Temporal Patterns**: Analyze hourly activity logs
3. **Communication Style**: Analyze post/comment style
4. **Learning Rate**: Improve over time with feedback

### Notifications:
1. **Push Notifications**: Mobile/browser push
2. **Email Digests**: Beautiful HTML emails
3. **Smart Bundling**: Group related notifications
4. **Quiet Hours**: Respect user schedule

---

**Step 8 Complete! All smart algorithms implemented and ready for integration! 🎉**

