# CompanionWidget & SalamModal - Complete Integration Examples

## Overview
This document provides real-world, copy-paste ready examples for integrating CompanionWidget and SalamModal into your pages.

---

## Example 1: Discovery Page with Grid

```typescript
"use client";

import { useState } from "react";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";

export default function DiscoveryPage() {
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [showSalamModal, setShowSalamModal] = useState(false);

  // Mock data - replace with real Supabase query
  const matches = [
    {
      id: "1",
      username: "ahmad_seeker",
      full_name: "Ahmad Ibn Abdullah",
      avatar_url: null,
      bio: "Seeking knowledge and righteous companionship",
      interests: ["Quran", "Hadith", "Tafsir"],
      beneficial_count: 45,
      location: "New York, USA",
      last_active: new Date().toISOString(),
      sharedInterests: ["Quran", "Tafsir"],
      mutualHalaqas: ["Tafsir Study Circle"],
      compatibilityScore: 92,
    },
    // ... more matches
  ];

  const handleSendSalam = (companion) => {
    setSelectedCompanion(companion);
    setShowSalamModal(true);
  };

  const handleSuccess = () => {
    // Refresh matches after connection
    console.log("Connection request sent!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Companions</h1>
        <p className="text-muted-foreground mb-8">
          Connect with Muslims on the same learning journey
        </p>

        {/* Grid of companions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <CompanionWidget
              key={match.id}
              companion={match}
              variant="default"
              mutualHalaqas={match.mutualHalaqas}
              sharedInterests={match.sharedInterests}
              compatibilityScore={match.compatibilityScore}
              connectionStatus="none"
              showActions={true}
              onSendSalam={() => handleSendSalam(match)}
            />
          ))}
        </div>

        {/* Salam Modal */}
        {selectedCompanion && (
          <SalamModal
            isOpen={showSalamModal}
            onClose={() => setShowSalamModal(false)}
            companion={selectedCompanion}
            matchReason={`You both love ${selectedCompanion.sharedInterests[0]} and have ${selectedCompanion.mutualHalaqas.length} mutual Halaqa(s)`}
            sharedInterests={selectedCompanion.sharedInterests}
            mutualHalaqas={selectedCompanion.mutualHalaqas}
            compatibilityScore={selectedCompanion.compatibilityScore}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Example 2: Sidebar with Compact Widgets

```typescript
"use client";

import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { useState } from "react";
import { SalamModal } from "@/components/companions/SalamModal";

export function CompanionSidebar() {
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock suggested companions
  const suggestions = [
    {
      id: "1",
      username: "fatima_student",
      full_name: "Fatima Ali",
      avatar_url: null,
      interests: ["Arabic", "Quran"],
      beneficial_count: 28,
      compatibilityScore: 87,
    },
    {
      id: "2",
      username: "omar_teacher",
      full_name: "Omar Hassan",
      avatar_url: null,
      interests: ["Hadith", "Seerah"],
      beneficial_count: 52,
      compatibilityScore: 82,
    },
  ];

  const handleSendSalam = (companion) => {
    setSelected(companion);
    setShowModal(true);
  };

  return (
    <div className="w-80 bg-card rounded-lg border border-border p-4">
      <h3 className="font-semibold text-foreground mb-3">
        Suggested Companions
      </h3>
      
      <div className="space-y-2">
        {suggestions.map((companion) => (
          <CompanionWidget
            key={companion.id}
            companion={companion}
            variant="compact"
            compatibilityScore={companion.compatibilityScore}
            connectionStatus="none"
            onSendSalam={() => handleSendSalam(companion)}
          />
        ))}
      </div>

      {/* Salam Modal */}
      {selected && (
        <SalamModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          companion={selected}
          sharedInterests={selected.interests}
          compatibilityScore={selected.compatibilityScore}
          onSuccess={() => console.log("Sent!")}
        />
      )}
    </div>
  );
}
```

---

## Example 3: Top Match Feature Card

```typescript
"use client";

