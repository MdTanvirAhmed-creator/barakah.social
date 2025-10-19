"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface UserWarningProps {
  warning: {
    id: string;
    violation: string;
    violationLabel: string;
    content_preview?: string;
    consequence: string;
    severity: "low" | "medium" | "high" | "critical";
    issued_at: string;
  };
  onAcknowledge: () => void;
  onDismiss?: () => void;
}

const SEVERITY_CONFIG = {
  low: {
    color: "from-blue-600 to-indigo-600",
    textColor: "text-blue-900 dark:text-blue-100",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  medium: {
    color: "from-yellow-600 to-orange-600",
    textColor: "text-yellow-900 dark:text-yellow-100",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  high: {
    color: "from-orange-600 to-red-600",
    textColor: "text-orange-900 dark:text-orange-100",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  critical: {
    color: "from-red-600 to-rose-600",
    textColor: "text-red-900 dark:text-red-100",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
};

export function UserWarning({ warning, onAcknowledge, onDismiss }: UserWarningProps) {
  const config = SEVERITY_CONFIG[warning.severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-card rounded-lg shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Warning Header */}
        <div className={`bg-gradient-to-r ${config.color} p-6 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Community Warning</h2>
                <p className="text-sm opacity-90">Action Required</p>
              </div>
            </div>
            {onDismiss && warning.severity === "low" && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-90 mb-1">Violation Type</div>
            <div className="font-bold text-lg">{warning.violationLabel}</div>
          </div>
        </div>

        {/* Warning Content */}
        <div className="p-6 space-y-4">
          {/* Violation Details */}
          <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
            <div className="flex items-start gap-3">
              <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.textColor}`} />
              <div className="flex-1">
                <h3 className={`font-semibold ${config.textColor} mb-2`}>
                  What Happened
                </h3>
                <p className="text-sm text-foreground-secondary">
                  Our moderation team has identified content that violates our community guidelines.
                  This action goes against Islamic principles of respect and beneficial speech.
                </p>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          {warning.content_preview && (
            <div className="bg-muted rounded-lg p-4">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Reported Content
              </Label>
              <div className="text-sm text-foreground-secondary italic line-clamp-3">
                &quot;{warning.content_preview}&quot;
              </div>
            </div>
          )}

          {/* Consequence */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Consequence
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {warning.consequence}
                </p>
              </div>
            </div>
          </div>

          {/* Islamic Reminder */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
              Islamic Guidance
            </h3>
            <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
              The Prophet Muhammad (ﷺ) said: &quot;Whoever believes in Allah and the Last Day should speak good or remain silent.&quot; (Sahih al-Bukhari)
            </p>
            <Link href="/community-guidelines" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              <ExternalLink className="w-4 h-4" />
              Review Community Guidelines
            </Link>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onAcknowledge}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              I Understand & Acknowledge
            </Button>
            {onDismiss && warning.severity === "low" && (
              <Button
                onClick={onDismiss}
                variant="ghost"
              >
                Dismiss
              </Button>
            )}
          </div>

          {/* Severity Note */}
          {warning.severity === "critical" && (
            <div className="text-center text-sm text-error">
              ⚠️ Critical violation - Multiple offenses may result in account suspension
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
