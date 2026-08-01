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
          day: string
          id: string
          user_id: string
        }
        Insert: {
          day: string
          id?: string
          user_id: string
        }
        Update: {
          day?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      learned_words: {
        Row: {
          created_at: string
          id: string
          translation: string | null
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          translation?: string | null
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          translation?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          question: string
          skill: string | null
          tag: string | null
          user_id: string
          wrong_answer: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          question: string
          skill?: string | null
          tag?: string | null
          user_id: string
          wrong_answer?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          question?: string
          skill?: string | null
          tag?: string | null
          user_id?: string
          wrong_answer?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          best_streak: number
          created_at: string
          daily_word_count: number
          difficulty: string
          gender: string | null
          last_view: string | null
          last_visit: string | null
          level_chosen: string | null
          linny_intro_seen: boolean
          name: string | null
          onboarded: boolean
          placement_count: number | null
          placement_score: number | null
          placement_stars: number | null
          streak: number
          theme: string
          updated_at: string
          user_id: string
          vocab_last_generated: string | null
          vocab_last_test_date: string | null
          vocab_setup_done: boolean
        }
        Insert: {
          age?: number | null
          best_streak?: number
          created_at?: string
          daily_word_count?: number
          difficulty?: string
          gender?: string | null
          last_view?: string | null
          last_visit?: string | null
          level_chosen?: string | null
          linny_intro_seen?: boolean
          name?: string | null
          onboarded?: boolean
          placement_count?: number | null
          placement_score?: number | null
          placement_stars?: number | null
          streak?: number
          theme?: string
          updated_at?: string
          user_id: string
          vocab_last_generated?: string | null
          vocab_last_test_date?: string | null
          vocab_setup_done?: boolean
        }
        Update: {
          age?: number | null
          best_streak?: number
          created_at?: string
          daily_word_count?: number
          difficulty?: string
          gender?: string | null
          last_view?: string | null
          last_visit?: string | null
          level_chosen?: string | null
          linny_intro_seen?: boolean
          name?: string | null
          onboarded?: boolean
          placement_count?: number | null
          placement_score?: number | null
          placement_stars?: number | null
          streak?: number
          theme?: string
          updated_at?: string
          user_id?: string
          vocab_last_generated?: string | null
          vocab_last_test_date?: string | null
          vocab_setup_done?: boolean
        }
        Relationships: []
      }
      vocab_words: {
        Row: {
          assigned_date: string
          created_at: string
          example: string | null
          example_uz: string | null
          favorited_at: string | null
          id: string
          is_favorite: boolean
          learned_at: string | null
          pronunciation: string | null
          status: string
          topic: string | null
          translation: string
          user_id: string
          word: string
        }
        Insert: {
          assigned_date: string
          created_at?: string
          example?: string | null
          example_uz?: string | null
          favorited_at?: string | null
          id?: string
          is_favorite?: boolean
          learned_at?: string | null
          pronunciation?: string | null
          status?: string
          topic?: string | null
          translation: string
          user_id: string
          word: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          example?: string | null
          example_uz?: string | null
          favorited_at?: string | null
          id?: string
          is_favorite?: boolean
          learned_at?: string | null
          pronunciation?: string | null
          status?: string
          topic?: string | null
          translation?: string
          user_id?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
