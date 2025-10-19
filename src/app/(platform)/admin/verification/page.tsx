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
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  FileText,
  Video,
  Headphones,
  BookOpen,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Trophy,
  Medal,
  Flag,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Save,
  Share,
  Bookmark,
  Heart,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  Lightbulb,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  MessageSquare as MessageSquareIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Zap as ZapIcon,
  Brain as BrainIcon,
  Lightbulb as LightbulbIcon,
  Target as TargetIconComponent,
  TrendingUp as TrendingUpIconComponent,
  Users as UsersIconComponent,
  MessageSquare as MessageSquareIconComponent,
  ThumbsUp as ThumbsUpIconComponent,
  ThumbsDown as ThumbsDownIconComponent,
  Zap as ZapIconComponent,
  Brain as BrainIconComponent,
  Lightbulb as LightbulbIconComponent,
} from "lucide-react";

interface VerificationStats {
  total_submissions: number;
  pending_review: number;
  approved: number;
  rejected: number;
  needs_revision: number;
  average_processing_time: number;
  community_reviewers: number;
  scholarly_reviewers: number;
}

interface ContentVerification {
  id: string;
  content_id: string;
  content_type: 'article' | 'video' | 'audio' | 'pdf' | 'quiz';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';
  current_level: number;
  overall_score: number;
  submitted_at: string;
  completed_at?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content: {
    title: string;
    description: string;
    category: string;
    author: {
      username: string;
      full_name: string;
      avatar_url?: string;
    };
  };
  results: VerificationResult[];
  assigned_reviewers: string[];
}

interface VerificationResult {
  id: string;
  check_id: string;
  passed: boolean;
  score: number;
  feedback?: string;
  reviewer_id?: string;
  reviewed_at: string;
  evidence?: string[];
}

interface Reviewer {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  beneficial_count: number;
  role: string;
  is_verified: boolean;
  expertise_areas: string[];
  reviews_completed: number;
  average_rating: number;
}

