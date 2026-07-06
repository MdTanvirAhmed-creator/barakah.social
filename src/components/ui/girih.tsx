import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The girih motif engine — the brand texture, built once.
 *
 * - GirihLoader / ShamsaLoader: a shamsa — the radiant medallion of
 *   manuscript frontispieces — blooming open. Replaces every spinner.
 *   Renders fully bloomed and still under reduced motion.
 * - IlluminatedDivider: hairlines meeting a gold-leaf mark; the only
 *   sanctioned home for --accent-rare outside true moments.
 * - GirihPattern: tileable khatam (eight-point star) lattice for ambient
 *   texture — always behind content, opacity <= 4%, currentColor.
 * - GirihEmptyState: the empty screen as an invitation on geometry,
 *   never a sad grey box.
 *
 * Adab: geometry is generous, scripture is not texture. No sacred text
 * ever appears in this module.
 */

/* {10/3} decagram + decagon ring, r=70 centered in a 200 viewBox */
const DECAGRAM =
  "M100 30 L166.57 121.63 L58.86 156.63 L58.86 43.37 L166.57 78.37 L100 170 L33.43 78.37 L141.14 43.37 L141.14 156.63 L33.43 121.63 Z";
const DECAGON =
  "M100 30 L141.14 43.37 L166.57 78.37 L166.57 121.63 L141.14 156.63 L100 170 L58.86 156.63 L33.43 121.63 L33.43 78.37 L58.86 43.37 Z";

const LOADER_SIZES = { sm: 28, md: 48, lg: 80 } as const;

/* Shamsa rays: 12 short strokes between petals, r=62..76 */
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

/* One petal, pointing up from the center; rotated copies form the rosette */
const PETAL = "M100 100 C93 82 93 62 100 46 C107 62 107 82 100 100 Z";

export interface GirihLoaderProps {
  size?: keyof typeof LOADER_SIZES;
  label?: string;
  className?: string;
}

/**
 * The loader — a shamsa (the radiant "little sun" medallion that opens
 * illuminated Qur'an frontispieces) blooming: twelve petals unfold from
 * the center, rays of light breathe outward, a gold-leaf core settles.
 * Ornament evoking light — never scripture. There is no spinner in this
 * app. Under reduced motion it renders fully bloomed and still.
 */
export function GirihLoader({ size = "md", label = "Loading", className }: GirihLoaderProps) {
  const px = LOADER_SIZES[size];
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg width={px} height={px} viewBox="0 0 200 200" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="rgb(var(--foreground-secondary))"
          strokeWidth="1"
          opacity="0.14"
        />
        {Array.from({ length: 12 }, (_, k) => (
          <g key={k} transform={`rotate(${k * 30} 100 100)`}>
            <path
              className="shamsa-petal"
              style={{ animationDelay: `${k * 55}ms` }}
              d={PETAL}
              fill="rgb(var(--primary) / 0.16)"
              stroke="rgb(var(--color-primary-300))"
              strokeWidth="1.6"
              opacity="0.95"
            />
          </g>
        ))}
        <g className="shamsa-rays" stroke="rgb(var(--color-primary-300))" strokeWidth="1.4" opacity="0.55">
          {RAYS.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />
          ))}
        </g>
        <circle className="shamsa-halo" cx="100" cy="100" r="15" fill="none" stroke="var(--accent-rare)" strokeWidth="1.2" opacity="0.3" />
        <circle className="shamsa-core" cx="100" cy="100" r="8.5" fill="var(--accent-rare)" />
      </svg>
    </span>
  );
}

/** Preferred name going forward; GirihLoader stays as the wired-in alias. */
export const ShamsaLoader = GirihLoader;

export interface IlluminatedDividerProps {
  className?: string;
  /** Optional small heading rendered at the center instead of the gold mark. */
  children?: React.ReactNode;
}

/** A single illuminated band — never a plain rule. */
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
        <span
          className="w-2 h-2 rotate-45 bg-[var(--accent-rare)]"
          aria-hidden="true"
        />
      )}
      <span className="flex-1 border-t border-border" aria-hidden="true" />
    </div>
  );
}

/* Tileable khatam (eight-point star) lattice, 80x80 tile, stroke-only */
const KHATAM_TILE = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='currentColor' stroke-width='1'><rect x='18' y='18' width='44' height='44'/><path d='M40 8.9 L71.1 40 L40 71.1 L8.9 40 Z'/><path d='M0 0 L18 18 M80 0 L62 18 M0 80 L18 62 M80 80 L62 62'/></g></svg>`;

export interface GirihPatternProps {
  className?: string;
  /** 0–1; clamped to the 4% ceiling by default styles. */
  opacity?: number;
}

/**
 * Ambient geometric texture. Sits behind content, never competes,
 * never reduces text contrast. Color follows currentColor.
 */
export function GirihPattern({ className, opacity = 0.04 }: GirihPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        opacity: Math.min(opacity, 0.04),
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(KHATAM_TILE)}")`,
        backgroundSize: "80px 80px",
      }}
    />
  );
}

export interface GirihEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** The empty screen as an invitation to act, set on illuminated geometry. */
export function GirihEmptyState({
  title,
  description,
  action,
  className,
}: GirihEmptyStateProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-card px-6 py-12 text-center overflow-hidden",
        className
      )}
    >
      <GirihPattern className="text-foreground" />
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 200 200" aria-hidden="true" className="mx-auto mb-5">
          <path d={DECAGON} fill="none" stroke="rgb(var(--foreground-secondary))" strokeWidth="2" opacity="0.35" />
          <path d={DECAGRAM} fill="none" stroke="rgb(var(--primary))" strokeWidth="2.5" opacity="0.8" />
          <rect x="95" y="95" width="10" height="10" fill="var(--accent-rare)" />
        </svg>
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
 * A gold-leaf moment: marks a completed, meaningful act (companionship
 * accepted, dhikr completed). Catches light once — never loops.
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
        "border-[rgb(201_162_75_/_0.35)] text-[var(--accent-rare)]",
        className
      )}
    >
      <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rotate-45 bg-[var(--accent-rare)]" />
      {children}
    </span>
  );
}
