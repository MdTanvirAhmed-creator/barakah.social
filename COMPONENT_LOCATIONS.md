# Companion Component Locations

## 📦 Component Files

### 1. **CompanionWidget**
**Path**: `src/components/companions/CompanionWidget.tsx`
- 700+ lines of code
- 3 variants: compact, default, detailed
- Fully reusable across the platform

### 2. **SalamModal**
**Path**: `src/components/companions/SalamModal.tsx`
- 500+ lines of code
- Beautiful modal for connection requests
- Islamic etiquette built-in

---

## 🌐 Where They're Currently Used

### ✅ **Live Pages (Components Integrated)**

#### 1. **Companion Finder** (`/tools/companions`)
**File**: `src/app/(platform)/tools/companions/page.tsx`
- **Uses**: CompanionWidget (default variant) + SalamModal
- **What you'll see**:
  - Grid of 3 daily companion suggestions
  - Each card is a CompanionWidget
  - Click "Send Salam" to open SalamModal
  - Compatibility scores, interests, and match reasons
- **Visit**: http://localhost:3000/tools/companions

#### 2. **Demo Showcase** (`/companion-demo`)
**File**: `src/app/(platform)/companion-demo/page.tsx`
- **Uses**: All 3 CompanionWidget variants + SalamModal
- **What you'll see**:
  - Compact variant example
  - Default variant example
  - Detailed variant example
  - Side-by-side comparison
  - Connection status states (none, pending, connected)
  - SalamModal demo button
- **Visit**: http://localhost:3000/companion-demo

---

## 🎯 Where You Can Add Them

### Suggested Integration Points

#### 1. **Profile Companions Page** (`/profile/companions`)
**Current**: Custom connection cards
**Recommended**: Replace with CompanionWidget (default variant)
```typescript
<CompanionWidget
  companion={connection.profile}
  variant="default"
  connectionStatus="connected"
  showActions={true}
/>
```

#### 2. **Halaqa Member Lists** (`/halaqas/[id]`)
**Current**: Custom member display
**Recommended**: Use CompanionWidget (compact for sidebar, default for grid)
```typescript
<CompanionWidget
  companion={member}
  variant="compact"
  mutualHalaqas={[halaqaName]}
  onSendSalam={() => openModal(member)}
/>
```

#### 3. **Feed Posts** (`/feed`)
**Current**: Basic author info
**Recommended**: Show "Your companion posted this" with compact widget
```typescript
{post.isFromCompanion && (
  <CompanionWidget
    companion={post.author}
    variant="compact"
    connectionStatus="connected"
  />
)}
```

#### 4. **Knowledge Hub** (`/knowledge`)
**Current**: Study partner lists
**Recommended**: Use CompanionWidget for study partners
```typescript
<CompanionWidget
  companion={partner}
  variant="default"
  sharedInterests={["Quran", "Tafsir"]}
/>
```

#### 5. **Search Results** (`/search`)
**Future**: User search page
**Recommended**: Grid of default widgets with SalamModal
```typescript
<CompanionWidget
  companion={result}
  variant="default"
  compatibilityScore={result.score}
  onSendSalam={() => openModal(result)}
/>
```

---

## 📋 Quick Integration Checklist

### To use CompanionWidget:
```typescript
// 1. Import
import { CompanionWidget } from "@/components/companions/CompanionWidget";

// 2. Use
<CompanionWidget
  companion={userData}
  variant="default" // or "compact" or "detailed"
  mutualHalaqas={["Tafsir Study"]}
  sharedInterests={["Quran", "Hadith"]}
  compatibilityScore={85}
  connectionStatus="none" // or "pending" or "connected"
  showActions={true}
  onSendSalam={() => handleSalam()}
/>
```

### To use SalamModal:
```typescript
// 1. Import
import { SalamModal } from "@/components/companions/SalamModal";

// 2. Set up state
const [showModal, setShowModal] = useState(false);
const [selected, setSelected] = useState(null);

// 3. Use
<SalamModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  companion={selected}
  matchReason="You both love Tafsir"
  sharedInterests={["Quran", "Hadith"]}
  compatibilityScore={85}
  onSuccess={() => {
    toast.success("Sent!");
    setShowModal(false);
  }}
/>
```

---

## 🚀 Next Steps

### Immediate Actions:
1. ✅ Visit `/companion-demo` to see all variants
2. ✅ Visit `/tools/companions` to see real integration
3. ✅ Click "Send Salam" to test the modal
4. ✅ Test all 3 companion cards on the demo page

### Future Integrations:
1. Replace custom cards in `/profile/companions` with CompanionWidget
2. Add widgets to Halaqa member lists
3. Show "Your companion posted" in feed with compact widget
4. Use in study partner displays
5. Create dedicated search page with widgets

---

## 📖 Documentation Reference

- **Full Guide**: `STEP_9_UNIFIED_EXPERIENCE.md`
- **Quick Summary**: `STEP_9_SUMMARY.md`
- **Examples**: `COMPANION_WIDGET_EXAMPLES.md`
- **Progress Tracker**: `COMPANION_SYSTEM_PROGRESS.md`

---

## 🎨 Visual Guide

### Compact (~60px)
```
┌─────────────────────────────┐
│ 👤 Ahmad Ibn Abdullah       │
│    @ahmad_seeker       92%  │
└─────────────────────────────┘
```

### Default (~250-300px)
```
┌───────────────────────────────┐
│ 👤 Ahmad Ibn Abdullah    92% │
│    @ahmad_seeker             │
│    Active 5m ago             │
│                              │
│ Seeking knowledge and...     │
│                              │
│ 🤝 2 mutual Halaqas          │
│ 📚 Quran, Hadith, Tafsir     │
│ 📍 London • ❤️ 145           │
│                              │
│ [Send Salam] [Profile] [...]│
└───────────────────────────────┘
```

### Detailed (~400-500px)
```
┌─────────────────────────────────┐
│  ╔══════════════════════╗ 92%  │
│  ║ Gradient Header      ║       │
│  ║                      ║       │
│  ║  👤                  ║       │
│  ╚══════════════════════╝       │
│  Ahmad Ibn Abdullah             │
│  @ahmad_seeker                  │
│  ⚫ Active now                  │
│                                 │
│  Full bio text here...          │
│                                 │
│  🤝 3 Mutual Halaqas           │
│  [All halaqas shown]            │
│                                 │
│  Shared Interests               │
│  [All interests shown]          │
│                                 │
│  ┌────┬────┬────┐              │
│  │145 │ 3  │ 5  │              │
│  │Ben │Hal │Int │              │
│  └────┴────┴────┘              │
│                                 │
│  [Send Salam & Connect]        │
│  [View Full Profile]           │
└─────────────────────────────────┘
```

---

**Built and ready to use! 🎉**

Access your components at:
- Demo: http://localhost:3000/companion-demo
- Live: http://localhost:3000/tools/companions