import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export function TopMatchCard({ topMatch }) {
  const [showModal, setShowModal] = useState(false);

  if (!topMatch) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold">Your Top Match This Week</h2>
      </div>

      <CompanionWidget
        companion={topMatch}
        variant="detailed"
        mutualHalaqas={topMatch.mutualHalaqas}
        sharedInterests={topMatch.sharedInterests}
        compatibilityScore={topMatch.compatibilityScore}
        connectionStatus="none"
        showActions={true}
        onSendSalam={() => setShowModal(true)}
      />

      <SalamModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        companion={topMatch}
        matchReason="This companion has the highest compatibility score with you this week!"
        sharedInterests={topMatch.sharedInterests}
        mutualHalaqas={topMatch.mutualHalaqas}
        compatibilityScore={topMatch.compatibilityScore}
        onSuccess={() => {
          console.log("Connected with top match!");
          setShowModal(false);
        }}
      />
    </div>
  );
}
```

---

## Example 4: Search Results Page

```typescript
"use client";

import { useState, useEffect } from "react";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    const supabase = createClient();

    // Search by username or full name
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, interests, beneficial_count")
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) {
      console.error("Search error:", error);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for companions by name or username..."
              className="w-full px-4 py-3 pl-12 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <p className="text-center text-muted-foreground">Searching...</p>
        ) : results.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-4">
              Found {results.length} companion{results.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <CompanionWidget
                  key={result.id}
                  companion={result}
                  variant="default"
                  connectionStatus="none"
                  showActions={true}
                  onSendSalam={() => {
                    setSelected(result);
                    setShowModal(true);
                  }}
                />
              ))}
            </div>
          </>
        ) : searchQuery ? (
          <p className="text-center text-muted-foreground">
            No companions found. Try a different search.
          </p>
        ) : null}

        {/* Salam Modal */}
        {selected && (
          <SalamModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            companion={selected}
            onSuccess={() => {
              console.log("Connection request sent!");
              setShowModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Example 5: Halaqa Member List

```typescript
"use client";

import { useState, useEffect } from "react";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";
import { createClient } from "@/lib/supabase/client";

export function HalaqaMemberList({ halaqaId, halaqaName }) {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [halaqaId]);

  const loadMembers = async () => {
    const supabase = createClient();
    
    // Get Halaqa members
    const { data, error } = await supabase
      .from("halaqa_members")
      .select(`
        profiles:profile_id (
          id,
          username,
          full_name,
          avatar_url,
          bio,
          interests,
          beneficial_count,
          last_active
        )
      `)
      .eq("halaqa_id", halaqaId);

    if (error) {
      console.error("Error loading members:", error);
    } else {
      setMembers(data.map((m) => m.profiles));
    }

    setLoading(false);
  };

  if (loading) return <p>Loading members...</p>;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Members ({members.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => (
          <CompanionWidget
            key={member.id}
            companion={member}
            variant="default"
            mutualHalaqas={[halaqaName]}
            connectionStatus="none"
            showActions={true}
            onSendSalam={() => {
              setSelected(member);
              setShowModal(true);
            }}
          />
        ))}
      </div>

      {/* Salam Modal */}
      {selected && (
        <SalamModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          companion={selected}
          mutualHalaqas={[halaqaName]}
          matchReason={`You're both members of ${halaqaName}`}
          onSuccess={() => {
            console.log("Sent to fellow member!");
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
```

---

## Example 6: Feed Post with Companion

```typescript
"use client";

import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { Users } from "lucide-react";

export function FeedPostCard({ post, isFromCompanion }) {
  if (!isFromCompanion) {
    return <div>{/* Regular post card */}</div>;
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-4">
      {/* Companion indicator */}
      <div className="flex items-center gap-2 mb-3 text-sm text-primary-600">
        <Users className="w-4 h-4" />
        <span>Your companion posted this</span>
      </div>

      {/* Compact widget */}
      <CompanionWidget
        companion={post.author}
        variant="compact"
        connectionStatus="connected"
        onSendMessage={() => console.log("Open chat with", post.author.username)}
      />

      {/* Post content */}
      <div className="mt-4">
        <p className="text-foreground">{post.content}</p>
      </div>

      {/* Post actions... */}
    </div>
  );
}
```

---

## Example 7: Connected Companions List (Profile Page)

```typescript
"use client";

import { useState, useEffect } from "react";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { createClient } from "@/lib/supabase/client";

export function MyCompanionsList() {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get accepted connections
    const { data, error } = await supabase
      .from("companion_connections")
      .select(`
        id,
        connection_strength,
        requester:profiles!companion_connections_requester_id_fkey(
          id, username, full_name, avatar_url, bio, interests, beneficial_count, last_active
        ),
        recipient:profiles!companion_connections_recipient_id_fkey(
          id, username, full_name, avatar_url, bio, interests, beneficial_count, last_active
        )
      `)
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (error) {
      console.error("Error loading companions:", error);
    } else {
      // Map to companion profiles
      const companionProfiles = (data || []).map((conn) =>
        conn.requester_id === user.id ? conn.recipient : conn.requester
      );
      setCompanions(companionProfiles);
    }

    setLoading(false);
  };

  if (loading) return <p>Loading your companions...</p>;

  if (companions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          You don't have any companions yet.
        </p>
        <a
          href="/tools/companions"
          className="text-primary-600 hover:text-primary-700"
        >
          Find companions →
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        My Companions ({companions.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companions.map((companion) => (
          <CompanionWidget
            key={companion.id}
            companion={companion}
            variant="default"
            connectionStatus="connected"
            showActions={true}
            onSendMessage={() => console.log("Message", companion.username)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Common Patterns

### Pattern 1: Modal State Management
```typescript
const [selectedCompanion, setSelectedCompanion] = useState(null);
const [showSalamModal, setShowSalamModal] = useState(false);

const openModal = (companion) => {
  setSelectedCompanion(companion);
  setShowSalamModal(true);
};

const closeModal = () => {
  setShowSalamModal(false);
  // Optional: clear selection after animation
  setTimeout(() => setSelectedCompanion(null), 300);
};
```

### Pattern 2: Success Callback
```typescript
const handleSuccess = async () => {
  // 1. Show toast
  toast.success("Connection request sent!");
  
  // 2. Refresh data
  await loadCompanions();
  
  // 3. Close modal
  setShowSalamModal(false);
  
  // 4. Optional: Track analytics
  trackEvent("companion_request_sent");
};
```

### Pattern 3: Loading State
```typescript
const [loading, setLoading] = useState(true);
const [companions, setCompanions] = useState([]);

useEffect(() => {
  async function load() {
    setLoading(true);
    const data = await fetchCompanions();
    setCompanions(data);
    setLoading(false);
  }
  load();
}, []);

if (loading) return <LoadingSkeleton />;
```

---

## Best Practices

1. **Always provide onSuccess callback**
   ```typescript
   onSuccess={() => {
     toast.success("Sent!");
     refreshData();
   }}
   ```

2. **Use correct variant for context**
   - Lists → compact
   - Grids → default
   - Features → detailed

3. **Provide match context when available**
   ```typescript
   matchReason="You both love Tafsir"
   sharedInterests={["Quran", "Tafsir"]}
   mutualHalaqas={["Tafsir Study"]}
   ```

4. **Handle connection status**
   ```typescript
   connectionStatus={
     isConnected ? "connected" : 
     isPending ? "pending" : 
     "none"
   }
   ```

5. **Error handling**
   ```typescript
   try {
     await sendSalam();
   } catch (error) {
     toast.error("Failed to send request");
   }
   ```

---

## Quick Checklist

### Before Using CompanionWidget:
- [ ] Import from `@/components/companions/CompanionWidget`
- [ ] Choose correct variant for your use case
- [ ] Provide companion object with required fields
- [ ] Set up onSendSalam handler (if not connected)
- [ ] Consider providing mutualHalaqas and sharedInterests

### Before Using SalamModal:
- [ ] Import from `@/components/companions/SalamModal`
- [ ] Set up state for isOpen and selectedCompanion
- [ ] Provide companion object
- [ ] Add onSuccess callback to refresh data
- [ ] Optional: Add matchReason for better UX

---

**Ready to integrate? Copy any example above and customize for your page!** 🚀

