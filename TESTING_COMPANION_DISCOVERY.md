# Testing Companion Discovery in Halaqas

## 🎯 Quick Testing Guide

### Prerequisites
1. ✅ Dev server is running (`npm run dev`)
2. ✅ Supabase migration 002 applied
3. ✅ At least 2 user accounts for testing
4. ✅ At least 1 Halaqa with multiple members

---

## 🧪 Test Scenarios

### Scenario 1: View Companion Matches in a Halaqa

**Steps:**
1. Navigate to a Halaqa detail page: `http://localhost:3000/halaqas/[halaqa-id]`
2. Check the sidebar on the right
3. Look for the "Find Companions Here" section

**Expected Results:**
- ✅ Section appears if there are compatible members (top 3)
- ✅ Each match shows:
  - Avatar
  - Name and username
  - Compatibility percentage
  - Match quality label (Excellent/Good/Potential)
  - Shared interests
  - Personality traits (if set)
  - "Send Salam & Connect" button

**Edge Cases:**
- If you're the only member: Section doesn't appear ✅
- If already connected to all members: Section doesn't appear ✅
- If no compatible members: Section doesn't appear ✅

---

### Scenario 2: Send a Connection Request

**Steps:**
1. From a Halaqa detail page, find a companion match
2. Click "Send Salam & Connect"
3. Watch for success notification

**Expected Results:**
- ✅ Button shows "Sending..." during request
- ✅ Success notification appears: "Salam sent to [Name]!"
- ✅ Connection request is created in `companion_connections` table
- ✅ Recipient sees notification in their companion dropdown (sidebar)

**Database Verification:**
```sql
SELECT * FROM companion_connections 
WHERE requester_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Edge Cases:**
- Already sent request: Shows "Connection request already pending" ✅
- Already companions: Shows "Already companions!" ✅
- User not logged in: Shows "Please log in to bookmark" (or similar) ✅

---

### Scenario 3: Create Halaqa with Companion Discovery

**Steps:**
1. Navigate to Halaqas page: `http://localhost:3000/halaqas`
2. Click "+ Create Halaqa" button
3. Fill in required fields:
   - Name: "Test Halaqa"
   - Description: "This is a test halaqa for companion discovery"
   - Category: Select any (e.g., "Quran")
   - Max Members: 50
   - Rules: Add at least one rule
4. Observe the "Find Companions Interested in [Category]" section
5. Verify toggle is ON by default
6. Try toggling it OFF and back ON
7. Submit the form

**Expected Results:**
- ✅ Toggle is enabled by default
- ✅ Toggle changes color and position on click
- ✅ Success indicator appears when enabled
- ✅ Label dynamically updates with selected category
- ✅ Halaqa is created successfully
- ✅ `enable_companion_discovery` field is saved (if DB column exists)

**Visual Checks:**
- ✅ Gradient background (primary to secondary)
- ✅ Border with primary color
- ✅ Sparkle icon next to title
- ✅ UserPlus icon in success message

---

### Scenario 4: Companion Notification Dropdown

**Steps:**
1. Log in as User A
2. Send connection request to User B
3. Log out and log in as User B
4. Look at the sidebar
5. Find the bell icon (companion notifications)
6. Check for pending requests badge

**Expected Results:**
- ✅ Bell icon shows count badge if there are pending requests
- ✅ Clicking bell opens dropdown
- ✅ Pending requests are listed with:
  - Requester avatar and name
  - Relative time ("2 minutes ago")
  - Optional message
  - Accept and Decline buttons
- ✅ Clicking Accept updates connection status to "accepted"
- ✅ Clicking Decline updates connection status to "declined"
- ✅ Success notifications appear for each action

**Database Verification:**
```sql
-- Check connection status
SELECT status, created_at, updated_at 
FROM companion_connections 
WHERE recipient_id = 'user-b-id' 
AND requester_id = 'user-a-id';
```

---

## 🔍 Debugging Tips

### Issue: Companion matches not appearing

**Check:**
1. Console errors in browser DevTools
2. Halaqa has at least 2 members:
   ```sql
   SELECT COUNT(*) FROM halaqa_members WHERE halaqa_id = 'your-halaqa-id';
   ```
3. Users have interests set:
   ```sql
   SELECT id, username, interests FROM profiles;
   ```
4. Users are available for connections:
   ```sql
   SELECT id, username, is_available_for_connections 
   FROM profiles 
   WHERE is_available_for_connections = true;
   ```

### Issue: Connection request fails

