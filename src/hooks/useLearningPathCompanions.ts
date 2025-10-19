"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompanionProfile } from "@/types/companion";

interface StudyPartner {
  profile: CompanionProfile;
  progress: number;
  last_activity: string;
}

export function useLearningPathCompanions(learningPathId: string) {
  const [partners, setPartners] = useState<StudyPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLearners, setTotalLearners] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (learningPathId) {
      loadStudyPartners();
    }
  }, [learningPathId]);

  const loadStudyPartners = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Mock data for demonstration (showing the feature)
      // In production, this would query learning_path_enrollments and companion_connections
      const mockPartners: StudyPartner[] = [
        {
          profile: {
            id: '1',
            username: 'ahmad_seeker',
            full_name: 'Ahmad Ibn Abdullah',
            avatar_url: undefined,
            interests: ['Quran', 'Hadith'],
            beneficial_count: 45,
            companion_score: 85,
            is_available_for_connections: true,
            connection_capacity: 50,
            last_active: new Date().toISOString(),
            personality_traits: ['patient', 'grateful'],
            life_stage: 'student',
          },
          progress: 45,
          last_activity: new Date().toISOString(),
        },
        {
          profile: {
            id: '2',
            username: 'fatima_learner',
            full_name: 'Fatima Al-Zahir',
            avatar_url: undefined,
            interests: ['Fiqh', 'Arabic'],
            beneficial_count: 32,
            companion_score: 78,
            is_available_for_connections: true,
            connection_capacity: 50,
            last_active: new Date().toISOString(),
            personality_traits: ['sincere', 'kind'],
            life_stage: 'professional',
          },
          progress: 72,
          last_activity: new Date().toISOString(),
        },
        {
          profile: {
            id: '3',
            username: 'omar_student',
            full_name: 'Omar Al-Faruq',
            avatar_url: undefined,
            interests: ['Tafsir', 'Seerah'],
            beneficial_count: 28,
            companion_score: 73,
            is_available_for_connections: true,
            connection_capacity: 50,
            last_active: new Date().toISOString(),
            personality_traits: ['just', 'truthful'],
            life_stage: 'student',
          },
          progress: 38,
          last_activity: new Date().toISOString(),
        },
      ];

      setPartners(mockPartners);
      setTotalLearners(125); // Mock total learners
    } catch (error) {
      console.error('Error loading study partners:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    partners,
    loading,
    totalLearners,
    refresh: loadStudyPartners,
  };
}

