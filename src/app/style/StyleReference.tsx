"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GirihLoader,
  IlluminatedDivider,
  GirihEmptyState,
  GirihPattern,
  LeafMoment,
} from "@/components/ui/girih";
import { QuranText } from "@/components/ui/QuranText";
import { useToast } from "@/hooks/useToast";

const NIGHT_SWATCHES = [
  { name: "night-900 · bg", cls: "bg-background border border-border" },
  { name: "night-800 · surface", cls: "bg-background-secondary" },
  { name: "night-700 · lifted", cls: "bg-background-tertiary" },
  { name: "bone-100 · text", cls: "bg-[#ECE7DA]" },
  { name: "bone-300 · muted", cls: "bg-[#9AA3B8]" },
  { name: "lapis-500 · primary", cls: "bg-primary-500" },
  { name: "lapis-300 · ring", cls: "bg-primary-300" },
  { name: "leaf-500 · rare", cls: "bg-secondary-500" },
  { name: "verdigris", cls: "bg-[#2E8B84]" },
  { name: "positive", cls: "bg-success-500" },
  { name: "caution", cls: "bg-warning-500" },
  { name: "danger", cls: "bg-error-500" },
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
  const [theme, setTheme] = useState<"night" | "day">(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "day"
      ? "day"
      : "night"
  );
  const [dir, setDir] = useState<"ltr" | "rtl">(() =>
    typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr"
  );

  const applyTheme = useCallback((t: "night" | "day") => {
    setTheme(t);
    if (t === "day") document.documentElement.dataset.theme = "day";
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
              <h1 className="font-display text-3xl font-medium">
                The design language
              </h1>
              <p className="mt-2 text-foreground-secondary max-w-md">
                Sakina — a quiet courtyard after the noisy street. Every
                component in Phases 3–8 inherits from this page.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "night" ? "default" : "quiet"}
                size="sm"
                onClick={() => applyTheme("night")}
              >
                Night
              </Button>
              <Button
                variant={theme === "day" ? "default" : "quiet"}
                size="sm"
                onClick={() => applyTheme("day")}
              >
                Day
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

        <Section title="Palette — night, bone, lapis, leaf">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {NIGHT_SWATCHES.map((s) => (
              <div key={s.name}>
                <div className={`h-12 rounded-[var(--radius)] ${s.cls}`} />
                <div className="mt-1.5 text-xs text-foreground-secondary">{s.name}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-foreground-secondary max-w-prose">
            Gold leaf is illumination, not a button color — it marks rare,
            meaningful moments. Components reference semantic tokens only.
          </p>
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
          <QuranText
            citation="Al-Baqarah 2:152"
            translation="So remember Me; I will remember you. And be grateful to Me and do not deny Me."
          >
            فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ
          </QuranText>
        </Section>

        <Section title="The loader — a shamsa unfolding (light, not a spinner)">
          <div className="flex items-end gap-10">
            <GirihLoader size="sm" />
            <GirihLoader size="md" />
            <GirihLoader size="lg" />
            <p className="text-sm text-foreground-secondary max-w-[26ch]">
              The radiant medallion of manuscript frontispieces blooms open,
              rays breathe, a gold core settles. Under reduced motion it
              renders fully bloomed and still.
            </p>
          </div>
        </Section>

        <Section title="Buttons — quiet by default, light where earned">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Send request</Button>
            <Button variant="quiet">Decline</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Block</Button>
            <Button disabled>Disabled</Button>
            <Button variant="link">Learn more</Button>
          </div>
          <p className="mt-3 text-sm text-foreground-secondary">
            Focus ring is a lapis glow — tab through to see it. Tap targets
            are 44px minimum.
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
          <div className="rounded-[var(--radius-md)] border border-border bg-card p-5 max-w-md">
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

        <Section title="Toast — the control names the act; the toast confirms it">
          <Button variant="quiet" onClick={() => success("Request sent")}>
            Send request
          </Button>
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

        <Section title="Empty state — an invitation, never an apology">
          <GirihEmptyState
            title="Your Minbar is quiet."
            description="Find your companions to begin — posts from your circle will gather here."
            action={<Button>Find companions</Button>}
          />
        </Section>

        <Section title="Ambient texture — behind content, opacity ≤ 4%">
          <div className="relative rounded-[var(--radius-md)] border border-border bg-background-secondary p-8 overflow-hidden">
            <GirihPattern className="text-foreground" />
            <p className="relative text-foreground-secondary text-sm max-w-prose">
              The khatam lattice sits behind quiet areas at whisper opacity.
              It never competes with reading, and it is never scripture —
              reverent with the word, generous with the geometry.
            </p>
          </div>
        </Section>

        <Section title="Motion — sakina">
          <div className="text-sm text-foreground-secondary space-y-1">
            <div><code className="text-foreground">--ease-sakina</code> cubic-bezier(0.22, 1, 0.36, 1) — no overshoot, no bounce</div>
            <div><code className="text-foreground">--dur-quick</code> 180ms · <code className="text-foreground">--dur-base</code> 280ms · <code className="text-foreground">--dur-slow</code> 420ms · <code className="text-foreground">--dur-arrival</code> 700ms</div>
            <div>prefers-reduced-motion replaces all motion with instant transitions.</div>
          </div>
        </Section>
      </div>
    </div>
  );
}
