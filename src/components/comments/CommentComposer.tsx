"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, X, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface CommentComposerProps {
  postId: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showCancel?: boolean;
  maxLength?: number;
}

// Mock user data for @mentions
const MOCK_USERS = [
  { id: "1", username: "ahmad_scholar", full_name: "Sheikh Ahmad Al-Maliki" },
  { id: "2", username: "fatima_h", full_name: "Fatima Hassan" },
  { id: "3", username: "omar_k", full_name: "Omar Khan" },
  { id: "4", username: "aisha_m", full_name: "Aisha Mohammed" },
  { id: "5", username: "yusuf_a", full_name: "Yusuf Ahmad" },
  { id: "6", username: "ibrahim_s", full_name: "Ibrahim Siddiqui" },
];

export function CommentComposer({
  postId,
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
  showCancel = false,
  maxLength = 500,
}: CommentComposerProps) {
  const { error: showError } = useToast();
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Check for @mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(" ") && textAfterAt.length <= 20) {
        setMentionSearch(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle @mention navigation
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(filteredUsers[selectedMentionIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    }

    // Submit with Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit();
    }

    // Cancel with Escape
    if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  const insertMention = (user: typeof MOCK_USERS[0]) => {
    const beforeMention = content.substring(0, mentionStartPos);
    const afterMention = content.substring(mentionStartPos + mentionSearch.length + 1);
    const newContent = `${beforeMention}@${user.username} ${afterMention}`;
    
    setContent(newContent);
    setShowMentions(false);

    // Move cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = mentionStartPos + user.username.length + 2;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSubmit = () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      showError("Please write a comment");
      return;
    }

    if (trimmedContent.length > maxLength) {
      showError(`Comment must be ${maxLength} characters or less`);
      return;
    }

    onSubmit(trimmedContent);
    setContent("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleCancel = () => {
    setContent("");
    if (onCancel) {
      onCancel();
    }
  };

  // Filter users based on mention search
  const filteredUsers = MOCK_USERS.filter(user =>
    user.username.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    user.full_name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars < 50;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="relative">
      <div className="bg-muted rounded-lg p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground min-h-[60px] max-h-[200px]"
          rows={2}
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AtSign className="w-3 h-3" />
            <span>Use @ to mention users</span>
          </div>
          
          <div className={`text-xs ${
            isOverLimit ? "text-error" :
            isNearLimit ? "text-warning" :
            "text-muted-foreground"
          }`}>
            {remainingChars} characters left
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isOverLimit}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {showCancel ? "Reply" : "Comment"}
          </Button>

          {showCancel && (
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            Press Enter to submit, Shift+Enter for new line
          </span>
        </div>
      </div>

      {/* @Mention Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <motion.div
          ref={mentionsRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10"
        >
          <div className="p-2 bg-muted border-b border-border">
            <span className="text-xs font-medium text-foreground">Select a user to mention</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  index === selectedMentionIndex
                    ? "bg-primary-50 dark:bg-primary-900/20"
                    : "hover:bg-muted"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold">
                  {user.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {content && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to submit, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
        </div>
      )}
    </div>
  );
}
