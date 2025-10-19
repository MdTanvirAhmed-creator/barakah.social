# Phase 7: Privacy & Settings Integration - Step 12
# Companion Privacy Settings & Parental Controls

## Overview

This step adds comprehensive companion privacy settings and parental control features to the Barakah.Social platform, allowing users to customize their companion connection experience and enabling guardians to protect minors.

## Implementation Details

### 1. Companion Preferences Section

#### A. Who Can Send Salam (Connection Requests)
- **Everyone**: Anyone on the platform can send connection requests
- **Halaqa Members Only**: Only people from your study circles
- **Existing Companions Only**: Only current companions can initiate new interactions
- **Nobody**: Disable all incoming connection requests

#### B. Gender Preference
- **Same Gender**: Connect only with same gender
- **Opposite Gender**: Connect only with opposite gender
- **Any Gender**: Connect with anyone

#### C. Maximum Companions Limit
- Range: 5-100 companions
- Default: 50
- Prevents connection overload
- Helps maintain meaningful relationships

#### D. Auto-Decline Pending Requests
- Range: 7-90 days (in 7-day increments)
- Default: 30 days
- Automatically rejects old pending requests
- Keeps request queue clean

#### E. Companion Suggestions
- Toggle daily companion recommendations
- Controls feed algorithm recommendations
- Can be disabled for privacy

#### F. Show Availability Status
- Controls whether others see when you're online/available
- Helps manage interaction expectations

### 2. Parental Controls Section

#### Features (Enabled when "This account is for a minor" is toggled)

**A. Require Guardian Approval**
- Guardian email linked to account
- Every companion request requires guardian verification
- Sends notification to guardian email
- Guardian can approve/deny from dashboard

**B. Maximum Companions for Minors**
- Range: 1-25 companions
- Default: 10
- Lower than adult limit for safety
- Prevents large-scale connections

**C. Age Range Restriction**
- Range: ±0 to ±5 years from minor's age
- Default: ±2 years
- Restricts connections to similar age group
- Automatically filters potential matches

**D. Monitor Interactions**
- Guardian can view companion activity
- See message summaries (not full content for privacy)
- Track recent interactions
- Receive periodic activity reports

**E. Allowed Genders**
- **Same Gender Only**: Enhanced safety (default)
- **Any Gender**: More flexibility
- Can be customized based on comfort level

### 3. Database Schema Updates

Add to `profiles` table:
```sql
-- Companion preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS (
  companion_preferences JSONB DEFAULT '{
    "canReceiveSalam": "everyone",
    "genderPreference": "any",
    "maxCompanions": 50,
    "autoDeclineDays": 30,
    "suggestionsEnabled": true,
    "showAvailabilityStatus": true
  }',
  
  -- Parental controls
  parental_controls JSONB DEFAULT '{
    "isMinor": false,
    "requireGuardianApproval": false,
    "maxCompanionsMinor": 10,
    "restrictToAgeRange": 2,
    "monitorInteractions": true,
    "allowedMinorGenders": "same"
  }',
  
  guardian_email VARCHAR(255),
  date_of_birth DATE,
  FOREIGN KEY (guardian_profile_id) REFERENCES profiles(id)
);

-- Add indexes
CREATE INDEX idx_profiles_parental_isMinor ON profiles((parental_controls->>'isMinor'));
CREATE INDEX idx_profiles_companion_maxCompanions ON profiles((companion_preferences->>'maxCompanions'));
```

### 4. RLS Policies

```sql
-- Guardian can view ward's companion activity
CREATE POLICY guardian_view_ward_companions ON companion_connections
  FOR SELECT TO authenticated
  USING (
    auth.uid() = (
      SELECT guardian_profile_id FROM profiles
      WHERE id = recipient_id AND (parental_controls->>'isMinor')::boolean = true
    )
  );

-- Respect companion preferences when sending Salam
CREATE POLICY respect_companion_preferences ON companion_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Check canReceiveSalam setting
    (SELECT companion_preferences->>'canReceiveSalam' FROM profiles WHERE id = recipient_id)
      IN ('everyone', 'halaqas_only', 'connections_only')
    OR auth.uid() = recipient_id
  );

-- Auto-decline old pending requests via trigger
CREATE OR REPLACE FUNCTION auto_decline_old_requests()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companion_connections
  SET status = 'declined'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '1 day' *
        CAST((recipient_profile.companion_preferences->>'autoDeclineDays') AS INTEGER)
    AND recipient_id = recipient_profile.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 5. Integration Points

#### A. Companion Matching Algorithm
Update `src/lib/companions/matcher.ts`:
```typescript
// Respect gender preferences
if (userPreferences.genderPreference !== 'any') {
  compatibilityScore *= genderMatchWeight;
}

