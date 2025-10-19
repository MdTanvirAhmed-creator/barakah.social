"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  PenTool,
  StickyNote,
  Tag,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Share,
  Download,
  Upload,
  Star,
  Heart,
  Bookmark,
  Eye,
  Clock,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Video,
  Headphones,
  FileText,
  Image,
  Zap,
  Brain,
  Lightbulb,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Trophy,
  Medal,
  Certificate,
  Flag,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Save,
  RefreshCw,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  Bookmark as BookmarkIcon,
  Eye as EyeIcon,
  Clock as ClockIcon,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  MessageSquare as MessageSquareIcon,
  Video as VideoIcon,
  Headphones as HeadphonesIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  Zap as ZapIcon,
  Brain as BrainIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  RotateCcw as RotateCcwIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipForward as SkipForwardIcon,
  SkipBack as SkipBackIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Settings as SettingsIcon,
  MoreHorizontal as MoreHorizontalIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  Calendar as CalendarIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Certificate as CertificateIcon,
  Flag as FlagIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon,
  Save as SaveIcon,
  RefreshCw as RefreshCwIcon,
} from "lucide-react";

interface StudyNote {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'article' | 'video' | 'audio' | 'pdf';
  title: string;
  content: string;
  tags: string[];
  is_highlight: boolean;
  highlight_text?: string;
  position?: number; // For video/audio timestamps
  created_at: string;
  updated_at: string;
}

interface Flashcard {
  id: string;
  user_id: string;
  deck_id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  last_reviewed: string;
  next_review: string;
  review_count: number;
  correct_count: number;
  created_at: string;
}

interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  cards_count: number;
  created_at: string;
  cards: Flashcard[];
}

interface Quiz {
  id: string;
  user_id: string;
  content_id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  time_limit?: number; // in minutes
  passing_score: number;
  is_public: boolean;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
}

interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number; // in minutes
  answers: Record<string, string>;
  completed_at: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  content_id: string;
  creator_id: string;
  max_members: number;
  current_members: number;
  is_public: boolean;
  created_at: string;
  members: StudyGroupMember[];
}

interface StudyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface StudySession {
  id: string;
  group_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  participants: string[];
  notes: string;
  created_at: string;
}

