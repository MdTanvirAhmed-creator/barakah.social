"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckCircle,
  XCircle,
  Flag,
  Star,
  Clock,
  Users,
  BookOpen,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Award,
  Target,
  TrendingUp,
  Calendar,
  Globe,
  MessageSquare,
  FileText,
  Video,
  Headphones,
  Image,
  CheckCircle2,
  Flag as FlagIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  Eye as EyeIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  AlertTriangle as AlertTriangleIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Calendar as CalendarIcon,
  Globe as GlobeIcon,
  MessageSquare as MessageSquareIcon,
  FileText as FileTextIcon,
  RefreshCw,
  Video as VideoIcon,
  Headphones as HeadphonesIcon,
  Image as ImageIcon,
} from "lucide-react";

interface CuratorApplication {
  id: string;
  user_id: string;
  areas_of_interest: string[];
  languages: string[];
  time_commitment: string;
  experience: string;
  sample_evaluation: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

interface CuratorProfile {
  id: string;
  user_id: string;
  areas_of_interest: string[];
  languages: string[];
  time_commitment: string;
  experience: string;
  performance_score: number;
  content_reviewed: number;
  accuracy_rate: number;
  joined_at: string;
  last_active: string;
  is_active: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'audio' | 'pdf' | 'image';
  author: string;
  source: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'scholar';
  language: string;
  created_at: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'flagged';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface CuratorReview {
  id: string;
  content_id: string;
  curator_id: string;
  action: 'approve' | 'reject' | 'flag' | 'request_changes';
  comments: string;
  suggested_tags: string[];
  suggested_category: string;
  difficulty_rating: string;
  quality_score: number;
  reviewed_at: string;
}

export default function CuratorPage() {
  const [activeTab, setActiveTab] = useState('application');
  const [application, setApplication] = useState<CuratorApplication | null>(null);
  const [curatorProfile, setCuratorProfile] = useState<CuratorProfile | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<CuratorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCuratorData();
  }, []);

