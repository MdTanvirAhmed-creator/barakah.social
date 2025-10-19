# Step 11: Complete Salam Protocol Flow - Documentation

## Overview

Step 11 implements the complete Islamic connection flow for the Companion System, featuring respectful "Salam" protocol with proper Islamic etiquette.

---

## 🎯 Components & Hooks Created

### 1. **SendSalam** (`src/components/companions/SendSalam.tsx`)
Component for sending connection requests with context

### 2. **SalamReceived** (`src/components/companions/SalamReceived.tsx`)
Notification component for receiving connection requests

### 3. **useCompanionship** (`src/hooks/useCompanionship.ts`)
Hook for managing all companion connection state and actions

---

## 📨 SendSalam Component

### Purpose
A beautiful, context-aware modal for sending connection requests that follows Islamic greeting etiquette.

### Key Features

#### **1. Context Awareness**
Automatically includes context about where/how users met:
- Met in specific Halaqa
- Studying same learning path
- Shared interests
- Mutual companions
- Compatibility score

#### **2. Message Templates**
4 pre-written templates:
1. **General**: Basic connection request
2. **From Halaqa**: When met in a study circle
3. **Study Partner**: For learning together
4. **Seeking Guidance**: For mentorship

Templates auto-fill placeholders like `{halaqaName}` and `{interest}`.

#### **3. Character Limit**
- Maximum: 280 characters
- Live counter
- Visual warning when < 20 chars remain

#### **4. Islamic Etiquette Section**
Amber-colored callout with reminders:
- Begin with "Assalamu alaikum"
- Be sincere in intentions
- Maintain respectful boundaries
- Seek righteous companionship
- May Allah bless connection

#### **5. Success Animation**
- Green checkmark animation
- "Salam Sent! 🤲" message
- "May Allah accept your connection"
- Auto-closes after 2 seconds

---

### Props Interface

```typescript
interface SendSalamProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
    interests?: string[];
    location?: string;
  };
  context?: {
    metIn?: "halaqa" | "knowledge" | "feed" | "search" | "tools";
    halaqaName?: string;
    halaqaId?: string;
    learningPath?: string;
    sharedInterests?: string[];
    mutualConnections?: string[];
    compatibilityScore?: number;
  };
  onSuccess?: () => void;
}
```

---

### Usage Example

```typescript
import { SendSalam } from "@/components/companions/SendSalam";
import { useState } from "react";

function HalaqaMemberCard({ member, halaqaName }) {
  const [showSalam, setShowSalam] = useState(false);

  return (
    <>
      <button onClick={() => setShowSalam(true)}>
        Connect
      </button>

      <SendSalam
        isOpen={showSalam}
        onClose={() => setShowSalam(false)}
        recipient={member}
        context={{
          metIn: "halaqa",
          halaqaName: halaqaName,
          sharedInterests: ["Quran", "Tafsir"],
          compatibilityScore: 85,
        }}
        onSuccess={() => {
          console.log("Salam sent!");
          setShowSalam(false);
        }}
      />
    </>
  );
}
```

---

## 📬 SalamReceived Component

### Purpose
Beautiful notification modal for incoming connection requests with three clear action options.

### Key Features

#### **1. Sender Profile Display**
- Large avatar (20x20)
- Full name & username
- Bio (2 lines)
- Location & beneficial count
- Interests badges
- Time ago ("5m ago")

#### **2. Connection Message**
- Bordered quote-style display
- Message icon
- Full message text from sender

#### **3. Mutual Context Section**
Shows what you have in common:
- **Mutual Halaqas**: Study circles you both attend
- **Mutual Connections**: Companions you both know
- **Shared Interests**: Topics you're both interested in

#### **4. Three Action Buttons**

**Accept** (Primary, Green):
- "Wa Alaikum Salam (Accept)"
- Updates status to `accepted`
- Creates welcome interaction
- Shows success animation
- Toast with "View Profile" action

**View Profile** (Secondary):
- "View Full Profile"
- Opens recipient's profile page
- Learn more before deciding

**Decline** (Tertiary, Red border):
- "Not now, JazakAllah"
- Polite decline
- Updates status to `declined`
- Respectful toast message

#### **5. Islamic Note**
Bottom reminder:
> "The best companion is one who reminds you of Allah" - Take your time to decide

---

### Props Interface

```typescript
interface SalamReceivedProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    requester_id: string;
    message: string;
    created_at: string;
    requester: {
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      bio?: string | null;
      interests?: string[];
      beneficial_count?: number;
      location?: string;
    };
  };
  mutualContext?: {
    mutualHalaqas?: string[];
    mutualConnections?: string[];
    sharedInterests?: string[];
  };
  onAccept?: () => void;
  onDecline?: () => void;
}
```

---

### Usage Example

