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
      chat_contacts: {
        Row: {
          avatar: string | null
          client_id: string
          cod_agent: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_group: boolean | null
          is_muted: boolean | null
          last_message_at: string | null
          last_message_text: string | null
          name: string
          phone: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          client_id: string
          cod_agent?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_group?: boolean | null
          is_muted?: boolean | null
          last_message_at?: string | null
          last_message_text?: string | null
          name: string
          phone: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          client_id?: string
          cod_agent?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_group?: boolean | null
          is_muted?: boolean | null
          last_message_at?: string | null
          last_message_text?: string | null
          name?: string
          phone?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          caption: string | null
          client_id: string
          contact_id: string
          created_at: string
          file_name: string | null
          from_me: boolean | null
          id: string
          media_url: string | null
          message_id: string | null
          metadata: Json | null
          reply_to: string | null
          status: string | null
          text: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          caption?: string | null
          client_id: string
          contact_id: string
          created_at?: string
          file_name?: string | null
          from_me?: boolean | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          reply_to?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          caption?: string | null
          client_id?: string
          contact_id?: string
          created_at?: string
          file_name?: string | null
          from_me?: boolean | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          reply_to?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "chat_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_boards: {
        Row: {
          cod_agent: string
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          position: number
          settings: Json | null
          updated_at: string
        }
        Insert: {
          cod_agent: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          position?: number
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          cod_agent?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          position?: number
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_custom_fields: {
        Row: {
          board_id: string
          cod_agent: string
          created_at: string
          default_value: string | null
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          is_visible: boolean
          options: Json | null
          position: number
          updated_at: string
        }
        Insert: {
          board_id: string
          cod_agent: string
          created_at?: string
          default_value?: string | null
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          options?: Json | null
          position?: number
          updated_at?: string
        }
        Update: {
          board_id?: string
          cod_agent?: string
          created_at?: string
          default_value?: string | null
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          options?: Json | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_fields_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "crm_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_history: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          changes: Json | null
          deal_id: string
          from_pipeline_id: string | null
          id: string
          notes: string | null
          to_pipeline_id: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          changes?: Json | null
          deal_id: string
          from_pipeline_id?: string | null
          id?: string
          notes?: string | null
          to_pipeline_id?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changes?: Json | null
          deal_id?: string
          from_pipeline_id?: string | null
          id?: string
          notes?: string | null
          to_pipeline_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_history_from_pipeline_id_fkey"
            columns: ["from_pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_history_to_pipeline_id_fkey"
            columns: ["to_pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          assigned_to: string | null
          board_id: string
          cod_agent: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          custom_fields: Json | null
          description: string | null
          expected_close_date: string | null
          id: string
          pipeline_id: string
          position: number
          priority: string | null
          stage_entered_at: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          board_id: string
          cod_agent: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          pipeline_id: string
          position?: number
          priority?: string | null
          stage_entered_at?: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          board_id?: string
          cod_agent?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          pipeline_id?: string
          position?: number
          priority?: string | null
          stage_entered_at?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "crm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          board_id: string
          cod_agent: string
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          updated_at: string
          win_probability: number | null
        }
        Insert: {
          board_id: string
          cod_agent: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          updated_at?: string
          win_probability?: number | null
        }
        Update: {
          board_id?: string
          cod_agent?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          updated_at?: string
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "crm_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cod_agent: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cod_agent?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cod_agent?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "manager" | "agent" | "user"
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
    Enums: {
      app_role: ["admin", "manager", "agent", "user"],
    },
  },
} as const
