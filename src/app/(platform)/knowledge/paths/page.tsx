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
  Play,
  Pause,
  CheckCircle,
  Clock,
  Users,
  Star,
  Award,
  Bookmark,
  Edit,
  Plus,
  Trash2,
  GripVertical,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Video,
  Headphones,
  Image,
  Download,
  Share,
  Heart,
  MessageSquare,
  ThumbsUp,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Globe,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  GraduationCap,
  Trophy,
  Medal,
  Certificate,
  Flag,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkCheck,
  BookmarkX,
  BookmarkIcon,
  BookmarkPlusIcon,
  BookmarkMinusIcon,
  BookmarkCheckIcon,
  BookmarkXIcon,
  BookmarkIcon as BookmarkIconComponent,
  BookmarkPlusIcon as BookmarkPlusIconComponent,
  BookmarkMinusIcon as BookmarkMinusIconComponent,
  BookmarkCheckIcon as BookmarkCheckIconComponent,
  BookmarkXIcon as BookmarkXIconComponent,
} from "lucide-react";

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'scholar';
  duration: number; // in hours
  lessons_count: number;
  image_url?: string;
  author_id: string;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  lessons: LearningPathLesson[];
  progress?: LearningPathProgress;
}

interface LearningPathLesson {
  id: string;
  path_id: string;
  title: string;
  description: string;
  content_type: 'video' | 'article' | 'audio' | 'quiz' | 'assignment';
  content_url?: string;
  duration: number; // in minutes
  order_index: number;
  is_required: boolean;
  prerequisites: string[];
  created_at: string;
  progress?: LessonProgress;
}

interface LearningPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  current_lesson_id: string;
  completed_lessons: string[];
  progress_percentage: number;
  time_spent: number; // in minutes
  started_at: string;
  last_accessed: string;
  completed_at?: string;
  notes: string;
  bookmarks: string[];
}

interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  time_spent: number;
  completed_at?: string;
  notes: string;
  bookmarked: boolean;
}

