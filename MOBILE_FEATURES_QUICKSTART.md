# Mobile Companion Features - Quick Start Guide

## 🚀 Quick Integration

### 1. Wrap Posts with Swipe Gestures (Feed, Halaqas, Profile)

```typescript
import { SwipeablePost } from "@/components/mobile/SwipeablePost";

// In your feed/post rendering:
<SwipeablePost
  postId={post.id}
  authorId={post.author_id}
  authorName={post.author.full_name}
  author AcceptsCompanions={post.author.is_available_for_connections}
  isBookmarked={post.is_bookmarked}
>
  <PostCard post={post} />
</SwipeablePost>
```

**What users can do**:
- **Swipe right** → View if author accepts companions / Send connection
- **Swipe left** → Bookmark / Save for later

---

### 2. Companion Tab Already Added!

The mobile nav now has a **"Companions"** tab (4th position) that:
- Shows badge for pending requests
- Shows sparkle for new matches
- Opens bottom sheet when tapped

**No code needed!** It's automatic. 🎉

---

### 3. Use Bottom Sheet Anywhere (Optional)

```typescript
import { CompanionBottomSheet } from "@/components/mobile/CompanionBottomSheet";
import { useState } from "react";

function MyComponent() {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <button onClick={() => setShowSheet(true)}>
        See Daily Matches
      </button>

      <CompanionBottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        suggestions={dailyMatches} // optional
      />
    </>
  );
}
```

---

## 📱 Test on Mobile

### To test SwipeablePost:
1. Open http://localhost:3000/feed on mobile
2. Swipe any post **right** → See companion action
3. Swipe any post **left** → See bookmark action

### To test Bottom Sheet:
1. Open mobile view
2. Tap **"Companions"** in bottom navigation
3. Bottom sheet slides up!
4. Swipe through suggestions
5. Tap "Send Salam" to connect

### To test Mobile Nav:
1. Mobile view
2. Look at bottom nav
3. See **Handshake icon** (Companions tab)
4. Badge shows if you have pending requests
5. Sparkle shows if new matches available

---

## 🎨 Visual Guide

### SwipeablePost:

```
Swipe Right →
┌─────────────────────┐
│  👤 Ahmad posted... │
│  ← [UserPlus Icon] │ ← Green background
│  "Connect"          │
└─────────────────────┘

Swipe Left ←
┌─────────────────────┐
│  👤 Ahmad posted... │
│  [Bookmark Icon] → │ ← Blue background
│  "Save"             │
└─────────────────────┘
```

### Bottom Sheet:

```
Tap "Companions" →

┌─────────────────────┐
│     ════════        │ ← Drag handle
│                     │
│  Daily Matches  ✕   │
│  1 of 3 companions  │
├─────────────────────┤
│                     │
│  [Detailed Card]    │
│  Ahmad Ibn Abdullah │
│  92% Match          │
│                     │
│  Why We Matched:    │
│  You both love...   │
│                     │
├─────────────────────┤
│ [←] [Send Salam] [→]│
│      ● ○ ○          │
└─────────────────────┘
```

### Mobile Nav:

```
┌──────────────────────────────────┐
│ 🏠  👥   📚   🤝   👤            │
│Feed Hal. Hik. Comp. Prof.        │
│              ↑                    │
│          (Badge: 2)               │
│          (Sparkle ✨)             │
└──────────────────────────────────┘
```

---

## ⚡ Performance Tips

1. **Only wrap posts with SwipeablePost on mobile**:
```typescript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

{isMobile ? (
  <SwipeablePost {...props}>
    <PostCard />
  </SwipeablePost>
) : (
  <PostCard />
)}
```

2. **Lazy load Bottom Sheet**:
```typescript
const CompanionBottomSheet = dynamic(
  () => import('@/components/mobile/CompanionBottomSheet'),
  { ssr: false }
);
```

3. **Memoize post data**:
```typescript
const memoizedPosts = useMemo(() => posts, [posts]);
```

---

## 🐛 Troubleshooting

### Swipe not working?
- Check: Is viewport mobile-sized?
- Check: Is `framer-motion` installed?
- Check: Any parent with `overflow: hidden`?

### Bottom sheet not opening?
- Check: Is `showBottomSheet` prop set?
- Check: Is mobile nav rendered?
- Check: Console for errors?

### Badge not showing?
- Check: Do you have pending requests?
- Check: Is `useCompanionData` working?
- Check: Supabase connection?

---

## 📖 Full Documentation

- **Complete Guide**: `STEP_10_MOBILE_OPTIMIZATIONS.md`
- **Component Props**: See documentation above
- **Examples**: This file

---

## 🎯 Next Steps

1. ✅ Visit `/feed` on mobile
2. ✅ Swipe posts left/right
3. ✅ Tap "Companions" in mobile nav
4. ✅ Swipe through suggestions
5. ✅ Send your first mobile Salam! 🤲

---

**Mobile features are ready! Test on your phone now! 📱**

