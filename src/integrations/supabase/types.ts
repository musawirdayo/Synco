export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          details: Json;
          id: string;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json;
          id?: string;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json;
          id?: string;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [];
      };
      admin_presence: {
        Row: {
          last_path: string;
          last_seen_at: string;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          last_path?: string;
          last_seen_at?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          last_path?: string;
          last_seen_at?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
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
          identifier_prefix: string | null;
          identifier_suffix_digits: number | null;
          identifier_type: string | null;
          institution: string | null;
          invite_code: string;
          is_published: boolean;
          lead_id: string;
          name: string;
          roster_lock_enabled: boolean;
          team_assignments: Json | null;
          team_size: number;
        };
        Insert: {
          created_at?: string;
          expected_count?: number;
          id?: string;
          identifier_prefix?: string | null;
          identifier_suffix_digits?: number | null;
          identifier_type?: string | null;
          institution?: string | null;
          invite_code: string;
          is_published?: boolean;
          lead_id: string;
          name: string;
          roster_lock_enabled?: boolean;
          team_assignments?: Json | null;
          team_size?: number;
        };
        Update: {
          created_at?: string;
          expected_count?: number;
          id?: string;
          identifier_prefix?: string | null;
          identifier_suffix_digits?: number | null;
          identifier_type?: string | null;
          institution?: string | null;
          invite_code?: string;
          is_published?: boolean;
          lead_id?: string;
          name?: string;
          roster_lock_enabled?: boolean;
          team_assignments?: Json | null;
          team_size?: number;
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
      platform_match_feedback: {
        Row: {
          choice: string;
          class_id: string;
          created_at: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          choice: string;
          class_id: string;
          created_at?: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          choice?: string;
          class_id?: string;
          created_at?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_match_feedback_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_content: {
        Row: {
          body: string;
          content_key: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body: string;
          content_key: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string;
          content_key?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          created_at: string;
          created_by: string | null;
          note: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          note?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [];
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
      admin_delete_class: {
        Args: { _class_id: string };
        Returns: undefined;
      };
      admin_delete_user_account: {
        Args: { _user_id: string };
        Returns: undefined;
      };
      admin_get_class_detail: {
        Args: { _class_id: string };
        Returns: Json;
      };
      admin_get_overview: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_user_detail: {
        Args: { _user_id: string };
        Returns: Json;
      };
      admin_has_platform_access: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      admin_grant_platform_admin: {
        Args: { _note?: string | null; _user_id: string };
        Returns: undefined;
      };
      admin_list_audit_log: {
        Args: { _limit?: number };
        Returns: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          details: Json;
          id: string;
          target_id: string | null;
          target_type: string;
        }[];
      };
      admin_list_platform_content: {
        Args: Record<PropertyKey, never>;
        Returns: {
          body: string;
          content_key: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          updated_by_email: string | null;
        }[];
      };
      admin_list_classes: {
        Args: { _limit?: number; _query?: string };
        Returns: {
          class_id: string;
          completed_count: number;
          created_at: string;
          expected_count: number;
          feedback_count: number;
          institution: string | null;
          invite_code: string;
          is_published: boolean;
          lead_email: string | null;
          lead_id: string;
          lead_name: string | null;
          member_count: number;
          name: string;
          result_count: number;
          team_size: number;
        }[];
      };
      admin_revoke_platform_admin: {
        Args: { _user_id: string };
        Returns: undefined;
      };
      admin_search_users: {
        Args: { _limit?: number; _query?: string };
        Returns: {
          class_count: number;
          completed_response_count: number;
          created_at: string;
          email: string | null;
          full_name: string | null;
          is_admin: boolean;
          last_path: string | null;
          last_seen_at: string | null;
          last_sign_in_at: string | null;
          led_class_count: number;
          response_count: number;
          role: Database["public"]["Enums"]["app_role"] | null;
          user_id: string;
        }[];
      };
      admin_set_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: undefined;
      };
      admin_upsert_platform_content: {
        Args: { _body: string; _content_key: string; _summary: string; _title: string };
        Returns: Database["public"]["Tables"]["platform_content"]["Row"];
      };
      is_platform_admin: {
        Args: { _user_id: string };
        Returns: boolean;
      };
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
          identifier_prefix: string | null;
          identifier_suffix_digits: number | null;
          identifier_type: string;
          requires_identifier: boolean;
          roster_lock_enabled: boolean;
        }[];
      };
      normalize_class_identifier: {
        Args: { _class_id: string; _identifier: string };
        Returns: string | null;
      };
      normalize_roll_prefix: {
        Args: { _prefix: string };
        Returns: string | null;
      };
      normalize_student_identifier: {
        Args: { _identifier: string };
        Returns: string | null;
      };
      record_presence: {
        Args: { _path: string; _user_agent?: string | null };
        Returns: undefined;
      };
      setup_demo_class: {
        Args: { _lead_id: string };
        Returns: string;
      };
      submit_match_feedback: {
        Args: { class_id: string; choice: string };
        Returns: Json;
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
