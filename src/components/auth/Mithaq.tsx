"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

interface MithaqProps {
  onScrollComplete: (scrolled: boolean) => void;
  hasScrolledToBottom: boolean;
}

export function Mithaq({ onScrollComplete, hasScrolledToBottom }: MithaqProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const totalScrollable = scrollHeight - clientHeight;
      const progress = (scrollTop / totalScrollable) * 100;

      setScrollProgress(Math.min(progress, 100));

      // Consider scrolled to bottom when 95% or more
      if (progress >= 95 && !hasScrolledToBottom) {
        onScrollComplete(true);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [hasScrolledToBottom, onScrollComplete]);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <span className="text-sm text-muted-foreground min-w-[50px]">
          {Math.round(scrollProgress)}%
        </span>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto px-6 py-4 bg-background-secondary rounded-lg border border-border space-y-4"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground font-arabic">
              المِيثَاق
            </h2>
            <h3 className="text-xl font-semibold text-foreground">
              The Mithaq (Covenant)
            </h3>
            <p className="text-sm text-muted-foreground">
              Barakah.Social Community Guidelines
            </p>
          </div>

          {/* Introduction */}
          <div className="space-y-3">
            <p className="text-foreground-secondary leading-relaxed">
              Bismillah ir-Rahman ir-Rahim. Welcome to Barakah.Social, a space
              for Muslims to learn, share, and grow together in faith. By
              joining our community, you enter into a sacred covenant (Mithaq)
              to uphold Islamic ethics and create a beneficial environment for
              all.
            </p>
          </div>

          {/* Core Principles */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary-600" />
              Core Principles
            </h4>
            <ul className="space-y-2 ml-7">
              <li className="text-foreground-secondary">
                <strong>Sincerity (Ikhlas):</strong> Seek knowledge and share
                wisdom with pure intentions, seeking Allah&apos;s pleasure alone.
              </li>
              <li className="text-foreground-secondary">
                <strong>Beneficial Knowledge:</strong> Share authentic, verified
                information from reliable Islamic sources.
              </li>
              <li className="text-foreground-secondary">
                <strong>Good Character (Akhlaq):</strong> Interact with kindness,
                respect, and the noble character exemplified by Prophet Muhammad
                (ﷺ).
              </li>
            </ul>
          </div>

          {/* What We Encourage */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              What We Encourage
            </h4>
            <ul className="space-y-2 ml-7 list-disc list-inside">
              <li className="text-foreground-secondary">
                Sharing authentic knowledge from Quran and Sunnah
              </li>
              <li className="text-foreground-secondary">
                Respectful discussions and scholarly differences
              </li>
              <li className="text-foreground-secondary">
                Helping and supporting fellow Muslims
              </li>
              <li className="text-foreground-secondary">
                Seeking clarification when unsure
              </li>
              <li className="text-foreground-secondary">
                Citing sources and references
              </li>
              <li className="text-foreground-secondary">
                Constructive advice given with wisdom
              </li>
            </ul>
          </div>

          {/* What We Prohibit */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-error flex items-center gap-2">
              <Circle className="w-5 h-5" />
              What We Prohibit
            </h4>
            <ul className="space-y-2 ml-7">
              <li className="text-foreground-secondary">
                <strong>Ghibah (Backbiting):</strong> Speaking ill of others in
                their absence
              </li>
              <li className="text-foreground-secondary">
                <strong>Takfir:</strong> Declaring other Muslims as disbelievers
                without proper authority
              </li>
              <li className="text-foreground-secondary">
                <strong>Fitna:</strong> Causing division, discord, or mischief
                within the community
              </li>
              <li className="text-foreground-secondary">
                <strong>Hate Speech:</strong> Any form of prejudice, racism, or
                discrimination
              </li>
              <li className="text-foreground-secondary">
                <strong>Misinformation:</strong> Sharing unverified or false
                Islamic rulings
              </li>
              <li className="text-foreground-secondary">
                <strong>Inappropriate Content:</strong> Content that contradicts
                Islamic values
              </li>
            </ul>
          </div>

          {/* Rights and Responsibilities */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-foreground">
              Your Rights and Responsibilities
            </h4>
            <div className="space-y-2">
              <p className="text-foreground-secondary">
                <strong>You have the right to:</strong>
              </p>
              <ul className="space-y-1 ml-7 list-disc list-inside text-foreground-secondary">
                <li>Learn and ask questions without judgment</li>
                <li>Express opinions within Islamic framework</li>
                <li>Report content that violates these guidelines</li>
                <li>Privacy and data protection</li>
              </ul>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-foreground-secondary">
                <strong>You are responsible for:</strong>
              </p>
              <ul className="space-y-1 ml-7 list-disc list-inside text-foreground-secondary">
                <li>Verifying information before sharing</li>
                <li>Respecting diverse Islamic scholarly opinions</li>
                <li>Maintaining confidentiality when appropriate</li>
                <li>Contributing positively to discussions</li>
              </ul>
            </div>
          </div>

          {/* Moderation */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-foreground">
              Moderation and Enforcement
            </h4>
            <p className="text-foreground-secondary leading-relaxed">
              Our moderation team, including verified scholars, reviews reported
              content. Violations may result in warnings, temporary suspension, or
              permanent removal from the platform. We seek to advise with wisdom
              before taking severe actions.
            </p>
          </div>

          {/* Scholarly Guidance */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-foreground">
              Seeking Scholarly Guidance
            </h4>
            <p className="text-foreground-secondary leading-relaxed">
              For complex Islamic matters, we encourage consulting qualified
              scholars. Our verified scholars are available to provide guidance,
              but their views represent their scholarly opinions within their
              madhab and should be respected as such.
            </p>
          </div>

          {/* Updates */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-foreground">
              Updates to the Mithaq
            </h4>
            <p className="text-foreground-secondary leading-relaxed">
              We may update these guidelines to better serve our community. Major
              changes will be communicated to all members. Continued use of the
              platform constitutes acceptance of updates.
            </p>
          </div>

          {/* Closing */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-foreground-secondary leading-relaxed italic">
              &ldquo;The believers are but brothers, so make settlement between your
              brothers. And fear Allah that you may receive mercy.&rdquo;
            </p>
            <p className="text-sm text-muted-foreground text-right">
              — Quran 49:10
            </p>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              By accepting this Mithaq, you commit to these principles and
              acknowledge your responsibility to our community.
            </p>
          </div>

          {/* Scroll indicator at bottom */}
          {scrollProgress < 95 && (
            <div className="text-center pt-4">
              <motion.p
                className="text-sm text-primary-600 font-medium"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ↓ Please scroll to continue ↓
              </motion.p>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {hasScrolledToBottom ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-success font-medium">
              You have read the Mithaq
            </span>
          </>
        ) : (
          <>
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Please read the entire Mithaq to continue
            </span>
          </>
        )}
      </div>
    </div>
  );
}

