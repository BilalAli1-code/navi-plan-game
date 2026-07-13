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
      learner_mastery: {
        Row: {
          attempts: number
          eco_domain: string | null
          id: string
          last_practiced_at: string | null
          mastery_score: number
          pmbok_domain: string | null
          pmbok_principle: string | null
          successful_decisions: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          eco_domain?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_score?: number
          pmbok_domain?: string | null
          pmbok_principle?: string | null
          successful_decisions?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          eco_domain?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_score?: number
          pmbok_domain?: string | null
          pmbok_principle?: string | null
          successful_decisions?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          event_key: string
          event_type: string | null
          id: string
          payload: Json
          run_id: string
          scheduled_day: number | null
          scheduled_week: number | null
          status: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          event_key: string
          event_type?: string | null
          id?: string
          payload?: Json
          run_id: string
          scheduled_day?: number | null
          scheduled_week?: number | null
          status?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          event_key?: string
          event_type?: string | null
          id?: string
          payload?: Json
          run_id?: string
          scheduled_day?: number | null
          scheduled_week?: number | null
          status?: string
          unlocked_at?: string | null
          user_id?: string
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
          completed_at: string | null
          completed_minutes: number
          created_at: string
          current_day: number
          current_phase: string
          current_week: number
          customer_satisfaction: number
          estimated_total_minutes: number
          id: string
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
          completed_at?: string | null
          completed_minutes?: number
          created_at?: string
          current_day?: number
          current_phase?: string
          current_week?: number
          customer_satisfaction?: number
          estimated_total_minutes?: number
          id?: string
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
          completed_at?: string | null
          completed_minutes?: number
          created_at?: string
          current_day?: number
          current_phase?: string
          current_week?: number
          customer_satisfaction?: number
          estimated_total_minutes?: number
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
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
