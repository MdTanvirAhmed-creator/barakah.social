"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Search,
  Clock,
  AlertCircle,
  Info,
  Check,
  Users,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";

interface DebateCreatorProps {
  onClose: () => void;
  onSubmit: (debate: DebateData) => void;
}

interface DebateData {
  topic: string;
  description: string;
  opponent_id: string;
  time_limit: number;
  max_rounds: number;
  sources_required: boolean;
}

// Mock users for opponent selection
const MOCK_USERS = [
  {
    id: "1",
    username: "ahmad_scholar",
    full_name: "Sheikh Ahmad Al-Maliki",
    is_verified_scholar: true,
    avatar_url: null,
  },
  {
    id: "2",
    username: "dr_fatima",
    full_name: "Dr. Fatima Rahman",
    is_verified_scholar: true,
    avatar_url: null,
  },
  {
    id: "3",
    username: "omar_fiqh",
    full_name: "Omar Al-Fiqhi",
    is_verified_scholar: false,
    avatar_url: null,
  },
  {
    id: "4",
    username: "aisha_student",
    full_name: "Aisha Mohammed",
    is_verified_scholar: false,
    avatar_url: null,
  },
];

const DEBATE_SCHEMA = z.object({
  topic: z.string().min(10, "Topic must be at least 10 characters").max(200, "Topic too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(500, "Description too long"),
  opponent_id: z.string().min(1, "Please select an opponent"),
  time_limit: z.number().min(1).max(24),
  max_rounds: z.number().min(2).max(10),
  sources_required: z.boolean(),
});

const DEBATE_GUIDELINES = [
  "Maintain respectful discourse at all times",
  "Base arguments on authentic Islamic sources",
  "Avoid personal attacks (ad hominem)",
  "Cite sources for major claims",
  "Stay on topic throughout the debate",
  "Accept the final decision gracefully",
];

const TIME_LIMITS = [
  { value: 1, label: "1 hour per round" },
  { value: 3, label: "3 hours per round" },
  { value: 6, label: "6 hours per round" },
  { value: 12, label: "12 hours per round" },
  { value: 24, label: "24 hours per round" },
];

const ROUND_OPTIONS = [
  { value: 2, label: "2 rounds" },
  { value: 3, label: "3 rounds" },
  { value: 4, label: "4 rounds" },
  { value: 5, label: "5 rounds" },
];

export function DebateCreator({ onClose, onSubmit }: DebateCreatorProps) {
  const { success, error: showError } = useToast();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState<typeof MOCK_USERS[0] | null>(null);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);

  const form = useForm<DebateData>({
    resolver: zodResolver(DEBATE_SCHEMA),
    defaultValues: {
      topic: "",
      description: "",
      opponent_id: "",
      time_limit: 6,
      max_rounds: 3,
      sources_required: true,
    },
  });

  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpponentSelect = (user: typeof MOCK_USERS[0]) => {
    setSelectedOpponent(user);
    form.setValue("opponent_id", user.id);
    setSearchQuery("");
  };

  const handleSubmit = (data: DebateData) => {
    if (!guidelinesAccepted) {
      showError("Please accept the debate guidelines");
      return;
    }

    onSubmit(data);
    success("Debate invitation sent!");
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
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
            <h2 className="text-2xl font-bold text-foreground">Create Debate</h2>
            <p className="text-sm text-muted-foreground">
              Engage in structured Islamic discourse
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 p-4 bg-muted/50">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s
                    ? "bg-primary-600 text-white"
                    : step > s
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className="w-12 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Topic & Description */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="topic">Debate Topic *</Label>
                <Input
                  id="topic"
                  {...form.register("topic")}
                  placeholder="e.g., The Role of Ijma in Contemporary Fiqh"
                  className="mt-2"
                />
                {form.formState.errors.topic && (
                  <p className="text-sm text-error mt-1">{form.formState.errors.topic.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Provide context and clarify your position on this topic..."
                  className="w-full mt-2 p-3 bg-background border border-border rounded-lg text-sm resize-none min-h-[120px]"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-error mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Choose your topic wisely</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Select topics that are scholarly, respectful, and beneficial to the community.
                      Avoid controversial issues that may lead to fitna.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.watch("topic") || !form.watch("description")}
                className="w-full bg-primary-600 hover:bg-primary-700"
              >
                Continue to Select Opponent
              </Button>
            </motion.div>
          )}

          {/* Step 2: Opponent Selection */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label>Select Opponent *</Label>
                <div className="mt-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or name..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Selected Opponent */}
              {selectedOpponent && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedOpponent.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                          {getInitials(selectedOpponent.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {selectedOpponent.full_name}
                          </span>
                          {selectedOpponent.is_verified_scholar && (
                            <Check className="w-4 h-4 text-primary-500 fill-primary-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          @{selectedOpponent.username}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOpponent(null)}
                      className="text-error hover:text-error/80"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* User List */}
              {searchQuery && !selectedOpponent && (
                <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleOpponentSelect(user)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{user.full_name}</span>
                          {user.is_verified_scholar && (
                            <Check className="w-4 h-4 text-primary-500 fill-primary-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">@{user.username}</span>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedOpponent}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  Continue to Settings
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Settings & Guidelines */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Time Limit */}
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Limit per Round
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TIME_LIMITS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("time_limit", option.value)}
                      className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                        form.watch("time_limit") === option.value
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                          : "border-border hover:border-primary-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Rounds */}
              <div>
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Number of Rounds
                </Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {ROUND_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("max_rounds", option.value)}
                      className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                        form.watch("max_rounds") === option.value
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                          : "border-border hover:border-primary-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sources Required */}
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  {...form.register("sources_required")}
                  className="w-5 h-5 rounded border-border"
                />
                <div className="flex-1">
                  <Label className="font-medium">Require Source Citations</Label>
                  <p className="text-sm text-muted-foreground">
                    Participants must cite authentic sources for their arguments
                  </p>
                </div>
              </div>

              {/* Guidelines */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <Label className="font-semibold">Debate Guidelines</Label>
                </div>
                <div className="space-y-2 mb-4">
                  {DEBATE_GUIDELINES.map((guideline, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-foreground-secondary">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>{guideline}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    checked={guidelinesAccepted}
                    onChange={(e) => setGuidelinesAccepted(e.target.checked)}
                    className="w-5 h-5 rounded border-border mt-0.5"
                  />
                  <label className="text-sm text-foreground cursor-pointer">
                    I accept the debate guidelines and commit to respectful scholarly discourse
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!guidelinesAccepted}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  Create Debate
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
