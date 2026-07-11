import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The craft layer — girih watermark, tazhib corner, gold-leaf marks,
 * and the shamsa signature. Built once, themed via tokens.
 *
 * Division of labour (spec §5–6):
 *  - girih   = texture/watermark only, never animated as a loader
 *  - shamsa  = the one signature: welcome hero (once) + everyday loader
 *  - tazhib  = gold corner ornament that frames, never shouts
 *  - gold    = --leaf, rare meaningful marks only
 *
 * Adab: geometry is generous, scripture is not texture. No sacred text
 * ever appears in this module.
 */

/* ============================================================
   Shamsa — one component, two modes (spec §6)
   ============================================================ */

/* 12-petal geometry in a 200×200 viewBox */
const PETAL = "M100 100 C93 82 93 62 100 46 C107 62 107 82 100 100 Z";
const RAYS = [
  [116.05, 40.11, 119.67, 26.59],
  [143.84, 56.16, 153.74, 46.26],
  [159.89, 83.95, 173.41, 80.33],
  [159.89, 116.05, 173.41, 119.67],
  [143.84, 143.84, 153.74, 153.74],
  [116.05, 159.89, 119.67, 173.41],
  [83.95, 159.89, 80.33, 173.41],
  [56.16, 143.84, 46.26, 153.74],
  [40.11, 116.05, 26.59, 119.67],
  [40.11, 83.95, 26.59, 80.33],
  [56.16, 56.16, 46.26, 46.26],
  [83.95, 40.11, 80.33, 26.59],
] as const;

const SHAMSA_SIZES = { sm: 28, md: 48, lg: 80, hero: 160 } as const;

export interface ShamsaProps {
  /**
   * "loader" (default): the quiet everyday indicator — a minimal
   * medallion turning slowly in --primary. No gold, no bloom,
   * gone the instant content is ready.
   * "hero": the welcome bloom — twelve petals unfold once (~800ms,
   * sakina ease), rays breathe once, the gold-leaf core settles.
   * Spectacle, spent only at the first-open welcome.
   */
  mode?: "hero" | "loader";
  size?: keyof typeof SHAMSA_SIZES;
  label?: string;
  className?: string;
}

export function Shamsa({ mode = "loader", size, label, className }: ShamsaProps) {
  const px = SHAMSA_SIZES[size ?? (mode === "hero" ? "hero" : "md")];

  if (mode === "hero") {
    return (
      <span
        role="img"
        aria-label={label ?? "A shamsa medallion blooming"}
        className={cn("inline-flex", className)}
      >
        <svg width={px} height={px} viewBox="0 0 200 200" aria-hidden="true">
          {Array.from({ length: 12 }, (_, k) => (
            <g key={k} transform={`rotate(${k * 30} 100 100)`}>
              <path
                className="shamsa-hero-petal"
                style={{ animationDelay: `${k * 25}ms` }}
                d={PETAL}
                fill="rgb(var(--primary) / 0.16)"
                stroke="rgb(var(--primary))"
                strokeWidth="1.6"
                opacity="0.95"
              />
            </g>
          ))}
          <g
            className="shamsa-hero-rays"
            stroke="rgb(var(--primary))"
            strokeWidth="1.4"
            opacity="0.5"
          >
            {RAYS.map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />
            ))}
          </g>
          <circle
            className="shamsa-hero-halo"
            cx="100"
            cy="100"
            r="15"
            fill="none"
            stroke="var(--leaf)"
            strokeWidth="1.2"
            opacity="0.35"
          />
          <circle className="shamsa-hero-core" cx="100" cy="100" r="8.5" fill="var(--leaf)" />
        </svg>
      </span>
    );
  }

  /* loader: minimal — thin ring + eight small petals, primary only,
     turning slowly. Static under reduced motion. */
  return (
    <span role="status" aria-label={label ?? "Loading"} className={cn("inline-flex", className)}>
      <svg width={px} height={px} viewBox="0 0 200 200" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="rgb(var(--foreground-secondary))"
          strokeWidth="2"
          opacity="0.2"
        />
        <g className="shamsa-loader-turn">
          {Array.from({ length: 8 }, (_, k) => (
            <g key={k} transform={`rotate(${k * 45} 100 100)`}>
              <path
                d="M100 100 C95 86 95 70 100 58 C105 70 105 86 100 100 Z"
                fill="none"
                stroke="rgb(var(--primary))"
                strokeWidth="2"
                opacity="0.75"
              />
            </g>
          ))}
          <circle cx="100" cy="100" r="5" fill="rgb(var(--primary))" opacity="0.75" />
        </g>
      </svg>
    </span>
  );
}

export interface GirihLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/**
 * Legacy alias — everything that auto-inherits a loader gets the QUIET
 * mode (spec adoption rule: the bloom never becomes the everyday loader).
 */
export function GirihLoader({ size = "md", label, className }: GirihLoaderProps) {
  return <Shamsa mode="loader" size={size} label={label} className={className} />;
}
export const ShamsaLoader = GirihLoader;

