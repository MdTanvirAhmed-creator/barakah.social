"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shamsa,
  GirihPattern,
  TazhibCorner,
  GoldDiamond,
  IlluminatedDivider,
  GirihEmptyState,
  LeafMoment,
} from "@/components/ui/girih";
import { QuranText } from "@/components/ui/QuranText";
import { RadialWordMenu, type RadialMenuItem } from "@/components/quran/RadialWordMenu";
import { useWordActivation } from "@/hooks/useWordActivation";
import { Palette, Play, BookOpen, Bookmark, PenLine } from "lucide-react";
import { useToast } from "@/hooks/useToast";

/** The one Qur'anic specimen on this page, shared by both sections below. */
const SPECIMEN = "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ";
const SPECIMEN_CITATION = "Al-Baqarah 2:152";
const SPECIMEN_TRANSLATION =
  "So remember Me; I will remember you. And be grateful to Me and do not deny Me.";

/**
 * Prototype of the reader's signature interaction. The words are rendered
 * *through* QuranText (as tokenized children), which is how the reader will
 * do it — so the menu never needs to draw Qur'anic text itself.
 */
function RadialMenuPrototype() {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const handlers = useWordActivation(setAnchorRect);
  const words = SPECIMEN.split(" ");

  const act = (name: string) => () =>
    setLastAction(`${name} — word ${(activeWord ?? 0) + 1}`);

  const items: RadialMenuItem[] = [
    { id: "tajweed", label: "Tajweed", icon: Palette, onSelect: act("Tajweed") },
    {
      id: "audio",
      label: "Audio",
      icon: Play,
      onSelect: () => {},
      disabled: true,
      disabledReason: "No licence-cleared recitation imported yet",
    },
    {
      id: "tafsir",
      label: "Tafsir",
      icon: BookOpen,
      onSelect: () => {},
      disabled: true,
      disabledReason: "Awaiting a public-domain tafsir import",
    },
    { id: "bookmark", label: "Bookmark", icon: Bookmark, onSelect: act("Bookmark") },
    { id: "note", label: "Note", icon: PenLine, onSelect: act("Note") },
  ];

  return (
    <div>
      <QuranText citation={SPECIMEN_CITATION} translation={SPECIMEN_TRANSLATION}>
        {words.map((w, i) => (
          <span key={i}>
            <span
              role="button"
              tabIndex={0}
              aria-label={`Word ${i + 1} of ${words.length}, ${SPECIMEN_CITATION}`}
              aria-haspopup="menu"
              aria-expanded={anchorRect !== null && activeWord === i}
              onFocus={() => setActiveWord(i)}
              {...handlers}
              onClick={(e) => {
                setActiveWord(i);
                handlers.onClick(e);
              }}
              className="rounded px-1 cursor-pointer transition-colors duration-150 hover:bg-[rgb(var(--primary-600)/0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </QuranText>

      <p className="text-sm text-foreground-secondary text-center">
        Click a word (or long-press on touch, or focus it and press Enter).
        Arrow keys walk the ring, Escape closes it.
      </p>
      <p className="mt-2 text-center text-sm">
        {lastAction ? (
          <span className="text-accent-strong font-medium">{lastAction}</span>
        ) : (
          <span className="text-muted-foreground">No action taken yet.</span>
        )}
      </p>

      <RadialWordMenu
        anchorRect={anchorRect}
        items={items}
        label={`Actions for word ${(activeWord ?? 0) + 1}, ${SPECIMEN_CITATION}`}
        onClose={() => setAnchorRect(null)}
      />
    </div>
  );
}

const SWATCHES = [
  { name: "bg · stone", style: { background: "var(--bg)", border: "1px solid var(--hairline)" } },
  { name: "surface", style: { background: "var(--surface)", border: "1px solid var(--hairline)" } },
  { name: "surface-sunk", style: { background: "var(--surface-sunk)" } },
  { name: "ink", style: { background: "var(--ink)" } },
  { name: "ink-muted", style: { background: "var(--ink-muted)" } },
  { name: "primary · teal", style: { background: "var(--primary-hex)" } },
  { name: "lapis", style: { background: "var(--accent-lapis)" } },
  { name: "leaf · rare", style: { background: "var(--leaf)" } },
  { name: "clay · tile only", style: { background: "var(--clay)" } },
  { name: "positive", style: { background: "var(--positive)" } },
  { name: "caution", style: { background: "var(--caution)" } },
  { name: "danger", style: { background: "var(--danger-hex)" } },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="font-sans text-xs uppercase tracking-[0.14em] text-foreground-secondary mb-5">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function StyleReference() {
  const { success } = useToast();
  const [theme, setTheme] = useState<"courtyard" | "dusk">(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dusk"
      ? "dusk"
      : "courtyard"
  );
  const [dir, setDir] = useState<"ltr" | "rtl">(() =>
    typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr"
  );
  const [heroKey, setHeroKey] = useState(0);

  const applyTheme = useCallback((t: "courtyard" | "dusk") => {
    setTheme(t);
    if (t === "dusk") document.documentElement.dataset.theme = "dusk";
    else delete document.documentElement.dataset.theme;
    document.cookie = `bk-theme=${t};path=/;max-age=31536000`;
  }, []);

  const applyDir = useCallback((d: "ltr" | "rtl") => {
    setDir(d);
    document.documentElement.dir = d;
    document.documentElement.lang = d === "rtl" ? "ar" : "en";
    document.cookie = `bk-locale=${d === "rtl" ? "ar" : "en"};path=/;max-age=31536000`;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-3xl font-medium">The courtyard</h1>
              <p className="mt-2 text-foreground-secondary max-w-md">
                Sakina — warm limewashed stone, zellij teal, rare gold leaf.
                Every surface in Phases 3–8 inherits from this page.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "courtyard" ? "default" : "quiet"}
                size="sm"
                onClick={() => applyTheme("courtyard")}
              >
                Courtyard
              </Button>
              <Button
                variant={theme === "dusk" ? "default" : "quiet"}
                size="sm"
                onClick={() => applyTheme("dusk")}
              >
                Dusk
              </Button>
              <Button
                variant={dir === "rtl" ? "default" : "quiet"}
                size="sm"
                onClick={() => applyDir(dir === "rtl" ? "ltr" : "rtl")}
              >
                {dir === "rtl" ? "RTL ✓" : "RTL"}
              </Button>
            </div>
          </div>
        </header>

        <Section title="Palette — stone, ink, tile, leaf">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {SWATCHES.map((s) => (
              <div key={s.name}>
                <div className="h-12 rounded-[var(--radius)]" style={s.style} />
                <div className="mt-1.5 text-xs text-foreground-secondary">{s.name}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-foreground-secondary max-w-prose">
            Teal is the working accent; gold leaf marks rare moments; clay is a
            tile accent, never a wash. Components reference semantic tokens only.
          </p>
        </Section>

        <Section title="The specimen card — watermark, tazhib, gold diamond, teal action">
          <div className="relative bg-card border border-border rounded-lg p-6 overflow-hidden max-w-xl">
            <GirihPattern />
            <TazhibCorner corner="top-end" size={38} />
            <div className="relative flex items-start gap-4">
              <GoldDiamond size={10} shimmer className="mt-1.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg font-medium mb-2 text-foreground">
                  Question of the week
                </h3>
                <p className="text-foreground-secondary mb-4">
                  How can we maintain sincerity (ikhlas) in our acts of worship
                  in the age of social media?
                </p>
                <Button size="sm" onClick={() => success("Thought shared")}>
                  Share your thoughts
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="The shamsa — hero (welcome, once) and loader (everyday, quiet)">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative rounded-lg border border-border bg-card p-6 text-center overflow-hidden">
              <GirihPattern />
              <div className="relative">
                <Shamsa mode="hero" key={heroKey} size="hero" />
                <p className="text-sm text-foreground-secondary mt-3 mb-4">
                  mode=&quot;hero&quot; — twelve petals unfold once (~800ms),
                  the gold core settles. Welcome only.
                </p>
                <Button variant="quiet" size="sm" onClick={() => setHeroKey((k) => k + 1)}>
                  Replay bloom
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="flex items-end justify-center gap-6 mt-6">
                <Shamsa mode="loader" size="sm" />
                <Shamsa mode="loader" size="md" />
                <Shamsa mode="loader" size="lg" />
              </div>
              <p className="text-sm text-foreground-secondary mt-6">
                mode=&quot;loader&quot; — a minimal medallion turning slowly in
                teal. No gold, no bloom; static under reduced motion. This is
                what every loading surface inherits.
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-foreground-secondary">
            Dev preview: <code>/feed?preview=welcome</code> (non-production builds).
            Reset the real gate: <code>localStorage.removeItem(&quot;bk-welcome-seen&quot;)</code>.
          </p>
        </Section>

        <Section title="Buttons — teal works, gold illuminates">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Send request</Button>
            <Button variant="quiet">Decline</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Block</Button>
            <Button disabled>Disabled</Button>
            <Button variant="link">Learn more</Button>
          </div>
          <p className="mt-3 text-sm text-foreground-secondary">
            Focus ring is always visible — tab through. Tap targets ≥ 44px.
            Buttons press down on tap; cards lift on hover.
          </p>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-4 max-w-sm">
            <Input placeholder="Search by username or name…" />
            <Input value="Focused state (tab to me)" readOnly />
            <Input disabled placeholder="Disabled" />
          </div>
        </Section>

        <Section title="Card, badge, avatar, skeleton">
          <div className="rounded-[var(--radius-md)] border border-border bg-card p-5 max-w-md shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">Card title</div>
                <div className="text-sm text-foreground-secondary">
                  Raised surface, hairline border, soft warm shadow.
                </div>
              </div>
              <Badge>Badge</Badge>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Section>

        <Section title="Type — Latin">
          <div className="space-y-5">
            <div className="font-display text-3xl leading-tight">
              Display — Fraunces, for headings and arrival moments.
            </div>
            <p className="font-reading text-lg leading-[1.75] text-foreground max-w-prose">
              Reading — Newsreader carries long-form knowledge in Al-Hikmah:
              made for screens, warm without being precious, unhurried.
            </p>
            <div className="font-sans text-sm text-foreground-secondary">
              UI — Hanken Grotesk for controls, labels, and chrome. Companions
              · Requests · Find · Blocked
            </div>
          </div>
        </Section>

        <Section title="Type — Arabic (own scale, taller leading, never letter-spaced)">
          <div lang="ar" dir="rtl" className="space-y-4">
            <div className="arabic-display text-4xl text-foreground">سَكِينَة</div>
            <p className="text-lg text-foreground">
              مرحبًا بك في مجلسٍ هادئ، حيث تُطلَب الحكمة في صحبةٍ صالحة.
            </p>
            <div className="arabic-ui text-sm text-foreground-secondary">
              الرفقاء · الطلبات · الحلقات · الإعدادات
            </div>
          </div>
        </Section>

        <Section title="Qur'an — Uthmanic face, complete, still, attributed">
          <QuranText citation={SPECIMEN_CITATION} translation={SPECIMEN_TRANSLATION}>
            {SPECIMEN}
          </QuranText>
        </Section>

        <Section title="Radial word menu — the reader's signature interaction">
          <RadialMenuPrototype />
        </Section>

        <Section title="Illuminated divider and gold-leaf moment">
          <IlluminatedDivider />
          <IlluminatedDivider>Al-Hikmah</IlluminatedDivider>
          <div className="mt-6">
            <LeafMoment>Companionship accepted</LeafMoment>
            <span className="ms-3 text-sm text-foreground-secondary">
              — catches light once, never loops
            </span>
          </div>
        </Section>

        <Section title="Empty state — an invitation on craft">
          <GirihEmptyState
            title="Your Minbar is quiet."
            description="Find your companions to begin — posts from your circle will gather here."
            action={<Button>Find companions</Button>}
          />
        </Section>

        <Section title="Motion — everywhere calm, spectacle in one place">
          <div className="text-sm text-foreground-secondary space-y-1">
            <div>
              <code className="text-foreground">--ease-sakina</code> cubic-bezier(0.22, 1, 0.36,
              1) — no overshoot, no bounce, nothing loops for attention
            </div>
            <div>
              <code className="text-foreground">--dur-quick</code> 180ms ·{" "}
              <code className="text-foreground">--dur-base</code> 280ms ·{" "}
              <code className="text-foreground">--dur-slow</code> 420ms ·{" "}
              <code className="text-foreground">--dur-arrival</code> 800ms (hero only)
            </div>
            <div>
              Routes rise in; lists stagger; cards lift on hover; buttons press
              on tap. prefers-reduced-motion collapses everything.
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
