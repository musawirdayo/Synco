export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      class_members: {
        Row: {
          class_id: string;
          display_name: string;
          id: string;
          identifier: string | null;
          joined_at: string;
          student_id: string;
        };
        Insert: {
          class_id: string;
          display_name: string;
          id?: string;
          identifier?: string | null;
          joined_at?: string;
          student_id: string;
        };
        Update: {
          class_id?: string;
          display_name?: string;
          id?: string;
          identifier?: string | null;
          joined_at?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          created_at: string;
          expected_count: number;
          id: string;
          identifier_type: string | null;
          institution: string | null;
          invite_code: string;
          is_published: boolean;
          lead_id: string;
          name: string;
          roster_lock_enabled: boolean;
        };
        Insert: {
          created_at?: string;
          expected_count?: number;
          id?: string;
          identifier_type?: string | null;
          institution?: string | null;
          invite_code: string;
          is_published?: boolean;
          lead_id: string;
          name: string;
          roster_lock_enabled?: boolean;
        };
        Update: {
          created_at?: string;
          expected_count?: number;
          id?: string;
          identifier_type?: string | null;
          institution?: string | null;
          invite_code?: string;
          is_published?: boolean;
          lead_id?: string;
          name?: string;
          roster_lock_enabled?: boolean;
        };
        Relationships: [];
      };
      match_results: {
        Row: {
          class_id: string;
          generated_at: string;
          id: string;
          result_data: Json;
          student_id: string;
        };
        Insert: {
          class_id: string;
          generated_at?: string;
          id?: string;
          result_data: Json;
          student_id: string;
        };
        Update: {
          class_id?: string;
          generated_at?: string;
          id?: string;
          result_data?: Json;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_results_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"] | null;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["app_role"] | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"] | null;
        };
        Relationships: [];
      };
      roster_entries: {
        Row: {
          claimed_at: string | null;
          claimed_by: string | null;
          class_id: string;
          id: string;
          identifier: string;
          identifier_type: string;
        };
        Insert: {
          claimed_at?: string | null;
          claimed_by?: string | null;
          class_id: string;
          id?: string;
          identifier: string;
          identifier_type?: string;
        };
        Update: {
          claimed_at?: string | null;
          claimed_by?: string | null;
          class_id?: string;
          id?: string;
          identifier?: string;
          identifier_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roster_entries_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      survey_responses: {
        Row: {
          answers: Json;
          class_id: string;
          completed: boolean;
          id: string;
          student_id: string;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
          answers?: Json;
          class_id: string;
          completed?: boolean;
          id?: string;
          student_id: string;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          answers?: Json;
          class_id?: string;
          completed?: boolean;
          id?: string;
          student_id?: string;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "survey_responses_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_class_lead: {
        Args: { _class_id: string; _user_id: string };
        Returns: boolean;
      };
      is_class_member: {
        Args: { _class_id: string; _user_id: string };
        Returns: boolean;
      };
      join_class_by_code: {
        Args: { _code: string; _display_name: string; _identifier?: string };
        Returns: Json;
      };
      lookup_class_by_code: {
        Args: { _code: string };
        Returns: {
          identifier_type: string;
          requires_identifier: boolean;
          roster_lock_enabled: boolean;
        }[];
      };
      normalize_student_identifier: {
        Args: { _identifier: string };
        Returns: string | null;
      };
    };
    Enums: {
      app_role: "lead" | "student";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