```typescript
import { SalamReceived } from "@/components/companions/SalamReceived";
import { useState, useEffect } from "react";
import { useCompanionship } from "@/hooks/useCompanionship";

function NotificationsPage() {
  const { pendingRequests, refresh } = useCompanionship();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {pendingRequests.map((request) => (
        <button
          key={request.id}
          onClick={() => {
            setSelectedRequest(request);
            setShowModal(true);
          }}
        >
          New Salam from {request.requester.full_name}
        </button>
      ))}

      {selectedRequest && (
        <SalamReceived
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          request={selectedRequest}
          mutualContext={{
            mutualHalaqas: ["Tafsir Study"],
            sharedInterests: ["Quran", "Hadith"],
          }}
          onAccept={() => {
            refresh();
            setShowModal(false);
          }}
          onDecline={() => {
            refresh();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
```

---

## 🔗 useCompanionship Hook

### Purpose
Comprehensive hook for managing all companion connection state, real-time updates, and actions.

### State

```typescript
interface CompanionshipState {
  connections: CompanionConnection[];       // All connections
  pendingRequests: CompanionConnection[];   // Incoming requests
  acceptedConnections: CompanionConnection[]; // Active companions
  sentRequests: CompanionConnection[];      // Outgoing requests
  loading: boolean;
  error: string | null;
}
```

### Methods

#### **1. acceptConnection(connectionId)**
Accept a pending connection request:
- Updates status to `accepted`
- Creates welcome interaction
- Updates feed algorithm
- Shows success toast
- Refreshes connections

#### **2. declineConnection(connectionId)**
Decline a pending request:
- Updates status to `declined`
- Shows polite toast
- Refreshes connections

#### **3. sendConnectionRequest(recipientId, message)**
Send new connection request:
- Checks for existing connections
- Creates new pending connection
- Sets initial strength to 50
- Shows success toast
- Refreshes connections

#### **4. updateConnectionStrength(connectionId, newStrength)**
Update connection strength (0-100):
- Clamps value between 0-100
- Updates `last_interaction` timestamp
- Refreshes connections

#### **5. recordInteraction(connectionId, interactionType)**
Record an interaction and boost strength:
- Creates interaction record
- Increases strength by 1-5 points:
  - `message_sent`: +1
  - `beneficial_given`: +2
  - `comment_reply`: +3
  - `knowledge_shared`: +4
  - `halaqa_shared`: +5

#### **6. getConnectionStatus(userId)**
Get connection status with a user:
- Returns: `"none"` | `"pending"` | `"accepted"` | `"sent"`

#### **7. getConnectionByCompanionId(companionId)**
Get accepted connection by companion ID:
- Returns connection object or `null`

#### **8. refresh()**
Manually refresh all connections

---

### Usage Example

```typescript
import { useCompanionship } from "@/hooks/useCompanionship";

function MyComponent() {
  const {
    pendingRequests,
    acceptedConnections,
    loading,
    acceptConnection,
    declineConnection,
    sendConnectionRequest,
    recordInteraction,
    getConnectionStatus,
    refresh,
  } = useCompanionship();

  const handleAccept = async (requestId) => {
    const success = await acceptConnection(requestId);
    if (success) {
      console.log("Connection accepted!");
    }
  };

  const handleSendRequest = async (userId) => {
    const success = await sendConnectionRequest(
      userId,
      "Assalamu alaikum! Would love to connect!"
    );
  };

  const status = getConnectionStatus("user-123");
  // "none" | "pending" | "accepted" | "sent"

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>Pending Requests: {pendingRequests.length}</h2>
          <h2>Companions: {acceptedConnections.length}</h2>
        </>
      )}
    </div>
  );
}
```

---

## 🔄 Complete Connection Flow

### 1. **Sending Salam**
```
User A → Clicks "Send Salam" on User B's profile
     ↓
SendSalam modal opens with context
     ↓
User A writes/selects message
     ↓
Clicks "Send with Bismillah"
     ↓
Creates companion_connections record (status: pending)
     ↓
Toast: "Salam sent! 🤲"
```

### 2. **Receiving Salam**
```
User B → Gets notification badge
     ↓
Opens notifications
     ↓
Sees pending request
     ↓
Clicks to view
     ↓
SalamReceived modal opens
     ↓
Shows sender profile + message + mutual context
```

### 3. **Accepting**
```
User B → Clicks "Wa Alaikum Salam (Accept)"
     ↓
Updates status to "accepted"
     ↓
Creates companion_interactions record
     ↓
Updates both users' companion trees
     ↓
Triggers feed algorithm update
     ↓
Toast: "Wa Alaikum Salam! You are now companions 🤝"
     ↓
Success animation
```

### 4. **Post-Connection**
```
Both users can now:
- See each other in "My Companions"
- Message each other
- See boosted content from each other
- Track connection strength
- Record interactions
```

---

## 📊 Database Operations

### Tables Affected

#### **companion_connections**
```sql
-- Insert (Send Salam)
INSERT INTO companion_connections (
  requester_id,
  recipient_id,
  status,
  message,
  connection_strength,
  created_at
) VALUES (...)

-- Update (Accept/Decline)
UPDATE companion_connections
SET status = 'accepted', updated_at = NOW()
WHERE id = connection_id
```