export default function StudyTools() {
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showDeckDialog, setShowDeckDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadStudyData();
  }, []);

  const loadStudyData = async () => {
    try {
      await Promise.all([
        loadNotes(),
        loadFlashcardDecks(),
        loadQuizzes(),
        loadStudyGroups()
      ]);
    } catch (error) {
      console.error('Error loading study data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadFlashcardDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('flashcard_decks')
        .select(`
          *,
          cards:flashcards(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashcardDecks(data || []);
    } catch (error) {
      console.error('Error loading flashcard decks:', error);
    }
  };

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  const loadStudyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          members:study_group_members(
            *,
            user:profiles(username, full_name, avatar_url)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyGroups(data || []);
    } catch (error) {
      console.error('Error loading study groups:', error);
    }
  };

  const createNote = async (noteData: Partial<StudyNote>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('study_notes')
        .insert({
          user_id: user.id,
          content_id: noteData.content_id,
          content_type: noteData.content_type,
          title: noteData.title,
          content: noteData.content,
          tags: noteData.tags || [],
          is_highlight: noteData.is_highlight || false,
          highlight_text: noteData.highlight_text,
          position: noteData.position
        });

      if (error) throw error;
      
      await loadNotes();
      setShowNoteDialog(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const createFlashcardDeck = async (deckData: Partial<FlashcardDeck>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: user.id,
          title: deckData.title,
          description: deckData.description,
          is_public: deckData.is_public || false
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadFlashcardDecks();
      setShowDeckDialog(false);
    } catch (error) {
      console.error('Error creating flashcard deck:', error);
    }
  };

  const createQuiz = async (quizData: Partial<Quiz>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          content_id: quizData.content_id,
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions || [],
          time_limit: quizData.time_limit,
          passing_score: quizData.passing_score || 70,
          is_public: quizData.is_public || false
        });

      if (error) throw error;
      
      await loadQuizzes();
      setShowQuizDialog(false);
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  const createStudyGroup = async (groupData: Partial<StudyGroup>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('study_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          content_id: groupData.content_id,
          creator_id: user.id,
          max_members: groupData.max_members || 10,
          is_public: groupData.is_public || true
        });

      if (error) throw error;
      
      await loadStudyGroups();
      setShowGroupDialog(false);
    } catch (error) {
      console.error('Error creating study group:', error);
    }
  };

  const joinStudyGroup = async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      
      await loadStudyGroups();
    } catch (error) {
      console.error('Error joining study group:', error);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileTextIcon className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <VideoIcon className="w-4 h-4 text-red-500" />;
      case 'audio':
        return <HeadphonesIcon className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <FileTextIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <FileTextIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Tools</h1>
          <p className="text-muted-foreground mt-2">
            Enhance your learning with interactive study features
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">{notes.length}</p>
              </div>
              <StickyNote className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flashcard Decks</p>
                <p className="text-2xl font-bold">{flashcardDecks.length}</p>
              </div>
              <BrainIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quizzes</p>
                <p className="text-2xl font-bold">{quizzes.length}</p>
              </div>
              <TargetIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Groups</p>
                <p className="text-2xl font-bold">{studyGroups.length}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes
                .filter(note => 
                  (selectedTag === 'all' || note.tags.includes(selectedTag)) &&
                  (searchQuery === '' || 
                   note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   note.content.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((note) => (
                  <Card key={note.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(note.content_type)}
                          <h3 className="font-semibold">{note.title}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedNote(note)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {note.content}
                      </p>
                      
                      {note.is_highlight && note.highlight_text && (
                        <div className="bg-yellow-100 p-3 rounded-lg mb-4">
                          <p className="text-sm font-medium text-yellow-800">
                            Highlighted: "{note.highlight_text}"
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {note.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(note.created_at)}</span>
                        <div className="flex items-center gap-1">
                          <BookmarkIcon className="w-3 h-3" />
                          <span>Saved</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Add Note Button */}
            <div className="text-center">
              <Button onClick={() => setShowNoteDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Note
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards">
          <div className="space-y-6">
            {/* Flashcard Decks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashcardDecks.map((deck) => (
                <Card key={deck.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{deck.title}</h3>
                        <p className="text-sm text-muted-foreground">{deck.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDeck(deck)}
                        >
                          <PlayIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Cards</span>
                        <span>{deck.cards_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Public</span>
                        <span>{deck.is_public ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <PlayIcon className="w-4 h-4 mr-1" />
                        Study
                      </Button>
                      <Button size="sm" variant="outline">
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Deck Button */}
            <div className="text-center">
              <Button onClick={() => setShowDeckDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Deck
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          <div className="space-y-6">
            {/* Quizzes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground">{quiz.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedQuiz(quiz)}
                        >
                          <PlayIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <ShareIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Questions</span>
                        <span>{quiz.questions.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Time Limit</span>
                        <span>{quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Passing Score</span>
                        <span>{quiz.passing_score}%</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <PlayIcon className="w-4 h-4 mr-1" />
                        Take Quiz
                      </Button>
                      <Button size="sm" variant="outline">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Quiz Button */}
            <div className="text-center">
              <Button onClick={() => setShowQuizDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Quiz
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Study Groups Tab */}
        <TabsContent value="groups">
          <div className="space-y-6">
            {/* Study Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MessageSquareIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Members</span>
                        <span>{group.current_members}/{group.max_members}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Public</span>
                        <span>{group.is_public ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Created</span>
                        <span>{formatDate(group.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => joinStudyGroup(group.id)}
                      >
                        <UsersIcon className="w-4 h-4 mr-1" />
                        Join Group
                      </Button>
                      <Button size="sm" variant="outline">
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Group Button */}
            <div className="text-center">
              <Button onClick={() => setShowGroupDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Note Dialog */}
      {showNoteDialog && (
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <NoteForm onSubmit={createNote} onClose={() => setShowNoteDialog(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Flashcard Deck Dialog */}
      {showDeckDialog && (
        <Dialog open={showDeckDialog} onOpenChange={setShowDeckDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Flashcard Deck</DialogTitle>
            </DialogHeader>
            <FlashcardDeckForm onSubmit={createFlashcardDeck} onClose={() => setShowDeckDialog(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Quiz Dialog */}
      {showQuizDialog && (
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <QuizForm onSubmit={createQuiz} onClose={() => setShowQuizDialog(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Study Group Dialog */}
      {showGroupDialog && (
        <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Study Group</DialogTitle>
            </DialogHeader>
            <StudyGroupForm onSubmit={createStudyGroup} onClose={() => setShowGroupDialog(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Note Form Component
function NoteForm({ onSubmit, onClose }: { onSubmit: (data: Partial<StudyNote>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    is_highlight: false,
    highlight_text: '',
    content_type: 'article' as 'article' | 'video' | 'audio' | 'pdf',
    content_id: '',
    position: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Note Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="content_type">Content Type</Label>
          <Select
            value={formData.content_type}
            onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="content">Note Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_highlight"
          checked={formData.is_highlight}
          onChange={(e) => setFormData({ ...formData, is_highlight: e.target.checked })}
        />
        <Label htmlFor="is_highlight">This is a highlight</Label>
      </div>

      {formData.is_highlight && (
        <div>
          <Label htmlFor="highlight_text">Highlighted Text</Label>
          <Input
            id="highlight_text"
            value={formData.highlight_text}
            onChange={(e) => setFormData({ ...formData, highlight_text: e.target.value })}
          />
        </div>
      )}

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-500"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Add a tag and press Enter"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Note</Button>
      </div>
    </form>
  );
}

// Flashcard Deck Form Component
function FlashcardDeckForm({ onSubmit, onClose }: { onSubmit: (data: Partial<FlashcardDeck>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Deck Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
        />
        <Label htmlFor="is_public">Make this deck public</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Deck</Button>
      </div>
    </form>
  );
}

// Quiz Form Component
function QuizForm({ onSubmit, onClose }: { onSubmit: (data: Partial<Quiz>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_limit: 0,
    passing_score: 70,
    is_public: false,
    questions: [] as QuizQuestion[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Quiz Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="time_limit">Time Limit (minutes)</Label>
          <Input
            id="time_limit"
            type="number"
            value={formData.time_limit}
            onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="passing_score">Passing Score (%)</Label>
          <Input
            id="passing_score"
            type="number"
            value={formData.passing_score}
            onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 70 })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          />
          <Label htmlFor="is_public">Make this quiz public</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Quiz</Button>
      </div>
    </form>
  );
}

// Study Group Form Component
function StudyGroupForm({ onSubmit, onClose }: { onSubmit: (data: Partial<StudyGroup>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_members: 10,
    is_public: true,
    content_id: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max_members">Maximum Members</Label>
          <Input
            id="max_members"
            type="number"
            value={formData.max_members}
            onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          />
          <Label htmlFor="is_public">Make this group public</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Group</Button>
      </div>
    </form>
  );
}