  const loadCuratorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has curator application
      const { data: applicationData } = await supabase
        .from('curator_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (applicationData) {
        setApplication(applicationData);
        
        if (applicationData.status === 'approved') {
          // Load curator profile
          const { data: profileData } = await supabase
            .from('curator_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profileData) {
            setCuratorProfile(profileData);
            setActiveTab('dashboard');
            await loadContentItems();
            await loadReviews();
          }
        } else {
          setActiveTab('application');
        }
      } else {
        setActiveTab('application');
      }
    } catch (error) {
      console.error('Error loading curator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .eq('status', 'pending_community')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setContentItems(data || []);
    } catch (error) {
      console.error('Error loading content items:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('curator_reviews')
        .select('*')
        .eq('curator_id', user.id)
        .order('reviewed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const submitApplication = async (formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('curator_applications')
        .insert({
          user_id: user.id,
          areas_of_interest: formData.areas_of_interest,
          languages: formData.languages,
          time_commitment: formData.time_commitment,
          experience: formData.experience,
          sample_evaluation: formData.sample_evaluation,
          status: 'pending'
        });

      if (error) throw error;
      
      setShowApplicationForm(false);
      await loadCuratorData();
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  const reviewContent = async (contentId: string, action: string, comments: string, suggestedTags: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('curator_reviews')
        .insert({
          content_id: contentId,
          curator_id: user.id,
          action,
          comments,
          suggested_tags: suggestedTags,
          reviewed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update content status
      const { error: updateError } = await supabase
        .from('content_submissions')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', contentId);

      if (updateError) throw updateError;

      await loadContentItems();
      await loadReviews();
    } catch (error) {
      console.error('Error reviewing content:', error);
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
      case 'image':
        return <ImageIcon className="w-4 h-4 text-orange-500" />;
      default:
        return <FileTextIcon className="w-4 h-4 text-gray-500" />;
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
          <h1 className="text-3xl font-bold text-foreground">Content Curator Program</h1>
          <p className="text-muted-foreground mt-2">
            Help maintain quality and authenticity of Islamic content
          </p>
        </div>
        {!application && (
          <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
            <DialogTrigger asChild>
              <Button>
                <UsersIcon className="w-4 h-4 mr-2" />
                Apply to be a Curator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Curator Application</DialogTitle>
              </DialogHeader>
              <CuratorApplicationForm onSubmit={submitApplication} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Application Status</p>
                <p className="text-2xl font-bold">
                  {application?.status === 'approved' ? 'Approved' : 
                   application?.status === 'rejected' ? 'Rejected' : 
                   application?.status === 'pending' ? 'Pending' : 'Not Applied'}
                </p>
              </div>
              <AwardIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        {curatorProfile && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Content Reviewed</p>
                    <p className="text-2xl font-bold">{curatorProfile.content_reviewed}</p>
                  </div>
                  <EyeIcon className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                    <p className="text-2xl font-bold">{curatorProfile.accuracy_rate}%</p>
                  </div>
                  <TargetIcon className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Performance Score</p>
                    <p className="text-2xl font-bold">{curatorProfile.performance_score}</p>
                  </div>
                  <StarIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="review">Review Content</TabsTrigger>
          <TabsTrigger value="history">Review History</TabsTrigger>
        </TabsList>

        {/* Application Tab */}
        <TabsContent value="application">
          <Card>
            <CardHeader>
              <CardTitle>Curator Application</CardTitle>
            </CardHeader>
            <CardContent>
              {application ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Application Status</h3>
                    <Badge className={
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {application.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Areas of Interest</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {application.areas_of_interest.map((area, index) => (
                          <Badge key={index} variant="secondary">{area}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Languages</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {application.languages.map((lang, index) => (
                          <Badge key={index} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Time Commitment</Label>
                      <p className="text-sm text-muted-foreground mt-1">{application.time_commitment}</p>
                    </div>
                    
                    <div>
                      <Label>Experience</Label>
                      <p className="text-sm text-muted-foreground mt-1">{application.experience}</p>
                    </div>
                  </div>
                  
                  {application.reviewer_notes && (
                    <div>
                      <Label>Reviewer Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">{application.reviewer_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Application Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Apply to become a content curator and help maintain quality standards.
                  </p>
                  <Button onClick={() => setShowApplicationForm(true)}>
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {curatorProfile ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Curator Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{curatorProfile.content_reviewed}</div>
                      <div className="text-sm text-muted-foreground">Content Reviewed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{curatorProfile.accuracy_rate}%</div>
                      <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{curatorProfile.performance_score}</div>
                      <div className="text-sm text-muted-foreground">Performance Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.slice(0, 5).map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {review.content_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              review.action === 'approve' ? 'default' :
                              review.action === 'reject' ? 'destructive' :
                              'secondary'
                            }>
                              {review.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(review.reviewed_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {review.comments}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AwardIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Application Pending</h3>
                <p className="text-muted-foreground">
                  Your curator application is being reviewed. You'll be notified once it's approved.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Review Content Tab */}
        <TabsContent value="review">
          {curatorProfile ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Review Queue</h3>
                <Button onClick={loadContentItems}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="grid gap-4">
                {contentItems.map((item) => (
                  <ContentReviewCard
                    key={item.id}
                    item={item}
                    onReview={reviewContent}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <EyeIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  You need to be an approved curator to review content.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Review History Tab */}
        <TabsContent value="history">
          {curatorProfile ? (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">
                          {review.content_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            review.action === 'approve' ? 'default' :
                            review.action === 'reject' ? 'destructive' :
                            'secondary'
                          }>
                            {review.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            {review.quality_score}/10
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(review.reviewed_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {review.comments}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <ClockIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Review History</h3>
                <p className="text-muted-foreground">
                  Your review history will appear here once you start reviewing content.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Curator Application Form Component
function CuratorApplicationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    areas_of_interest: [] as string[],
    languages: [] as string[],
    time_commitment: '',
    experience: '',
    sample_evaluation: ''
  });

  const areasOfInterest = [
    'Quran Studies', 'Hadith Studies', 'Fiqh', 'Aqeedah', 'Spirituality',
    'Islamic History', 'Arabic Language', 'Contemporary Issues', 'Youth Issues',
    'Family & Parenting', 'Islamic Finance', 'Health & Medicine'
  ];

  const languages = [
    'English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'French', 'Spanish',
    'German', 'Indonesian', 'Bengali', 'Persian', 'Swahili'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleArrayItem = (array: string[], item: string, setter: (value: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Areas of Interest/Expertise</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select the areas you're knowledgeable about and would like to curate content for.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {areasOfInterest.map((area) => (
            <div key={area} className="flex items-center space-x-2">
              <Checkbox
                id={area}
                checked={formData.areas_of_interest.includes(area)}
                onCheckedChange={() => toggleArrayItem(
                  formData.areas_of_interest, 
                  area, 
                  (value) => setFormData({ ...formData, areas_of_interest: value })
                )}
              />
              <Label htmlFor={area} className="text-sm">{area}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Languages Spoken</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select the languages you can review content in.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {languages.map((lang) => (
            <div key={lang} className="flex items-center space-x-2">
              <Checkbox
                id={lang}
                checked={formData.languages.includes(lang)}
                onCheckedChange={() => toggleArrayItem(
                  formData.languages, 
                  lang, 
                  (value) => setFormData({ ...formData, languages: value })
                )}
              />
              <Label htmlFor={lang} className="text-sm">{lang}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="time_commitment">Time Commitment</Label>
        <Select
          value={formData.time_commitment}
          onValueChange={(value) => setFormData({ ...formData, time_commitment: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select time commitment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5-10 hours/week">5-10 hours per week</SelectItem>
            <SelectItem value="10-15 hours/week">10-15 hours per week</SelectItem>
            <SelectItem value="15-20 hours/week">15-20 hours per week</SelectItem>
            <SelectItem value="20+ hours/week">20+ hours per week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="experience">Previous Experience</Label>
        <Textarea
          id="experience"
          placeholder="Describe your experience with Islamic content, education, or community work..."
          value={formData.experience}
          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="sample_evaluation">Sample Content Evaluation</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Please provide a brief evaluation of a piece of Islamic content you've encountered recently.
          This helps us understand your approach to content review.
        </p>
        <Textarea
          id="sample_evaluation"
          placeholder="Describe the content, its strengths, weaknesses, and your recommendation..."
          value={formData.sample_evaluation}
          onChange={(e) => setFormData({ ...formData, sample_evaluation: e.target.value })}
          rows={6}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
}

// Content Review Card Component
function ContentReviewCard({ 
  item, 
  onReview 
}: { 
  item: ContentItem; 
  onReview: (contentId: string, action: string, comments: string, suggestedTags: string[]) => void;
}) {
  const [comments, setComments] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleReview = (action: string) => {
    onReview(item.id, action, comments, suggestedTags);
    setShowReviewForm(false);
    setComments('');
    setSuggestedTags([]);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getContentTypeIcon(item.content_type)}
              <h3 className="font-semibold">{item.title}</h3>
              <Badge className={getPriorityColor(item.priority)}>
                {item.priority}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>By: {item.author}</span>
              <span>•</span>
              <span>{item.language}</span>
              <span>•</span>
              <span className="capitalize">{item.difficulty}</span>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReviewForm(true)}
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              Review
            </Button>
          </div>
        </div>
        
        {showReviewForm && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-3">Review Content</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Provide your review comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="suggested_tags">Suggested Tags</Label>
                <Input
                  id="suggested_tags"
                  placeholder="Enter tags separated by commas"
                  value={suggestedTags.join(', ')}
                  onChange={(e) => setSuggestedTags(e.target.value.split(',').map(t => t.trim()))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReview('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReview('reject')}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview('flag')}
                >
                  <FlagIcon className="w-4 h-4 mr-1" />
                  Flag
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getContentTypeIcon(type: string) {
  switch (type) {
    case 'article':
      return <FileTextIcon className="w-4 h-4 text-blue-500" />;
    case 'video':
      return <VideoIcon className="w-4 h-4 text-red-500" />;
    case 'audio':
      return <HeadphonesIcon className="w-4 h-4 text-green-500" />;
    case 'pdf':
      return <FileTextIcon className="w-4 h-4 text-purple-500" />;
    case 'image':
      return <ImageIcon className="w-4 h-4 text-orange-500" />;
    default:
      return <FileTextIcon className="w-4 h-4 text-gray-500" />;
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
