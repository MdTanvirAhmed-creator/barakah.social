// Companion System TypeScript Types

// ============ ENUM TYPES ============

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced' | 'any';
export type GenderPreference = 'same_only' | 'educational_mixed' | 'any';
export type InteractionType = 
  | 'beneficial_given' 
  | 'comment_reply' 
  | 'halaqa_shared' 
  | 'knowledge_shared' 
  | 'message_sent'
  | 'post_interaction'
  | 'study_session';
export type PartnershipType = 
  | 'quran_memorization' 
  | 'arabic_learning' 
  | 'book_study' 
  | 'hadith_study'
  | 'fiqh_study'
  | 'general';
export type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type MentorStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type LifeStage = 'student' | 'professional' | 'parent' | 'retiree' | 'seeker' | 'other';
export type PersonalityTrait = 'truthful' | 'just' | 'generous' | 'patient' | 'grateful' | 'humble' | 'sincere' | 'kind';

// ============ TABLE INTERFACES ============

export interface CompanionConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  connection_strength: number; // 0-100
  last_interaction: string; // ISO timestamp
  created_at: string;
  updated_at: string;
  message?: string;
  
  // Populated fields (from joins)
  requester?: CompanionProfile;
  recipient?: CompanionProfile;
}

export interface UserMatchingPreferences {
  user_id: string;
  preferred_age_range?: [number, number];
  preferred_location_radius?: number; // in km
  preferred_knowledge_level?: KnowledgeLevel;
  preferred_languages?: string[];
  gender_preference?: GenderPreference;
  is_seeking_mentor: boolean;
  can_be_mentor: boolean;
  interests_weight: number; // 0-100
  activity_weight: number; // 0-100
  location_weight: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface CompanionInteraction {
  id: string;
  companion_connection_id: string;
  interaction_type: InteractionType;
  metadata?: Record<string, any>;
  points: number; // 0-100
  created_at: string;
}

export interface StudyPartnership {
  id: string;
  partnership_type: PartnershipType;
  partner_1_id: string;
  partner_2_id: string;
  current_progress?: PartnershipProgress;
  goal?: string;
  target_date?: string; // ISO date
  check_in_frequency: CheckInFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Populated fields (from joins)
  partner_1?: CompanionProfile;
  partner_2?: CompanionProfile;
}

export interface MentorRelationship {
  id: string;
  mentor_id: string;
  student_id: string;
  subject_areas: string[];
  status: MentorStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  
  // Populated fields (from joins)
  mentor?: CompanionProfile;
  student?: CompanionProfile;
}

// ============ EXTENDED PROFILE ============

export interface CompanionProfile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  interests: string[];
  madhab_preference?: string;
  beneficial_count: number;
  
  // Companion-specific fields
  companion_score: number; // 0-100
  is_available_for_connections: boolean;
  connection_capacity: number; // 0-200
  last_active: string;
  personality_traits: PersonalityTrait[];
  life_stage?: LifeStage;
}

// ============ PARTNERSHIP PROGRESS ============

export interface PartnershipProgress {
  quran_memorization?: {
    current_surah: string;
    ayahs_memorized: number;
    target_ayahs: number;
    last_review: string;
  };
  check_ins?: Array<{
    date: string;
    partner_1_completed: boolean;
    partner_2_completed: boolean;
    notes?: string;
  }>;
  [key: string]: any; // Allow custom progress tracking
}

// ============ VIEW INTERFACES ============

export interface ActiveCompanionConnection extends CompanionConnection {
  requester_name: string;
  requester_username: string;
  requester_avatar: string | null;
  recipient_name: string;
  recipient_username: string;
  recipient_avatar: string | null;
}

export interface MentorMenteeMatch {
  mentor_id: string;
  mentor_name: string;
  mentor_username: string;
  mentor_avatar: string | null;
  mentor_beneficial_count: number;
  mentor_interests: string[];
  seeker_id: string;
  seeker_name: string;
  seeker_username: string;
  seeker_avatar: string | null;
  seeker_interests: string[];
  match_score: number; // 0-100
}

// ============ UI HELPER TYPES ============

export interface CompanionNotification {
  id: string;
  type: 'connection_request' | 'connection_accepted' | 'study_reminder' | 'mentor_message' | 'interaction';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedUserAvatar?: string;
}

export interface CompanionStats {
  total_connections: number;
  pending_requests: number;
  active_partnerships: number;
  total_interactions: number;
  average_connection_strength: number;
  is_mentor: boolean;
  is_mentee: boolean;
}

export interface CompanionSuggestion {
  profile: CompanionProfile;
  match_score: number;
  shared_interests: string[];
  reason: string; // e.g., "Perfect mentor match", "Similar interests", etc.
}

// ============ API REQUEST/RESPONSE TYPES ============

export interface SendConnectionRequestPayload {
  recipient_id: string;
  message?: string;
}

export interface UpdateConnectionStatusPayload {
  connection_id: string;
  status: 'accepted' | 'declined' | 'blocked';
}

export interface CreateStudyPartnershipPayload {
  partner_2_id: string;
  partnership_type: PartnershipType;
  goal?: string;
  target_date?: string;
  check_in_frequency: CheckInFrequency;
}

export interface TrackInteractionPayload {
  companion_connection_id: string;
  interaction_type: InteractionType;
  metadata?: Record<string, any>;
}

export interface UpdateMatchingPreferencesPayload {
  preferred_knowledge_level?: KnowledgeLevel;
  preferred_languages?: string[];
  gender_preference?: GenderPreference;
  is_seeking_mentor?: boolean;
  can_be_mentor?: boolean;
  interests_weight?: number;
  activity_weight?: number;
  location_weight?: number;
}

// ============ CONSTANTS ============

export const INTERACTION_POINTS: Record<InteractionType, number> = {
  beneficial_given: 2,
  comment_reply: 3,
  halaqa_shared: 5,
  knowledge_shared: 5,
  message_sent: 1,
  post_interaction: 2,
  study_session: 10,
};

export const PARTNERSHIP_TYPE_LABELS: Record<PartnershipType, string> = {
  quran_memorization: 'Quran Memorization',
  arabic_learning: 'Arabic Learning',
  book_study: 'Book Study',
  hadith_study: 'Hadith Study',
  fiqh_study: 'Fiqh Study',
  general: 'General Study',
};

export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  student: 'Student',
  professional: 'Professional',
  parent: 'Parent',
  retiree: 'Retiree',
  seeker: 'Knowledge Seeker',
  other: 'Other',
};

export const PERSONALITY_TRAIT_LABELS: Record<PersonalityTrait, { english: string; arabic: string }> = {
  truthful: { english: 'Truthful', arabic: 'Sadiq' },
  just: { english: 'Just', arabic: 'Adil' },
  generous: { english: 'Generous', arabic: 'Karim' },
  patient: { english: 'Patient', arabic: 'Sabir' },
  grateful: { english: 'Grateful', arabic: 'Shakir' },
  humble: { english: 'Humble', arabic: 'Mutawadi' },
  sincere: { english: 'Sincere', arabic: 'Mukhlis' },
  kind: { english: 'Kind', arabic: 'Raheem' },
};