interface Assessment {
  id: string;
  path_id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passing_score: number;
  time_limit: number; // in minutes
  attempts_allowed: number;
  created_at: string;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

interface Certificate {
  id: string;
  user_id: string;
  path_id: string;
  issued_at: string;
  certificate_url: string;
  verification_code: string;
}

export default function LearningPathsPage() {
  const [activeTab, setActiveTab] = useState('browse');
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<LearningPathProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showPathCreator, setShowPathCreator] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadLearningPaths();
    loadUserProgress();
  }, []);

  const loadLearningPaths = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          author:profiles!learning_paths_author_id_fkey(
            username, full_name, avatar_url
          ),
          lessons:learning_path_lessons(*),
          progress:learning_path_progress(*)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaths(data || []);
    } catch (error) {
      console.error('Error loading learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('learning_path_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const startPath = async (pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('learning_path_progress')
        .insert({
          user_id: user.id,
          path_id: pathId,
          current_lesson_id: '', // Will be set to first lesson
          completed_lessons: [],
          progress_percentage: 0,
          time_spent: 0,
          started_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
          notes: '',
          bookmarks: []
        });

      if (error) throw error;
      
      await loadUserProgress();
    } catch (error) {
      console.error('Error starting path:', error);
    }
  };

  const completeLesson = async (lessonId: string, pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update lesson progress
      const { error: lessonError } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (lessonError) throw lessonError;

      // Update path progress
      const progress = userProgress.find(p => p.path_id === pathId);
      if (progress) {
        const updatedCompleted = [...progress.completed_lessons, lessonId];
        const path = paths.find(p => p.id === pathId);
        const progressPercentage = path ? (updatedCompleted.length / path.lessons_count) * 100 : 0;

        const { error: pathError } = await supabase
          .from('learning_path_progress')
          .update({
            completed_lessons: updatedCompleted,
            progress_percentage: progressPercentage,
            last_accessed: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('path_id', pathId);

        if (pathError) throw pathError;
      }

      await loadUserProgress();
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const bookmarkLesson = async (lessonId: string, pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const progress = userProgress.find(p => p.path_id === pathId);
      if (progress) {
        const isBookmarked = progress.bookmarks.includes(lessonId);
        const updatedBookmarks = isBookmarked
          ? progress.bookmarks.filter(id => id !== lessonId)
          : [...progress.bookmarks, lessonId];

        const { error } = await supabase
          .from('learning_path_progress')
          .update({ bookmarks: updatedBookmarks })
          .eq('user_id', user.id)
          .eq('path_id', pathId);

        if (error) throw error;
      }

      await loadUserProgress();
    } catch (error) {
      console.error('Error bookmarking lesson:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'scholar':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'article':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'audio':
        return <Headphones className="w-4 h-4 text-green-500" />;
      case 'quiz':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'assignment':
        return <Edit className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
          <h1 className="text-3xl font-bold text-foreground">Learning Paths</h1>
          <p className="text-muted-foreground mt-2">
            Structured learning journeys for Islamic knowledge
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Dialog open={showPathCreator} onOpenChange={setShowPathCreator}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Path
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Learning Path</DialogTitle>
              </DialogHeader>
              <PathCreatorForm onClose={() => setShowPathCreator(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paths</p>
                <p className="text-2xl font-bold">{paths.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {userProgress.filter(p => !p.completed_at).length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {userProgress.filter(p => p.completed_at).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold">
                  {userProgress.filter(p => p.completed_at).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Paths</TabsTrigger>
          <TabsTrigger value="my-paths">My Paths</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        {/* Browse Paths Tab */}
        <TabsContent value="browse">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Search learning paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="quran">Quran Studies</SelectItem>
                  <SelectItem value="hadith">Hadith Studies</SelectItem>
                  <SelectItem value="fiqh">Fiqh</SelectItem>
                  <SelectItem value="aqeedah">Aqeedah</SelectItem>
                  <SelectItem value="spirituality">Spirituality</SelectItem>
                  <SelectItem value="practical">Practical Life</SelectItem>
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="scholar">Scholar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Paths */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Featured Learning Paths</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths
                  .filter(path => path.is_featured)
                  .slice(0, 6)
                  .map((path) => (
                    <LearningPathCard
                      key={path.id}
                      path={path}
                      userProgress={userProgress}
                      onStart={startPath}
                      onView={() => setSelectedPath(path)}
                    />
                  ))}
              </div>
            </div>

            {/* All Paths */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Learning Paths</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths
                  .filter(path => 
                    (categoryFilter === 'all' || path.category === categoryFilter) &&
                    (difficultyFilter === 'all' || path.difficulty === difficultyFilter) &&
                    (searchQuery === '' || 
                     path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     path.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((path) => (
                    <LearningPathCard
                      key={path.id}
                      path={path}
                      userProgress={userProgress}
                      onStart={startPath}
                      onView={() => setSelectedPath(path)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* My Paths Tab */}
        <TabsContent value="my-paths">
          <div className="space-y-4">
            {userProgress.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Learning Paths Started</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your learning journey by exploring our learning paths.
                  </p>
                  <Button onClick={() => setActiveTab('browse')}>
                    Browse Learning Paths
                  </Button>
                </CardContent>
              </Card>
            ) : (
              userProgress.map((progress) => {
                const path = paths.find(p => p.id === progress.path_id);
                if (!path) return null;

                return (
                  <Card key={progress.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{path.title}</h3>
                            <Badge className={getDifficultyColor(path.difficulty)}>
                              {path.difficulty}
                            </Badge>
                            {progress.completed_at && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{path.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{Math.round(progress.progress_percentage)}%</span>
                            </div>
                            <Progress value={progress.progress_percentage} className="h-2" />
                          </div>
                          
                          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(progress.time_spent)}
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {progress.completed_lessons.length}/{path.lessons_count} lessons
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="w-4 h-4" />
                              {progress.bookmarks.length} bookmarks
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => setSelectedPath(path)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Continue
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProgress.map((progress) => {
                  const path = paths.find(p => p.id === progress.path_id);
                  if (!path) return null;

                  return (
                    <div key={progress.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{path.title}</h3>
                        <Badge className={getDifficultyColor(path.difficulty)}>
                          {path.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progress.progress_percentage)}%</span>
                        </div>
                        <Progress value={progress.progress_percentage} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Lessons Completed</div>
                          <div className="font-semibold">
                            {progress.completed_lessons.length}/{path.lessons_count}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Time Spent</div>
                          <div className="font-semibold">{formatDuration(progress.time_spent)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Bookmarks</div>
                          <div className="font-semibold">{progress.bookmarks.length}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete learning paths to earn certificates.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Learning Paths
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Path Detail Dialog */}
      {selectedPath && (
        <Dialog open={!!selectedPath} onOpenChange={() => setSelectedPath(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedPath.title}</DialogTitle>
            </DialogHeader>
            <PathDetailDialog
              path={selectedPath}
              userProgress={userProgress.find(p => p.path_id === selectedPath.id)}
              onStart={startPath}
              onCompleteLesson={completeLesson}
              onBookmark={bookmarkLesson}
              onClose={() => setSelectedPath(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Learning Path Card Component
function LearningPathCard({ 
  path, 
  userProgress, 
  onStart, 
  onView 
}: { 
  path: LearningPath; 
  userProgress: LearningPathProgress[];
  onStart: (pathId: string) => void;
  onView: () => void;
}) {
  const progress = userProgress.find(p => p.path_id === path.id);
  const isStarted = !!progress;
  const isCompleted = progress?.completed_at;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{path.title}</h3>
              <Badge className={getDifficultyColor(path.difficulty)}>
                {path.difficulty}
              </Badge>
              {path.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {path.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {path.lessons_count} lessons
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(path.duration * 60)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {path.author.full_name}
              </div>
            </div>
          </div>
        </div>
        
        {isStarted && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress.progress_percentage)}%</span>
            </div>
            <Progress value={progress.progress_percentage} className="h-2" />
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            {isStarted ? 'Continue' : 'View Details'}
          </Button>
          {!isStarted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStart(path.id)}
            >
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Path Detail Dialog Component
function PathDetailDialog({ 
  path, 
  userProgress, 
  onStart, 
  onCompleteLesson, 
  onBookmark, 
  onClose 
}: { 
  path: LearningPath; 
  userProgress?: LearningPathProgress;
  onStart: (pathId: string) => void;
  onCompleteLesson: (lessonId: string, pathId: string) => void;
  onBookmark: (lessonId: string, pathId: string) => void;
  onClose: () => void;
}) {
  const isStarted = !!userProgress;
  const isCompleted = userProgress?.completed_at;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Path Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="capitalize">{path.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty:</span>
              <Badge className={getDifficultyColor(path.difficulty)}>
                {path.difficulty}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lessons:</span>
              <span>{path.lessons_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{formatDuration(path.duration * 60)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Author:</span>
              <span>{path.author.full_name}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Description</h3>
          <p className="text-sm text-muted-foreground">{path.description}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Lessons</h3>
        <div className="space-y-2">
          {path.lessons.map((lesson, index) => {
            const isCompleted = userProgress?.completed_lessons.includes(lesson.id);
            const isBookmarked = userProgress?.bookmarks.includes(lesson.id);

            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getContentTypeIcon(lesson.content_type)}
                  <span className="text-sm font-medium">
                    {index + 1}. {lesson.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(lesson.duration)}
                  </span>
                  
                  {isStarted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onBookmark(lesson.id, path.id)}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  )}
                  
                  {isStarted && !isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => onCompleteLesson(lesson.id, path.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {!isStarted && (
          <Button onClick={() => onStart(path.id)}>
            <Play className="w-4 h-4 mr-2" />
            Start Learning Path
          </Button>
        )}
      </div>
    </div>
  );
}

// Path Creator Form Component
function PathCreatorForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'scholar',
    is_public: true,
    lessons: [] as any[]
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('learning_paths')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          difficulty: formData.difficulty,
          duration: 0, // Will be calculated from lessons
          lessons_count: formData.lessons.length,
          author_id: user.id,
          is_public: formData.is_public,
          is_featured: false
        });

      if (error) throw error;
      
      onClose();
    } catch (error) {
      console.error('Error creating path:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Path Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quran">Quran Studies</SelectItem>
              <SelectItem value="hadith">Hadith Studies</SelectItem>
              <SelectItem value="fiqh">Fiqh</SelectItem>
              <SelectItem value="aqeedah">Aqeedah</SelectItem>
              <SelectItem value="spirituality">Spirituality</SelectItem>
              <SelectItem value="practical">Practical Life</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="scholar">Scholar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          />
          <Label htmlFor="is_public">Make this path public</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Path</Button>
      </div>
    </form>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-orange-100 text-orange-800';
    case 'scholar':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getContentTypeIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="w-4 h-4 text-red-500" />;
    case 'article':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'audio':
      return <Headphones className="w-4 h-4 text-green-500" />;
    case 'quiz':
      return <Target className="w-4 h-4 text-purple-500" />;
    case 'assignment':
      return <Edit className="w-4 h-4 text-orange-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
