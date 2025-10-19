"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Users,
  FileText,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { useToast } from "@/hooks/useToast";

interface Argument {
  id: string;
  participant_id: string;
  round: number;
  content: string;
  sources: string[];
  created_at: string;
}

interface Debate {
  id: string;
  topic: string;
  description: string;
  status: "pending" | "ongoing" | "completed" | "cancelled";
  current_round: number;
  max_rounds: number;
  time_limit: number;
  sources_required: boolean;
  participant_a: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_verified_scholar: boolean;
  };
  participant_b: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_verified_scholar: boolean;
  };
  arguments_a: Argument[];
  arguments_b: Argument[];
  votes?: {
    participant_a: number;
    participant_b: number;
    total: number;
  };
  winner_id?: string | null;
  created_at: string;
  time_remaining?: number;
}

interface DebateViewProps {
  debate: Debate;
  onClose: () => void;
  currentUserId?: string;
}

const MOCK_DEBATE: Debate = {
  id: "1",
  topic: "The Role of Ijma (Consensus) in Contemporary Fiqh",
  description: "Should modern Islamic scholars rely on classical ijma or form new consensus on contemporary issues?",
  status: "ongoing",
  current_round: 2,
  max_rounds: 3,
  time_limit: 6,
  sources_required: true,
  participant_a: {
    id: "user1",
    username: "ahmad_scholar",
    full_name: "Sheikh Ahmad Al-Maliki",
    avatar_url: null,
    is_verified_scholar: true,
  },
  participant_b: {
    id: "user2",
    username: "dr_fatima",
    full_name: "Dr. Fatima Rahman",
    avatar_url: null,
    is_verified_scholar: true,
  },
  arguments_a: [
    {
      id: "a1",
      participant_id: "user1",
      round: 1,
      content: "Classical ijma serves as a foundational pillar that provides stability and continuity in Islamic jurisprudence. The consensus of early scholars, particularly the companions and tabi'een, holds special weight as they were closest to the source of revelation. Modern issues can be addressed through qiyas (analogy) while respecting established consensus.",
      sources: [
        "Al-Shatibi, Al-Muwafaqat, Vol 4, p. 56",
        "Ibn Taymiyyah, Majmu al-Fatawa, Vol 19, p. 234",
      ],
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  arguments_b: [
    {
      id: "b1",
      participant_id: "user2",
      round: 1,
      content: "While respecting classical ijma, we must acknowledge that contemporary issues require fresh scholarly consensus. Technology, medical advancements, and modern finance present scenarios the early scholars never encountered. A dynamic approach to ijma allows Islam to remain relevant while maintaining its principles.",
      sources: [
        "Yusuf al-Qaradawi, Contemporary Fiqh, p. 128",
        "Al-Ghazali, Al-Mustasfa, Vol 1, p. 178",
      ],
      created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    },
  ],
  created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  time_remaining: 3600, // 1 hour in seconds
};

export function DebateView({ debate: initialDebate, onClose, currentUserId }: DebateViewProps) {
  const { success } = useToast();
  const [debate, setDebate] = useState<Debate>(initialDebate || MOCK_DEBATE);
  const [userArgument, setUserArgument] = useState("");
  const [userSources, setUserSources] = useState<string[]>([""]);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(debate.time_remaining || 0);

  // Countdown timer
  useEffect(() => {
    if (debate.status === "ongoing" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [debate.status, timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const isParticipant = currentUserId === debate.participant_a.id || currentUserId === debate.participant_b.id;
  const isUserTurn = 
    (currentUserId === debate.participant_a.id && debate.arguments_a.length < debate.current_round) ||
    (currentUserId === debate.participant_b.id && debate.arguments_b.length < debate.current_round);

  const handleSubmitArgument = () => {
    // In production, this would submit to the database
    success("Argument submitted successfully!");
    setUserArgument("");
    setUserSources([""]);
  };

  const handleVote = (participantId: string) => {
    if (debate.status !== "completed") return;
    setSelectedVote(participantId);
    success("Vote recorded! JazakAllah Khair for participating.");
  };

  const addSourceField = () => {
    setUserSources([...userSources, ""]);
  };

  const updateSource = (index: number, value: string) => {
    const newSources = [...userSources];
    newSources[index] = value;
    setUserSources(newSources);
  };

  const removeSource = (index: number) => {
    setUserSources(userSources.filter((_, i) => i !== index));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getVotePercentage = (participantId: string) => {
    if (!debate.votes || debate.votes.total === 0) return 0;
    const votes = participantId === debate.participant_a.id 
      ? debate.votes.participant_a 
      : debate.votes.participant_b;
    return Math.round((votes / debate.votes.total) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{debate.topic}</h1>
            <p className="text-muted-foreground">{debate.description}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-muted-foreground">Round</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {debate.current_round} / {debate.max_rounds}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-muted-foreground">Time Left</span>
            </div>
            <div className={`text-2xl font-bold ${
              timeRemaining < 3600 ? "text-error" : "text-foreground"
            }`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-muted-foreground">Spectators</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {debate.votes?.total || 0}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-md border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-muted-foreground">Status</span>
            </div>
            <div className={`text-lg font-bold capitalize ${
              debate.status === "completed" ? "text-green-600" :
              debate.status === "ongoing" ? "text-blue-600" :
              "text-yellow-600"
            }`}>
              {debate.status}
            </div>
          </div>
        </div>

        {/* Split-Screen Arguments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Participant A Side */}
          <div className="bg-card rounded-lg shadow-md border-2 border-blue-200 dark:border-blue-800">
            {/* Participant Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src={debate.participant_a.avatar_url || undefined} />
                  <AvatarFallback className="bg-white text-blue-600 font-bold">
                    {getInitials(debate.participant_a.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{debate.participant_a.full_name}</span>
                    {debate.participant_a.is_verified_scholar && (
                      <Check className="w-4 h-4 fill-white" />
                    )}
                  </div>
                  <span className="text-sm opacity-90">@{debate.participant_a.username}</span>
                </div>
              </div>
            </div>

            {/* Arguments */}
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {debate.arguments_a.map((arg, index) => (
                <div key={arg.id} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="font-semibold">Round {arg.round}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(arg.created_at)}</span>
                  </div>
                  
                  <div className="text-foreground-secondary leading-relaxed whitespace-pre-wrap">
                    {arg.content}
                  </div>

                  {arg.sources.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Sources
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {arg.sources.map((source, idx) => (
                          <li key={idx} className="text-sm text-blue-700 dark:text-blue-300">
                            {idx + 1}. {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {/* Argument Composer (if user's turn) */}
              {isUserTurn && currentUserId === debate.participant_a.id && debate.status === "ongoing" && (
                <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Your Argument (Round {debate.current_round})
                  </label>
                  <textarea
                    value={userArgument}
                    onChange={(e) => setUserArgument(e.target.value)}
                    placeholder="Present your argument with clarity and respect..."
                    className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none min-h-[150px] mb-3"
                    maxLength={1000}
                  />
                  <div className="text-xs text-muted-foreground mb-3">
                    {1000 - userArgument.length} characters remaining
                  </div>

                  {debate.sources_required && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Citations *
                      </label>
                      {userSources.map((source, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={source}
                            onChange={(e) => updateSource(idx, e.target.value)}
                            placeholder="e.g., Ibn Taymiyyah, Majmu al-Fatawa, Vol 19, p. 234"
                            className="flex-1 p-2 bg-background border border-border rounded text-sm"
                          />
                          {userSources.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSource(idx)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSourceField}
                      >
                        Add Source
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitArgument}
                    disabled={!userArgument.trim() || (debate.sources_required && !userSources[0])}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Argument
                  </Button>
                </div>
              )}

              {/* Waiting indicator */}
              {debate.status === "ongoing" && currentUserId !== debate.participant_a.id && debate.arguments_a.length < debate.current_round && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2" />
                  <p>Waiting for {debate.participant_a.full_name}...</p>
                </div>
              )}
            </div>
          </div>

          {/* Participant B Side */}
          <div className="bg-card rounded-lg shadow-md border-2 border-green-200 dark:border-green-800">
            {/* Participant Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src={debate.participant_b.avatar_url || undefined} />
                  <AvatarFallback className="bg-white text-green-600 font-bold">
                    {getInitials(debate.participant_b.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{debate.participant_b.full_name}</span>
                    {debate.participant_b.is_verified_scholar && (
                      <Check className="w-4 h-4 fill-white" />
                    )}
                  </div>
                  <span className="text-sm opacity-90">@{debate.participant_b.username}</span>
                </div>
              </div>
            </div>

            {/* Arguments */}
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {debate.arguments_b.map((arg, index) => (
                <div key={arg.id} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="font-semibold">Round {arg.round}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(arg.created_at)}</span>
                  </div>
                  
                  <div className="text-foreground-secondary leading-relaxed whitespace-pre-wrap">
                    {arg.content}
                  </div>

                  {arg.sources.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                          Sources
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {arg.sources.map((source, idx) => (
                          <li key={idx} className="text-sm text-green-700 dark:text-green-300">
                            {idx + 1}. {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {/* Argument Composer (if user's turn) */}
              {isUserTurn && currentUserId === debate.participant_b.id && debate.status === "ongoing" && (
                <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Your Argument (Round {debate.current_round})
                  </label>
                  <textarea
                    value={userArgument}
                    onChange={(e) => setUserArgument(e.target.value)}
                    placeholder="Present your argument with clarity and respect..."
                    className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none min-h-[150px] mb-3"
                    maxLength={1000}
                  />
                  <div className="text-xs text-muted-foreground mb-3">
                    {1000 - userArgument.length} characters remaining
                  </div>

                  {debate.sources_required && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Citations *
                      </label>
                      {userSources.map((source, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={source}
                            onChange={(e) => updateSource(idx, e.target.value)}
                            placeholder="e.g., Al-Ghazali, Al-Mustasfa, Vol 1, p. 178"
                            className="flex-1 p-2 bg-background border border-border rounded text-sm"
                          />
                          {userSources.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSource(idx)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSourceField}
                      >
                        Add Source
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitArgument}
                    disabled={!userArgument.trim() || (debate.sources_required && !userSources[0])}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Submit Argument
                  </Button>
                </div>
              )}

              {/* Waiting indicator */}
              {debate.status === "ongoing" && currentUserId !== debate.participant_b.id && debate.arguments_b.length < debate.current_round && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2" />
                  <p>Waiting for {debate.participant_b.full_name}...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voting Section (if completed) */}
        {debate.status === "completed" && (
          <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-foreground">Debate Completed - Cast Your Vote</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vote for Participant A */}
              <button
                onClick={() => handleVote(debate.participant_a.id)}
                disabled={!!selectedVote}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedVote === debate.participant_a.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-border hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={debate.participant_a.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                      {getInitials(debate.participant_a.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      {debate.participant_a.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{debate.participant_a.username}
                    </div>
                  </div>
                </div>

                {debate.votes && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Votes</span>
                      <span className="font-bold text-blue-600">
                        {getVotePercentage(debate.participant_a.id)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getVotePercentage(debate.participant_a.id)}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedVote === debate.participant_a.id && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Your Vote</span>
                  </div>
                )}
              </button>

              {/* Vote for Participant B */}
              <button
                onClick={() => handleVote(debate.participant_b.id)}
                disabled={!!selectedVote}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedVote === debate.participant_b.id
                    ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                    : "border-border hover:border-green-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={debate.participant_b.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-700 text-white">
                      {getInitials(debate.participant_b.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      {debate.participant_b.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{debate.participant_b.username}
                    </div>
                  </div>
                </div>

                {debate.votes && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Votes</span>
                      <span className="font-bold text-green-600">
                        {getVotePercentage(debate.participant_b.id)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${getVotePercentage(debate.participant_b.id)}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedVote === debate.participant_b.id && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Your Vote</span>
                  </div>
                )}
              </button>
            </div>

            {/* Winner Announcement */}
            {debate.winner_id && (
              <div className="mt-6 p-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-center text-white">
                <Trophy className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Winner</h3>
                <p className="text-lg">
                  {debate.winner_id === debate.participant_a.id 
                    ? debate.participant_a.full_name 
                    : debate.participant_b.full_name}
                </p>
                <p className="text-sm opacity-90 mt-2">
                  Based on community votes and scholarly merit
                </p>
              </div>
            )}
          </div>
        )}

        {/* Spectator Info */}
        {!isParticipant && debate.status === "ongoing" && (
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Spectator Mode</h3>
            </div>
            <p className="text-foreground-secondary mb-4">
              You are watching this debate. Voting will be available once both participants complete all rounds.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📊 {debate.votes?.total || 0} people watching</span>
              <span>• Round {debate.current_round} of {debate.max_rounds}</span>
              <span>• {formatTime(timeRemaining)} remaining</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