**Check:**
1. User is authenticated
2. No existing connection between users:
   ```sql
   SELECT * FROM companion_connections 
   WHERE (requester_id = 'user-a' AND recipient_id = 'user-b')
   OR (requester_id = 'user-b' AND recipient_id = 'user-a');
   ```
3. RLS policies allow insert:
   ```sql
   -- Should return true
   SELECT can_insert_companion_connections('user-a-id', 'user-b-id');
   ```

### Issue: Compatibility score seems wrong

**Debug:**
```typescript
// In useHalaqaCompanions.ts, add console.log:
console.log('Shared interests:', sharedInterests);
console.log('Activity score:', activityScore);
console.log('Final compatibility:', score);
```

---

## 📊 Compatibility Score Examples

### Example 1: Perfect Match (100%)
- **User A**: interests = ['Quran', 'Hadith', 'Fiqh'], beneficial_count = 50
- **User B**: interests = ['Quran', 'Hadith', 'Fiqh'], beneficial_count = 52
- **Score**: 50 (base) + 30 (3 shared interests) + 20 (similar activity) = 100%

### Example 2: Good Match (75%)
- **User A**: interests = ['Quran', 'Hadith'], beneficial_count = 30
- **User B**: interests = ['Quran', 'Arabic'], beneficial_count = 35
- **Score**: 50 (base) + 10 (1 shared interest) + 15 (somewhat similar activity) = 75%

### Example 3: Potential Match (55%)
- **User A**: interests = ['History'], beneficial_count = 10
- **User B**: interests = ['Finance'], beneficial_count = 8
- **Score**: 50 (base) + 0 (no shared interests) + 5 (low activity for both) = 55%

---

## 🎨 UI/UX Checklist

### CompanionDiscoveryCard
- [ ] Gradient header is visible
- [ ] Sparkles icon in header
- [ ] Match cards have proper spacing
- [ ] Avatars have gradient fallback
- [ ] Compatibility badges have correct colors:
  - Green for 80%+ (Excellent)
  - Yellow for 60-79% (Good)
  - Blue for 50-59% (Potential)
- [ ] Shared interests render as pills
- [ ] Connect button is full-width
- [ ] Footer motivation message is visible
- [ ] Animations on card appearance

### Halaqa Creation Modal
- [ ] Companion discovery section has gradient background
- [ ] Toggle switch animates smoothly
- [ ] Toggle changes from gray to blue when enabled
- [ ] Category name updates dynamically
- [ ] Success indicator appears when enabled
- [ ] Section is above "Cover Image Upload"

### Companion Dropdown
- [ ] Bell icon visible in sidebar
- [ ] Badge shows correct count
- [ ] Dropdown appears on click
- [ ] Pending requests have avatars
- [ ] Accept/Decline buttons work
- [ ] Loading state during actions
- [ ] Dropdown closes after action

---

## 🚀 Performance Checks

### Load Times
- [ ] Halaqa page loads in < 2 seconds
- [ ] Companion matches calculate in < 500ms
- [ ] No blocking renders
- [ ] Smooth scrolling in dropdown

### API Calls
- [ ] Only 1 query to fetch Halaqa members
- [ ] No unnecessary re-fetches
- [ ] Real-time updates work (if implemented)

---

## 🔐 Security Checks

### Authentication
- [ ] Unauthenticated users can't send connection requests
- [ ] Unauthenticated users redirected to login
- [ ] Auth state persists across page refreshes

### Authorization
- [ ] Users can only see connections they're part of
- [ ] Users can't accept/decline connections they didn't receive
- [ ] RLS policies prevent unauthorized access

### Data Validation
- [ ] Can't send connection to self
- [ ] Can't create duplicate connections
- [ ] Invalid user IDs are rejected

---

## 📸 Screenshots Checklist

Take screenshots for documentation:
1. Halaqa detail page with companion discovery card
2. Companion match card showing 100% compatibility
3. Halaqa creation modal with companion toggle enabled
4. Companion notification dropdown with pending requests
5. Success notification after sending Salam

---

## ✅ Final Verification

Before marking as complete, verify:
- [ ] All 4 test scenarios pass
- [ ] No console errors
- [ ] No linter warnings
- [ ] Mobile responsive (test at 375px width)
- [ ] Dark mode works correctly
- [ ] All animations are smooth
- [ ] Database queries are efficient
- [ ] Documentation is updated

---

## 🎓 Next Steps

After testing is complete:
1. **Step 5**: Add "My Companions" section to Profile page
2. **Step 6**: Create global Companion Discovery page
3. **Step 7**: Add study partnership features
4. **Step 8**: Implement mentor matching

---

*Happy Testing! 🧪*