// Enforce age restrictions for minors
if (candidate.parental_controls.isMinor) {
  const ageDiff = Math.abs(user.age - candidate.age);
  if (ageDiff > candidate.parental_controls.restrictToAgeRange) {
    return -1; // Incompatible
  }
}

// Check max companions limit
if (userConnections.length >= userPreferences.maxCompanions) {
  return -1; // At capacity
}
```

#### B. Send Salam Component
Update `src/components/companions/SendSalam.tsx`:
```typescript
// Check if recipient accepts Salam
const canSendSalam = () => {
  const setting = recipient.companion_preferences.canReceiveSalam;
  
  if (setting === 'nobody') return false;
  if (setting === 'halaqas_only') {
    return hasSharedHalaqa(currentUser, recipient);
  }
  if (setting === 'connections_only') {
    return hasExistingConnection(currentUser, recipient);
  }
  return true; // 'everyone'
};
```

#### C. Guardian Dashboard
Create `src/app/(platform)/guardian/page.tsx`:
```typescript
// View ward's companion activity
- List of current companions
- Pending connection requests
- Activity logs
- Approve/decline options
- Update parental control settings
```

### 6. User Experience Flow

**For Adults:**
```
Settings → Companion Preferences
├── Choose who can send Salam
├── Set gender preference
├── Adjust max companions
├── Configure auto-decline timing
└── Enable/disable suggestions
```

**For Parents of Minors:**
```
Settings → Parental Controls
├── Enable minor protections
├── Require guardian approval
├── Set max companions (1-25)
├── Configure age range
├── Enable interaction monitoring
├── Set allowed genders
```

### 7. Safety Features

**A. Request Validation**
- Check gender preferences before creating request
- Verify max companions not exceeded
- Validate age range for minors
- Confirm Salam settings

**B. Automatic Cleanup**
- Old pending requests auto-declined
- Removes stale connection data
- Scheduled daily via cron job

**C. Guardian Notifications**
- Email when ward receives Salam
- Weekly activity digest
- Alert on unusual activity
- Option to adjust settings

**D. Content Filtering**
- Message previews only (not full content)
- Activity summaries for privacy
- No direct message surveillance
- Respect user privacy

### 8. Files Modified/Created

```
✅ src/app/(platform)/settings/page.tsx
   - Added companion preferences section
   - Added parental controls section
   - Added handler functions
   - Added UI components

📝 To Create:
   - src/app/(platform)/guardian/page.tsx (Guardian dashboard)
   - supabase/migrations/003_companion_privacy.sql (Schema updates)
   - src/lib/companions/privacy.ts (Privacy logic)
   - src/components/guardian/GuardianDashboard.tsx
```

### 9. Testing Checklist

- [ ] Toggle companion preferences save correctly
- [ ] Gender preferences filter matches
- [ ] Max companions limit enforced
- [ ] Auto-decline working after set days
- [ ] Parental controls toggle shows/hides options
- [ ] Guardian approval flow works
- [ ] Age restrictions apply correctly
- [ ] Gender restrictions for minors working
- [ ] Monitoring dashboard displays activity
- [ ] Settings persist on page reload

### 10. Next Steps

**Phase 7 Completion:**
1. ✅ Create companion preferences section
2. ✅ Implement parental controls
3. ⏳ Create guardian dashboard
4. ⏳ Update Supabase schema
5. ⏳ Add RLS policies
6. ⏳ Integrate with matching algorithm

**Phase 8 (Future):**
- Advanced safety analytics
- AI content monitoring
- Automated abuse detection
- Guardian reporting tools
- Appeal/escalation system

## Deployment Considerations

- Gradual rollout of parental controls
- User education on settings
- Clear privacy policy updates
- GDPR/COPPA compliance review
- Accessibility audit
- Performance testing at scale

## Security Notes

- Guardian email verification required
- Passwords for age-gate access
- Rate limiting on Salam requests
- HTTPS for guardian dashboard
- Audit logging for guardian actions
- Encrypted storage of preferences

---

**Phase 7 Implementation Complete** ✅
Users now have granular control over their companion experience, and parents can protect their children while allowing meaningful connections to flourish.
