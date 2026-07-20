export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_progress: {
        Row: {
          briefing_completed: boolean
          completed_at: string | null
          completed_minutes: number
          completion_percentage: number
          created_at: string
          day_number: number
          day_title: string | null
          decisions_completed: boolean
          estimated_minutes: number
          id: string
          learning_completed: boolean
          practice_completed: boolean
          project_phase: string | null
          reflection_completed: boolean
          run_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          workplace_activities_completed: boolean
        }
        Insert: {
          briefing_completed?: boolean
          completed_at?: string | null
          completed_minutes?: number
          completion_percentage?: number
          created_at?: string
          day_number: number
          day_title?: string | null
          decisions_completed?: boolean
          estimated_minutes?: number
          id?: string
          learning_completed?: boolean
          practice_completed?: boolean
          project_phase?: string | null
          reflection_completed?: boolean
          run_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workplace_activities_completed?: boolean
        }
        Update: {
          briefing_completed?: boolean
          completed_at?: string | null
          completed_minutes?: number
          completion_percentage?: number
          created_at?: string
          day_number?: number
          day_title?: string | null
          decisions_completed?: boolean
          estimated_minutes?: number
          id?: string
          learning_completed?: boolean
          practice_completed?: boolean
          project_phase?: string | null
          reflection_completed?: boolean
          run_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workplace_activities_completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reflections: {
        Row: {
          created_at: string
          day_number: number
          id: string
          key_learning: string | null
          mentor_feedback: Json | null
          run_id: string
          updated_at: string
          user_id: string
          what_was_challenging: string | null
          what_went_well: string | null
          what_would_change: string | null
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          key_learning?: string | null
          mentor_feedback?: Json | null
          run_id: string
          updated_at?: string
          user_id: string
          what_was_challenging?: string | null
          what_went_well?: string | null
          what_would_change?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          key_learning?: string | null
          mentor_feedback?: Json | null
          run_id?: string
          updated_at?: string
          user_id?: string
          what_was_challenging?: string | null
          what_went_well?: string | null
          what_would_change?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reflections_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_reports: {
        Row: {
          avg_confidence: number
          avg_time_per_question_ms: number
          completed_at: string
          correct_count: number
          created_at: string
          difficulty_breakdown: Json
          domain_scores: Json
          duration_taken_ms: number
          id: string
          knowledge_area_scores: Json
          mode: string
          overall_percent: number
          pass_probability: number
          readiness: string
          session_id: string | null
          strongest_topics: Json
          too_fast_count: number
          too_slow_count: number
          total_questions: number
          updated_at: string
          user_id: string
          weakest_topics: Json
        }
        Insert: {
          avg_confidence?: number
          avg_time_per_question_ms?: number
          completed_at?: string
          correct_count?: number
          created_at?: string
          difficulty_breakdown?: Json
          domain_scores?: Json
          duration_taken_ms?: number
          id?: string
          knowledge_area_scores?: Json
          mode?: string
          overall_percent?: number
          pass_probability?: number
          readiness?: string
          session_id?: string | null
          strongest_topics?: Json
          too_fast_count?: number
          too_slow_count?: number
          total_questions?: number
          updated_at?: string
          user_id: string
          weakest_topics?: Json
        }
        Update: {
          avg_confidence?: number
          avg_time_per_question_ms?: number
          completed_at?: string
          correct_count?: number
          created_at?: string
          difficulty_breakdown?: Json
          domain_scores?: Json
          duration_taken_ms?: number
          id?: string
          knowledge_area_scores?: Json
          mode?: string
          overall_percent?: number
          pass_probability?: number
          readiness?: string
          session_id?: string | null
          strongest_topics?: Json
          too_fast_count?: number
          too_slow_count?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
          weakest_topics?: Json
        }
        Relationships: []
      }
      final_assessments: {
        Row: {
          assessment_data: Json
          created_at: string
          development_areas: Json
          generated_at: string
          id: string
          overall_score: number
          readiness_level: string
          recommended_next_steps: Json
          run_id: string
          strengths: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_data?: Json
          created_at?: string
          development_areas?: Json
          generated_at?: string
          id?: string
          overall_score?: number
          readiness_level?: string
          recommended_next_steps?: Json
          run_id: string
          strengths?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_data?: Json
          created_at?: string
          development_areas?: Json
          generated_at?: string
          id?: string
          overall_score?: number
          readiness_level?: string
          recommended_next_steps?: Json
          run_id?: string
          strengths?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_assessments_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: true
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_mastery: {
        Row: {
          attempts: number
          competency: string | null
          consecutive_correct: number
          consecutive_wrong: number
          difficulty: string | null
          eco_domain: string | null
          id: string
          is_development_area: boolean
          is_mastered: boolean
          last_practiced_at: string | null
          mastered_at: string | null
          mastery_score: number
          pmbok_domain: string | null
          pmbok_principle: string | null
          recent_scores: Json
          successful_decisions: number
          topic: string
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          competency?: string | null
          consecutive_correct?: number
          consecutive_wrong?: number
          difficulty?: string | null
          eco_domain?: string | null
          id?: string
          is_development_area?: boolean
          is_mastered?: boolean
          last_practiced_at?: string | null
          mastered_at?: string | null
          mastery_score?: number
          pmbok_domain?: string | null
          pmbok_principle?: string | null
          recent_scores?: Json
          successful_decisions?: number
          topic: string
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          competency?: string | null
          consecutive_correct?: number
          consecutive_wrong?: number
          difficulty?: string | null
          eco_domain?: string | null
          id?: string
          is_development_area?: boolean
          is_mastered?: boolean
          last_practiced_at?: string | null
          mastered_at?: string | null
          mastery_score?: number
          pmbok_domain?: string | null
          pmbok_principle?: string | null
          recent_scores?: Json
          successful_decisions?: number
          topic?: string
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_attempts: {
        Row: {
          correct_answer: string | null
          created_at: string
          eco_mapping: Json
          feedback: Json
          id: string
          is_correct: boolean
          pmbok_mapping: Json
          question_id: string
          reasoning: string | null
          run_id: string
          selected_answer: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          eco_mapping?: Json
          feedback?: Json
          id?: string
          is_correct?: boolean
          pmbok_mapping?: Json
          question_id: string
          reasoning?: string | null
          run_id: string
          selected_answer?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          eco_mapping?: Json
          feedback?: Json
          id?: string
          is_correct?: boolean
          pmbok_mapping?: Json
          question_id?: string
          reasoning?: string | null
          run_id?: string
          selected_answer?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          completed_at: string | null
          correct_answers: number
          created_at: string
          day_number: number
          estimated_minutes: number
          id: string
          metadata: Json
          questions: Json
          run_id: string
          score: number
          status: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          day_number: number
          estimated_minutes?: number
          id?: string
          metadata?: Json
          questions?: Json
          run_id: string
          score?: number
          status?: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          day_number?: number
          estimated_minutes?: number
          id?: string
          metadata?: Json
          questions?: Json
          run_id?: string
          score?: number
          status?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          runs_completed: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          runs_completed?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          runs_completed?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      simulation_actions: {
        Row: {
          action_key: string
          action_type: string
          created_at: string
          eco_mapping: Json
          id: string
          input_data: Json
          mastery_impacts: Json
          metric_impacts: Json
          outcome_data: Json
          pmbok_mapping: Json
          run_id: string
          section_number: number | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          action_key: string
          action_type: string
          created_at?: string
          eco_mapping?: Json
          id?: string
          input_data?: Json
          mastery_impacts?: Json
          metric_impacts?: Json
          outcome_data?: Json
          pmbok_mapping?: Json
          run_id: string
          section_number?: number | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          action_key?: string
          action_type?: string
          created_at?: string
          eco_mapping?: Json
          id?: string
          input_data?: Json
          mastery_impacts?: Json
          metric_impacts?: Json
          outcome_data?: Json
          pmbok_mapping?: Json
          run_id?: string
          section_number?: number | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_decisions: {
        Row: {
          created_at: string
          day_number: number | null
          decision_id: string
          event_id: string | null
          id: string
          mentor_feedback: Json
          metric_impacts: Json
          phase: string | null
          reasoning: string | null
          run_id: string
          selected_option_id: string | null
          selected_option_text: string | null
          user_id: string
          week_number: number | null
        }
        Insert: {
          created_at?: string
          day_number?: number | null
          decision_id: string
          event_id?: string | null
          id?: string
          mentor_feedback?: Json
          metric_impacts?: Json
          phase?: string | null
          reasoning?: string | null
          run_id: string
          selected_option_id?: string | null
          selected_option_text?: string | null
          user_id: string
          week_number?: number | null
        }
        Update: {
          created_at?: string
          day_number?: number | null
          decision_id?: string
          event_id?: string | null
          id?: string
          mentor_feedback?: Json
          metric_impacts?: Json
          phase?: string | null
          reasoning?: string | null
          run_id?: string
          selected_option_id?: string | null
          selected_option_text?: string | null
          user_id?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_decisions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_events: {
        Row: {
          completed_at: string | null
          created_at: string
          day_number: number | null
          eco_mapping: Json
          event_key: string
          event_type: string | null
          id: string
          metric_effects: Json
          payload: Json
          pmbok_mapping: Json
          priority: string
          related_decision_id: string | null
          responded_at: string | null
          run_id: string
          scheduled_day: number | null
          scheduled_week: number | null
          status: string
          trigger_condition: string | null
          unlocked_at: string | null
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_number?: number | null
          eco_mapping?: Json
          event_key: string
          event_type?: string | null
          id?: string
          metric_effects?: Json
          payload?: Json
          pmbok_mapping?: Json
          priority?: string
          related_decision_id?: string | null
          responded_at?: string | null
          run_id: string
          scheduled_day?: number | null
          scheduled_week?: number | null
          status?: string
          trigger_condition?: string | null
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_number?: number | null
          eco_mapping?: Json
          event_key?: string
          event_type?: string | null
          id?: string
          metric_effects?: Json
          payload?: Json
          pmbok_mapping?: Json
          priority?: string
          related_decision_id?: string | null
          responded_at?: string | null
          run_id?: string
          scheduled_day?: number | null
          scheduled_week?: number | null
          status?: string
          trigger_condition?: string | null
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_runs: {
        Row: {
          budget_score: number
          case_id: string
          chapter_state: Json
          completed_at: string | null
          completed_minutes: number
          created_at: string
          current_day: number
          current_phase: string
          current_week: number
          customer_satisfaction: number
          estimated_total_minutes: number
          id: string
          in_world_date: string | null
          last_activity_at: string
          project_health: number
          quality_score: number
          risk_score: number
          schedule_score: number
          selected_delivery_approach: string | null
          stakeholder_trust: number
          started_at: string
          state_snapshot: Json
          status: string
          tailoring_config: Json
          team_morale: number
          total_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          budget_score?: number
          case_id: string
          chapter_state?: Json
          completed_at?: string | null
          completed_minutes?: number
          created_at?: string
          current_day?: number
          current_phase?: string
          current_week?: number
          customer_satisfaction?: number
          estimated_total_minutes?: number
          id?: string
          in_world_date?: string | null
          last_activity_at?: string
          project_health?: number
          quality_score?: number
          risk_score?: number
          schedule_score?: number
          selected_delivery_approach?: string | null
          stakeholder_trust?: number
          started_at?: string
          state_snapshot?: Json
          status?: string
          tailoring_config?: Json
          team_morale?: number
          total_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          budget_score?: number
          case_id?: string
          chapter_state?: Json
          completed_at?: string | null
          completed_minutes?: number
          created_at?: string
          current_day?: number
          current_phase?: string
          current_week?: number
          customer_satisfaction?: number
          estimated_total_minutes?: number
          id?: string
          in_world_date?: string | null
          last_activity_at?: string
          project_health?: number
          quality_score?: number
          risk_score?: number
          schedule_score?: number
          selected_delivery_approach?: string | null
          stakeholder_trust?: number
          started_at?: string
          state_snapshot?: Json
          status?: string
          tailoring_config?: Json
          team_morale?: number
          total_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      simulation_scores: {
        Row: {
          chapter: number
          communication_score: number
          created_at: string
          decision_score: number
          id: string
          metadata: Json
          overall_score: number
          run_id: string
          sample_count: number
          stakeholder_score: number
          updated_at: string
        }
        Insert: {
          chapter: number
          communication_score?: number
          created_at?: string
          decision_score?: number
          id?: string
          metadata?: Json
          overall_score?: number
          run_id: string
          sample_count?: number
          stakeholder_score?: number
          updated_at?: string
        }
        Update: {
          chapter?: number
          communication_score?: number
          created_at?: string
          decision_score?: number
          id?: string
          metadata?: Json
          overall_score?: number
          run_id?: string
          sample_count?: number
          stakeholder_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_scores_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholder_commitments: {
        Row: {
          chapter: number | null
          created_at: string
          description: string
          due_in_world: string | null
          id: string
          metadata: Json
          resolution_note: string | null
          run_id: string
          stakeholder_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chapter?: number | null
          created_at?: string
          description: string
          due_in_world?: string | null
          id?: string
          metadata?: Json
          resolution_note?: string | null
          run_id: string
          stakeholder_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chapter?: number | null
          created_at?: string
          description?: string
          due_in_world?: string | null
          id?: string
          metadata?: Json
          resolution_note?: string | null
          run_id?: string
          stakeholder_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_commitments_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholder_memories: {
        Row: {
          chapter: number | null
          created_at: string
          id: string
          kind: string
          metadata: Json
          run_id: string
          sentiment: string | null
          stakeholder_id: string
          summary: string
          weight: number
        }
        Insert: {
          chapter?: number | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          run_id: string
          sentiment?: string | null
          stakeholder_id: string
          summary: string
          weight?: number
        }
        Update: {
          chapter?: number | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          run_id?: string
          sentiment?: string | null
          stakeholder_id?: string
          summary?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_memories_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholder_relationships: {
        Row: {
          created_at: string
          engagement: string
          id: string
          interaction_count: number
          last_interaction_at: string | null
          last_interaction_summary: string | null
          metadata: Json
          run_id: string
          sentiment: string
          stakeholder_id: string
          trust: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          engagement?: string
          id?: string
          interaction_count?: number
          last_interaction_at?: string | null
          last_interaction_summary?: string | null
          metadata?: Json
          run_id: string
          sentiment?: string
          stakeholder_id: string
          trust?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          engagement?: string
          id?: string
          interaction_count?: number
          last_interaction_at?: string | null
          last_interaction_summary?: string | null
          metadata?: Json
          run_id?: string
          sentiment?: string
          stakeholder_id?: string
          trust?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_relationships_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
          welcome_bonus_granted: boolean
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
          welcome_bonus_granted?: boolean
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
          welcome_bonus_granted?: boolean
        }
        Relationships: []
      }
      team_memberships: {
        Row: {
          accepted_at: string | null
          id: string
          invite_token: string
          invited_at: string
          invited_email: string
          role: string
          status: string
          team_id: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invite_token?: string
          invited_at?: string
          invited_email: string
          role?: string
          status?: string
          team_id: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invite_token?: string
          invited_at?: string
          invited_email?: string
          role?: string
          status?: string
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          environment: string
          id: string
          owner_user_id: string
          seats: number
          status: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          owner_user_id: string
          seats?: number
          status?: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          owner_user_id?: string
          seats?: number
          status?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          attempted_at: string | null
          completed_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          processing_state: string
          provider: string
          received_at: string
        }
        Insert: {
          attempted_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          processing_state?: string
          provider?: string
          received_at?: string
        }
        Update: {
          attempted_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          processing_state?: string
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: {
        Args: { _token: string }
        Returns: {
          accepted: boolean
          team_id: string
        }[]
      }
      grant_welcome_bonus: {
        Args: { _bonus: number; _env: string; _subscription_id: string }
        Returns: {
          display_name: string
          granted: boolean
          user_id: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_active_team: {
        Args: { _env: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