/* ============================================================
   Gold-leaf accent primitive (spec §5) — the shared diamond mark
   ============================================================ */

export interface GoldDiamondProps {
  /** Side length in px (rendered as a rotated square). */
  size?: number;
  /** Catch light once on load (never loops). */
  shimmer?: boolean;
  className?: string;
}

export function GoldDiamond({ size = 8, shimmer = false, className }: GoldDiamondProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block rotate-45 flex-shrink-0", shimmer && "gold-catch", className)}
      style={{ width: size, height: size, background: "var(--leaf)" }}
    />
  );
}

/* ============================================================
   Tazhib corner ornament (spec §5) — frames, doesn't shout.
   Positioned with logical properties so it mirrors in RTL.
   Parent needs position: relative.
   ============================================================ */

export interface TazhibCornerProps {
  corner?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  /** Ornament box size in px. */
  size?: number;
  className?: string;
}

export function TazhibCorner({ corner = "top-start", size = 44, className }: TazhibCornerProps) {
  const pos: Record<NonNullable<TazhibCornerProps["corner"]>, string> = {
    "top-start": "top-0 start-0",
    "top-end": "top-0 end-0",
    "bottom-start": "bottom-0 start-0",
    "bottom-end": "bottom-0 end-0",
  };
  // Artwork is drawn hugging a top-left corner; flip so it hugs its own
  // corner in both directions (logical inset + rtl mirror).
  const flip: Record<NonNullable<TazhibCornerProps["corner"]>, string> = {
    "top-start": "rtl:-scale-x-100",
    "top-end": "-scale-x-100 rtl:scale-x-100",
    "bottom-start": "-scale-y-100 rtl:-scale-x-100 rtl:-scale-y-100",
    "bottom-end": "-scale-x-100 -scale-y-100 rtl:scale-x-100 rtl:-scale-y-100",
  };
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute", pos[corner], className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 44 44" width={size} height={size} className={cn("transform", flip[corner])}>
        <g fill="none" stroke="var(--leaf)" strokeWidth="1.1" opacity="0.85">
          <path d="M2 30 L2 2 L30 2" />
          <path d="M7 24 L7 7 L24 7" opacity="0.55" />
          <path d="M16 2 A14 14 0 0 1 2 16" opacity="0.55" />
        </g>
        <rect x="12.6" y="12.6" width="5" height="5" transform="rotate(45 15.1 15.1)" fill="var(--leaf)" opacity="0.9" />
        <circle cx="2" cy="30" r="1.4" fill="var(--leaf)" opacity="0.7" />
        <circle cx="30" cy="2" r="1.4" fill="var(--leaf)" opacity="0.7" />
      </svg>
    </span>
  );
}

/* ============================================================
   Girih watermark (spec §5) — texture only, never a loader
   ============================================================ */

export interface GirihPatternProps {
  className?: string;
  /** ~30% fainter — for cards that carry body text. */
  subtle?: boolean;
}

/**
 * Faint traditional geometry behind quiet areas, themed via
 * --wm-stroke/--wm-opacity. Always behind content, never reducing
 * contrast. Also available as the `.girih-bg` CSS utility.
 */
export function GirihPattern({ className, subtle = false }: GirihPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("girih-bg pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={subtle ? { opacity: "calc(var(--wm-opacity) * 0.7)" } : undefined}
    />
  );
}

/* ============================================================
   Illuminated divider — hairlines meeting a gold mark
   ============================================================ */

export interface IlluminatedDividerProps {
  className?: string;
  children?: React.ReactNode;
}

export function IlluminatedDivider({ className, children }: IlluminatedDividerProps) {
  return (
    <div
      className={cn("flex items-center gap-4 my-8", className)}
      role="separator"
      aria-orientation="horizontal"
    >
      <span className="flex-1 border-t border-border" aria-hidden="true" />
      {children ? (
        <span className="font-display text-sm text-foreground-secondary tracking-wide">
          {children}
        </span>
      ) : (
        <GoldDiamond size={7} />
      )}
      <span className="flex-1 border-t border-border" aria-hidden="true" />
    </div>
  );
}

/* ============================================================
   Empty state (spec §8) — an invitation on craft, never a grey box
   ============================================================ */

export interface GirihEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function GirihEmptyState({ title, description, action, className }: GirihEmptyStateProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-card px-6 py-12 text-center overflow-hidden",
        className
      )}
    >
      <GirihPattern />
      <TazhibCorner corner="top-start" />
      <TazhibCorner corner="bottom-end" />
      <div className="relative">
        <h3 className="font-display text-xl text-foreground font-medium">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-foreground-secondary max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

/**
 * A gold-leaf moment: marks a completed, meaningful act. Catches light
 * once — never loops.
 */
export function LeafMoment({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "leaf-moment inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm",
        "border-[var(--leaf)] text-[var(--leaf)]",
        className
      )}
      style={{ borderColor: "color-mix(in srgb, var(--leaf) 40%, transparent)" }}
    >
      <GoldDiamond size={6} />
      {children}
    </span>
  );
}