export default function VerificationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [verifications, setVerifications] = useState<ContentVerification[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<ContentVerification | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    try {
      await Promise.all([
        loadVerifications(),
        loadReviewers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('content_verifications')
        .select(`
          *,
          content:content_submissions(
            title, description, category,
            author:profiles(username, full_name, avatar_url)
          ),
          results:verification_results(*)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const loadReviewers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, username, full_name, avatar_url, beneficial_count, role, is_verified, expertise_areas,
          reviews_completed, average_rating
        `)
        .gte('beneficial_count', 50)
        .order('beneficial_count', { ascending: false });

      if (error) throw error;
      setReviewers(data || []);
    } catch (error) {
      console.error('Error loading reviewers:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: verificationStats } = await supabase
        .from('content_verifications')
        .select('status, submitted_at, completed_at');

      const { data: reviewerStats } = await supabase
        .from('profiles')
        .select('beneficial_count, role, is_verified')
        .gte('beneficial_count', 100);

      if (verificationStats) {
        const stats: VerificationStats = {
          total_submissions: verificationStats.length,
          pending_review: verificationStats.filter(v => v.status === 'pending' || v.status === 'in_review').length,
          approved: verificationStats.filter(v => v.status === 'approved').length,
          rejected: verificationStats.filter(v => v.status === 'rejected').length,
          needs_revision: verificationStats.filter(v => v.status === 'needs_revision').length,
          average_processing_time: 0, // Calculate based on completed verifications
          community_reviewers: reviewerStats?.filter(r => r.beneficial_count >= 100 && r.role !== 'scholar').length || 0,
          scholarly_reviewers: reviewerStats?.filter(r => r.role === 'scholar' && r.is_verified).length || 0
        };

        setStats(stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_revision':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'audio':
        return <Headphones className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'quiz':
        return <Target className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = searchQuery === '' || 
      verification.content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.content.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || verification.current_level.toString() === levelFilter;
    const matchesPriority = priorityFilter === 'all' || verification.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesLevel && matchesPriority;
  });

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
          <h1 className="text-3xl font-bold text-foreground">Content Verification</h1>
          <p className="text-muted-foreground mt-2">
            Multi-layer verification system for content quality and Islamic authenticity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowStatsDialog(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.total_submissions}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pending_review}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewers</p>
                  <p className="text-2xl font-bold">{stats.community_reviewers + stats.scholarly_reviewers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Search verifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="needs_revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1 (Automated)</SelectItem>
                  <SelectItem value="2">Level 2 (Community)</SelectItem>
                  <SelectItem value="3">Level 3 (Scholarly)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verifications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Content Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVerifications.map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{verification.content.title}</div>
                            <div className="text-sm text-muted-foreground">
                              by {verification.content.author.full_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getContentTypeIcon(verification.content_type)}
                            <span className="capitalize">{verification.content_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(verification.status)}>
                            {verification.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Level {verification.current_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(verification.priority)}>
                            {verification.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={verification.overall_score} className="w-16" />
                            <span className="text-sm">{verification.overall_score}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(verification.submitted_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedVerification(verification)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowReviewDialog(true)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredVerifications
                    .filter(v => v.status === 'pending' || v.status === 'in_review')
                    .map((verification) => (
                      <Card key={verification.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getContentTypeIcon(verification.content_type)}
                              <h3 className="font-semibold">{verification.content.title}</h3>
                              <Badge className={getStatusColor(verification.status)}>
                                {verification.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(verification.priority)}>
                                {verification.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {verification.content.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span>Level {verification.current_level}</span>
                              <span>Score: {verification.overall_score}%</span>
                              <span>Submitted: {formatDate(verification.submitted_at)}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setSelectedVerification(verification)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviewers Tab */}
        <TabsContent value="reviewers">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviewers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Beneficial Count</TableHead>
                      <TableHead>Reviews Completed</TableHead>
                      <TableHead>Average Rating</TableHead>
                      <TableHead>Expertise</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewers.map((reviewer) => (
                      <TableRow key={reviewer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {reviewer.avatar_url ? (
                                <img
                                  src={reviewer.avatar_url}
                                  alt={reviewer.full_name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {reviewer.full_name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{reviewer.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                @{reviewer.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {reviewer.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{reviewer.beneficial_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reviewer.reviews_completed || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{(reviewer.average_rating || 0).toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {reviewer.expertise_areas?.slice(0, 2).map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {reviewer.expertise_areas?.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{reviewer.expertise_areas.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {reviewer.is_verified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm">
                              {reviewer.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="auto_approval_threshold">Auto-Approval Threshold</Label>
                  <Input
                    id="auto_approval_threshold"
                    type="number"
                    placeholder="85"
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Content with scores above this threshold will be auto-approved
                  </p>
                </div>

                <div>
                  <Label htmlFor="reviewer_requirements">Reviewer Requirements</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="beneficial_requirement" defaultChecked />
                      <Label htmlFor="beneficial_requirement">
                        Minimum 100 beneficial marks for community review
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="scholar_verification" defaultChecked />
                      <Label htmlFor="scholar_verification">
                        Verified scholars only for Level 3 review
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="time_limits">Review Time Limits</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="level1_time">Level 1 (hours)</Label>
                      <Input id="level1_time" type="number" placeholder="1" />
                    </div>
                    <div>
                      <Label htmlFor="level2_time">Level 2 (hours)</Label>
                      <Input id="level2_time" type="number" placeholder="72" />
                    </div>
                    <div>
                      <Label htmlFor="level3_time">Level 3 (hours)</Label>
                      <Input id="level3_time" type="number" placeholder="168" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Detail Dialog */}
      {selectedVerification && (
        <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Verification Details</DialogTitle>
            </DialogHeader>
            <VerificationDetailDialog
              verification={selectedVerification}
              onClose={() => setSelectedVerification(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Verification Detail Dialog Component
function VerificationDetailDialog({ 
  verification, 
  onClose 
}: { 
  verification: ContentVerification; 
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Content Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title:</span>
              <span>{verification.content.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">{verification.content_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span>{verification.content.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Author:</span>
              <span>{verification.content.author.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={getStatusColor(verification.status)}>
                {verification.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <Badge className={getPriorityColor(verification.priority)}>
                {verification.priority}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Verification Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Overall Score</span>
              <span className="font-semibold">{verification.overall_score}%</span>
            </div>
            <Progress value={verification.overall_score} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span>Current Level</span>
              <Badge variant="outline">Level {verification.current_level}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Submitted</span>
              <span>{formatDate(verification.submitted_at)}</span>
            </div>
            
            {verification.completed_at && (
              <div className="flex items-center justify-between">
                <span>Completed</span>
                <span>{formatDate(verification.completed_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Verification Results</h3>
        <div className="space-y-3">
          {verification.results.map((result) => (
            <Card key={result.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">{result.check_id.replace('_', ' ')}</span>
                </div>
                <Badge variant={result.passed ? "default" : "destructive"}>
                  {result.score}%
                </Badge>
              </div>
              
              {result.feedback && (
                <p className="text-sm text-muted-foreground mb-2">
                  {result.feedback}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Reviewed: {formatDate(result.reviewed_at)}</span>
                {result.reviewer_id && <span>Reviewer: {result.reviewer_id}</span>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Review
        </Button>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_review':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'needs_revision':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}
