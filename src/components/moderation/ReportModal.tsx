"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  AlertTriangle,
  Flag,
  MessageSquare,
  Shield,
  Info,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

interface ReportModalProps {
  contentType: "post" | "comment" | "profile";
  contentId: string;
  contentAuthor?: string;
  onClose: () => void;
}

const VIOLATION_CATEGORIES = [
  {
    id: "ghibah",
    label: "Ghibah/Namimah (Backbiting/Gossip)",
    description: "Speaking about someone in their absence in a way they would dislike",
    icon: MessageSquare,
    severity: "high",
    ayah: "\"Neither backbite one another\" (Quran 49:12)",
  },
  {
    id: "takfir",
    label: "Takfir (False Accusation of Disbelief)",
    description: "Falsely accusing a Muslim of being a disbeliever",
    icon: AlertTriangle,
    severity: "critical",
    ayah: "\"If a man says to his brother, O Kafir...\" (Hadith)",
  },
  {
    id: "fitna",
    label: "Spreading Fitna (Discord)",
    description: "Creating division and conflict among Muslims",
    icon: Shield,
    severity: "high",
    ayah: "\"And fear the Fitna\" (Quran 8:25)",
  },
  {
    id: "hate_speech",
    label: "Hate Speech",
    description: "Attacking individuals or groups based on identity",
    icon: Flag,
    severity: "critical",
    ayah: "\"Let there be no compulsion in religion\" (Quran 2:256)",
  },
  {
    id: "misinformation",
    label: "Misinformation",
    description: "Sharing false or unverified Islamic information",
    icon: Info,
    severity: "medium",
    ayah: "\"Verify before you accept any news\" (Quran 49:6)",
  },
  {
    id: "spam",
    label: "Spam or Advertisement",
    description: "Unsolicited commercial content or repeated posting",
    icon: Flag,
    severity: "low",
    ayah: null,
  },
];

const REPORT_SCHEMA = z.object({
  category: z.string().min(1, "Please select a violation category"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

type ReportFormData = z.infer<typeof REPORT_SCHEMA>;

export function ReportModal({ contentType, contentId, contentAuthor, onClose }: ReportModalProps) {
  const { success } = useToast();
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [selectedCategory, setSelectedCategory] = useState<typeof VIOLATION_CATEGORIES[0] | null>(null);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(REPORT_SCHEMA),
    defaultValues: {
      category: "",
      description: "",
    },
  });

  const handleCategorySelect = (category: typeof VIOLATION_CATEGORIES[0]) => {
    setSelectedCategory(category);
    form.setValue("category", category.id);
    setStep("confirm");
  };

  const handleSubmit = (data: ReportFormData) => {
    // In production, this would submit to the database
    console.log("Report submitted:", { contentType, contentId, ...data });
    
    setStep("success");
    
    setTimeout(() => {
      success("Report submitted. JazakAllah Khair for helping maintain our community standards.");
      onClose();
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      case "high":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Flag className="w-6 h-6 text-error" />
                Report Content
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Help us maintain Islamic standards of conduct
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Step 1: Select Category */}
            {step === "select" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-medium mb-1">Islamic Accountability (Hisbah)</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Reporting is an act of Hisbah - commanding good and forbidding evil.
                        Please report only genuine violations to maintain the integrity of our community.
                      </p>
                    </div>
                  </div>
                </div>

                <Label className="text-base font-semibold">
                  What type of violation are you reporting?
                </Label>

                <div className="space-y-3">
                  {VIOLATION_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md ${getSeverityColor(category.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <category.icon className="w-6 h-6 mt-1 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-foreground mb-1">
                            {category.label}
                          </div>
                          <div className="text-sm text-foreground-secondary mb-2">
                            {category.description}
                          </div>
                          {category.ayah && (
                            <div className="text-xs italic text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded">
                              {category.ayah}
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          category.severity === "critical" ? "bg-red-600 text-white" :
                          category.severity === "high" ? "bg-orange-600 text-white" :
                          category.severity === "medium" ? "bg-yellow-600 text-white" :
                          "bg-blue-600 text-white"
                        }`}>
                          {category.severity}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Confirm with Description */}
            {step === "confirm" && selectedCategory && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className={`p-4 rounded-lg border-2 ${getSeverityColor(selectedCategory.severity)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <selectedCategory.icon className="w-6 h-6" />
                    <span className="font-semibold text-foreground">
                      {selectedCategory.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {selectedCategory.description}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">
                    Additional Details (Optional)
                  </Label>
                  <textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Provide any additional context that would help our moderation team..."
                    className="w-full mt-2 p-3 bg-background border border-border rounded-lg text-sm resize-none min-h-[120px]"
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {500 - (form.watch("description")?.length || 0)} characters remaining
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-900 dark:text-yellow-100">
                      <p className="font-medium mb-1">Important Reminder</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        False reports are themselves a violation of Islamic ethics. 
                        Our moderation team will review this report carefully. May Allah guide us all.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("select")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleSubmit)}
                    className="flex-1 bg-error hover:bg-error/90"
                  >
                    Submit Report
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Report Submitted
                </h3>
                <p className="text-foreground-secondary mb-4">
                  JazakAllah Khair for upholding community standards
                </p>
                <p className="text-sm text-muted-foreground">
                  Our moderation team will review this report within 24 hours
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
