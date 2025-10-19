"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Share2,
  Bookmark,
  Download,
  Moon,
  Sun,
  Type,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Clock,
  Eye,
  EyeOff,
  Printer,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  BookOpen,
  Headphones,
  Video,
  FileText,
  Zap,
  Timer,
  BookmarkCheck,
  Lightbulb,
  Users,
  Star,
  Heart,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ContentViewerProps {
  content: {
    id: string;
    title: string;
    type: 'article' | 'video' | 'audio';
    content: string;
    description?: string;
    author: string;
    duration?: number;
    thumbnail?: string;
    videoUrl?: string;
    audioUrl?: string;
    transcript?: string;
    chapters?: Array<{
      title: string;
      startTime: number;
      endTime: number;
    }>;
    relatedContent?: Array<{
      id: string;
      title: string;
      type: string;
      thumbnail?: string;
    }>;
  };
  onClose?: () => void;
}

interface ReadingProgress {
  current: number;
  total: number;
  percentage: number;
}

interface Note {
  id: string;
  content: string;
  timestamp?: number;
  position?: number;
  createdAt: string;
}

export default function ContentViewer({ content, onClose }: ContentViewerProps) {
  // Article reading state
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    current: 0,
    total: 0,
    percentage: 0
  });
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptPosition, setTranscriptPosition] = useState(0);

  // Audio player state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  // Notes and annotations
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Calculate reading progress
  const calculateReadingProgress = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));

    setReadingProgress({
      current: Math.round(scrollTop),
      total: Math.round(scrollHeight),
      percentage: progress
    });
  }, []);

  // Calculate estimated read time
  useEffect(() => {
    if (content.type === 'article') {
      const wordsPerMinute = 200;
      const wordCount = content.content.split(' ').length;
      const readTime = Math.ceil(wordCount / wordsPerMinute);
      setEstimatedReadTime(readTime);
    }
  }, [content]);

  // Video player controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Update current chapter
      if (content.chapters) {
        const currentChapterIndex = content.chapters.findIndex(
          chapter => videoRef.current!.currentTime >= chapter.startTime && 
                   videoRef.current!.currentTime <= chapter.endTime
        );
        if (currentChapterIndex !== -1) {
          setCurrentChapter(currentChapterIndex);
        }
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Audio player controls
  const toggleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const addBookmark = () => {
    if (audioRef.current) {
      const newBookmark = audioRef.current.currentTime;
      setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a - b));
      toast.success("Bookmark added");
    }
  };

  const removeBookmark = (time: number) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark !== time));
    toast.success("Bookmark removed");
  };

  // Sleep timer
  useEffect(() => {
    if (sleepTimer > 0) {
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsAudioPlaying(false);
        }
        setSleepTimer(0);
        toast.success("Sleep timer activated");
      }, sleepTimer * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [sleepTimer]);

  // Notes functionality
  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        timestamp: content.type === 'video' ? currentTime : undefined,
        position: content.type === 'article' ? readingProgress.current : undefined,
        createdAt: new Date().toISOString()
      };
      setNotes(prev => [...prev, note]);
      setNewNote('');
      toast.success("Note added");
    }
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    toast.success("Note deleted");
  };

  // Share functionality
  const handleShare = () => {
    const url = `${window.location.origin}/content/${content.id}`;
    setShareUrl(url);
    setShowShareDialog(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Article viewer
  const renderArticleViewer = () => (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
          <p className="text-muted-foreground mb-4">by {content.author}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {estimatedReadTime} min read
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {Math.round(content.content.split(' ').length)} words
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={readingProgress.percentage} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{Math.round(readingProgress.percentage)}% complete</span>
          <span>{Math.round(readingProgress.current / 1000)}k / {Math.round(readingProgress.total / 1000)}k</span>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 border rounded-lg bg-muted/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Font Size</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={12}
                  max={24}
                  step={1}
                  className="mt-2"
                />
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <div>
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="sepia">Sepia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showNotes}
                  onCheckedChange={setShowNotes}
                />
                <Label>Show Notes</Label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        ref={contentRef}
        className={`prose prose-lg max-w-none ${
          theme === 'dark' ? 'prose-invert' : 
          theme === 'sepia' ? 'prose-amber' : ''
        }`}
        style={{ fontSize: `${fontSize}px` }}
        onScroll={calculateReadingProgress}
        onMouseUp={() => {
          const selection = window.getSelection();
          if (selection && selection.toString()) {
            setSelectedText(selection.toString());
          }
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: content.content }} />
      </div>

      {/* Notes panel */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 p-4 border rounded-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <div className="space-y-4">
              {notes.map(note => (
                <div key={note.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="text-sm">{note.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addNote} disabled={!newNote.trim()}>
                  Add Note
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Video player
  const renderVideoPlayer = () => (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={content.thumbnail}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={content.videoUrl} type="video/mp4" />
      </video>

      {/* Video controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="h-1 bg-white/30 rounded-full">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-white text-sm mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white" />
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => handleVolumeChange(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-20"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white text-sm">Speed:</span>
                <Select value={playbackRate.toString()} onValueChange={(value) => handlePlaybackRateChange(Number(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-white hover:bg-white/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                Transcript
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      {content.chapters && content.chapters.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-3 max-w-xs">
          <h4 className="text-white font-semibold mb-2">Chapters</h4>
          <div className="space-y-1">
            {content.chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => handleSeek(chapter.startTime)}
                className={`block w-full text-left text-sm p-2 rounded ${
                  index === currentChapter
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript overlay */}
      <AnimatePresence>
        {showTranscript && content.transcript && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 h-full w-80 bg-white p-4 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Transcript</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="prose prose-sm">
              {content.transcript}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Audio player
  const renderAudioPlayer = () => (
    <div className="space-y-4">
      {/* Main audio player */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleAudioPlayPause}
              className="rounded-full w-12 h-12"
            >
              {isAudioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            
            <div className="flex-1">
              <h3 className="font-semibold">{content.title}</h3>
              <p className="text-sm text-muted-foreground">by {content.author}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={addBookmark}>
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowMiniPlayer(!showMiniPlayer)}>
                <Minimize className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="relative">
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={audioDuration}
                value={audioCurrentTime}
                onChange={(e) => handleAudioSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{formatTime(audioCurrentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <Slider
                  value={[audioVolume]}
                  onValueChange={([value]) => setAudioVolume(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Speed:</span>
                <Select value={audioPlaybackRate.toString()} onValueChange={(value) => setAudioPlaybackRate(Number(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <Select value={sleepTimer.toString()} onValueChange={(value) => setSleepTimer(Number(value))}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue placeholder="Sleep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off</SelectItem>
                    <SelectItem value="5">5 min</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookmarks.map((bookmark, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{formatTime(bookmark)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAudioSeek(bookmark)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBookmark(bookmark)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini player */}
      <AnimatePresence>
        {showMiniPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-3 w-80"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAudioPlayPause}
              >
                {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{content.title}</p>
                <p className="text-xs text-muted-foreground">{formatTime(audioCurrentTime)} / {formatTime(audioDuration)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMiniPlayer(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            {content.type === 'article' && <FileText className="w-5 h-5" />}
            {content.type === 'video' && <Video className="w-5 h-5" />}
            {content.type === 'audio' && <Headphones className="w-5 h-5" />}
            <h2 className="text-lg font-semibold">{content.title}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto">
        {content.type === 'article' && renderArticleViewer()}
        {content.type === 'video' && (
          <div className="p-6">
            {renderVideoPlayer()}
          </div>
        )}
        {content.type === 'audio' && (
          <div className="p-6">
            {renderAudioPlayer()}
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={content.audioUrl}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => setIsAudioPlaying(true)}
        onPause={() => setIsAudioPlaying(false)}
        onEnded={() => setIsAudioPlaying(false)}
      />

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Share URL</Label>
              <div className="flex gap-2 mt-2">
                <Input value={shareUrl} readOnly />
                <Button onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            {selectedText && (
              <div>
                <Label>Selected Text</Label>
                <Textarea
                  value={selectedText}
                  readOnly
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
