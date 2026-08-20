"use client";

import * as React from "react";
import { Repeat, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Memorisation controls.
 *
 * Everything here serves repetition and self-testing, and nothing here
 * scores anyone: there is no streak, no daily target, no comparison, and
 * no way for another member to see any of it. Progress is a private tally
 * the reader sets themselves — the platform's job is to hold the place and
 * play the ayah again, not to grade the hifz.
 */
export interface MemorizationBarProps {
  repeat: number;
  onRepeatChange: (n: number) => void;
  delaySeconds: number;
  onDelayChange: (n: number) => void;
  concealed: boolean;
  onToggleConceal: () => void;
  memorised: number;
  total: number;
}

const REPEATS = [1, 3, 5, 10];

export function MemorizationBar({
  repeat,
  onRepeatChange,
  delaySeconds,
  onDelayChange,
  concealed,
  onToggleConceal,
  memorised,
  total,
}: MemorizationBarProps) {
  return (
    <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Repeat</span>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            {REPEATS.map((n) => (
              <button
                key={n}
                onClick={() => onRepeatChange(n)}
                aria-pressed={repeat === n}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors",
                  repeat === n
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {n}×
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="mem-delay" className="text-xs text-muted-foreground">
            Pause between
          </label>
          <input
            id="mem-delay"
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={delaySeconds}
            onChange={(e) => onDelayChange(Number(e.target.value))}
            className="w-28 accent-[rgb(var(--primary-600))]"
          />
          <span className="text-xs tabular-nums text-muted-foreground w-10">
            {delaySeconds}s
          </span>
        </div>

        <button
          onClick={onToggleConceal}
          aria-pressed={concealed}
          className={cn(
            "inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            concealed
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {concealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {concealed ? "Text hidden" : "Hide text"}
        </button>

        <p className="ms-auto text-xs text-muted-foreground">
          {memorised} of {total} marked memorised
        </p>
      </div>
    </div>
  );
}