#### **companion_interactions**
```sql
-- Record interaction
INSERT INTO companion_interactions (
  companion_connection_id,
  interaction_type,
  created_at
) VALUES (...)
```

---

## 🎨 Design System

### Colors

**SendSalam**:
- Header: Primary gradient (500-700)
- Templates: Muted hover effect
- Selected: Primary-50 background
- Etiquette: Amber-50 background

**SalamReceived**:
- Header: Success gradient (500-700)
- Message: Primary-50 with left border
- Accept Button: Success-600
- Decline Button: Red border
- Context: Muted background

### Typography

- **Headers**: 24px, font-bold
- **Names**: 18-20px, font-bold
- **Body**: 14px, font-normal
- **Labels**: 12px, font-medium
- **Hints**: 12px, text-xs

### Spacing

- **Modal**: max-w-2xl, p-6
- **Sections**: mb-6 between
- **Buttons**: py-6 for primary actions
- **Gaps**: gap-3 for button groups

---

## 🚀 Integration Points

### Where to Trigger SendSalam

1. **Profile Pages**: "Send Salam" button
2. **CompanionWidget**: `onSendSalam` prop
3. **SalamModal** (existing): Can replace
4. **Search Results**: Connection button
5. **Halaqa Members**: Connect with members
6. **Study Partners**: In Knowledge Hub

### Where to Show SalamReceived

1. **Notification Dropdown**: In sidebar/mobile nav
2. **Dedicated Page**: `/notifications`
3. **Badge Counter**: Shows pending count
4. **Real-time Toast**: When new request arrives

---

## 🧪 Testing Guide

### Test SendSalam

1. **Open Modal**:
   - Click "Send Salam" anywhere
   - Verify modal opens smoothly

2. **Context Display**:
   - Check context summary appears
   - Verify mutual info shows
   - Check compatibility score

3. **Templates**:
   - Click each template
   - Verify message fills
   - Check placeholder replacement

4. **Message Input**:
   - Type custom message
   - Verify character counter
   - Test max length (280)

5. **Send**:
   - Click "Send with Bismillah"
   - Verify loading state
   - Check success animation
   - Confirm toast appears
   - Check database record

### Test SalamReceived

1. **Display**:
   - Open with pending request
   - Verify profile shows
   - Check message displays
   - Verify mutual context

2. **Accept**:
   - Click "Wa Alaikum Salam"
   - Verify loading state
   - Check success animation
   - Confirm database update
   - Verify both users updated

3. **Decline**:
   - Click "Not now, JazakAllah"
   - Verify polite toast
   - Check status update
   - Confirm request removed

4. **View Profile**:
   - Click "View Full Profile"
   - Verify navigation
   - Check profile loads

### Test useCompanionship

1. **Load**:
   - Hook initializes
   - Connections load
   - Categorization works

2. **Actions**:
   - Accept request works
   - Decline request works
   - Send request works
   - Record interaction works

3. **Real-time**:
   - Send request from another device
   - Verify updates automatically
   - Check subscription works

---

## 📱 Mobile Considerations

### Touch Targets
- All buttons: 44px minimum height
- Modal close button: 44x44px
- Template buttons: 48px height

### Responsive
- Modal: Full width on mobile
- Buttons: Stack vertically < 640px
- Text: Readable sizes (14px+)

### Performance
- Lazy load modals
- Optimize images
- Debounce interactions

---

## 🎯 Success Criteria

- ✅ SendSalam component complete
- ✅ SalamReceived component complete
- ✅ useCompanionship hook complete
- ✅ Context-aware messaging
- ✅ Islamic etiquette integrated
- ✅ Database operations work
- ✅ Real-time updates functional
- ✅ Success animations smooth
- ✅ Toast notifications clear
- ✅ Zero linter errors

---

## 📚 Files Summary

### Created:
- `src/components/companions/SendSalam.tsx` (500+ lines)
- `src/components/companions/SalamReceived.tsx` (450+ lines)
- `src/hooks/useCompanionship.ts` (350+ lines)
- `STEP_11_SALAM_PROTOCOL.md` (This file)

### Total Step 11 Output:
- **1,300+ lines** of production code
- **3 new components/hooks**
- **Complete Salam protocol**
- **Zero linter errors**
- **Full Islamic etiquette**

---

## 🌟 Islamic Values Implemented

1. **Greeting**: "Assalamu alaikum" (Peace be upon you)
2. **Response**: "Wa Alaikum Salam" (And upon you be peace)
3. **Etiquette**: Respectful boundaries
4. **Sincerity**: "Bismillah" before sending
5. **Politeness**: "JazakAllah" when declining
6. **Reminder**: Best companion quote
7. **Intention**: Righteous companionship

---

**Step 11 Complete! Full Salam Protocol ready! 🤲**

The Islamic connection flow is now production-ready with beautiful components and complete state management!

