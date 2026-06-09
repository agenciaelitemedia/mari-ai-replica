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
      chat_conversation_history: {
        Row: {
          action: string
          actor_name: string | null
          conversation_id: string
          created_at: string
          from_value: string | null
          id: string
          notes: string | null
          to_value: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          conversation_id: string
          created_at?: string
          from_value?: string | null
          id?: string
          notes?: string | null
          to_value?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          conversation_id?: string
          created_at?: string
          from_value?: string | null
          id?: string
          notes?: string | null
          to_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "chat_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          client_id: string
          close_note: string | null
          close_reason: string | null
          closed_at: string | null
          cod_agent: string | null
          contact_id: string
          created_at: string
          department: string | null
          first_response_at: string | null
          id: string
          metadata: Json | null
          opened_at: string
          priority: string
          protocol: string
          queue_id: string | null
          resolved_at: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          client_id: string
          close_note?: string | null
          close_reason?: string | null
          closed_at?: string | null
          cod_agent?: string | null
          contact_id: string
          created_at?: string
          department?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string
          priority?: string
          protocol: string
          queue_id?: string | null
          resolved_at?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          client_id?: string
          close_note?: string | null
          close_reason?: string | null
          closed_at?: string | null
          cod_agent?: string | null
          contact_id?: string
          created_at?: string
          department?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string
          priority?: string
          protocol?: string
          queue_id?: string | null
          resolved_at?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "chat_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_departments: {
        Row: {
          agents: string[] | null
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          agents?: string[] | null
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          agents?: string[] | null
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          caption: string | null
          client_id: string
          contact_id: string
          conversation_id: string | null
          created_at: string
          file_name: string | null
          from_me: boolean | null
          id: string
          internal_note: boolean | null
          media_url: string | null
          message_id: string | null
          metadata: Json | null
          reply_to: string | null
          sender_name: string | null
          status: string | null
          text: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          caption?: string | null
          client_id: string
          contact_id: string
          conversation_id?: string | null
          created_at?: string
          file_name?: string | null
          from_me?: boolean | null
          id?: string
          internal_note?: boolean | null
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          reply_to?: string | null
          sender_name?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          caption?: string | null
          client_id?: string
          contact_id?: string
          conversation_id?: string | null
          created_at?: string
          file_name?: string | null
          from_me?: boolean | null
          id?: string
          internal_note?: boolean | null
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          reply_to?: string | null
          sender_name?: string | null
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
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_tags: {
        Row: {
          client_id: string
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          client_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          client_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          business_name: string | null
          created_at: string | null
          email: string | null
          federal_id: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo: string | null
          plan_id: string | null
          settings: Json | null
          temporary_password: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          federal_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo?: string | null
          plan_id?: string | null
          settings?: Json | null
          temporary_password?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          federal_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo?: string | null
          plan_id?: string | null
          settings?: Json | null
          temporary_password?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
          contact_id: string | null
          contact_name: string | null
          contact_phone: string | null
          conversation_id: string | null
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
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
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
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
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
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "chat_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
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
      module_embeds: {
        Row: {
          created_at: string | null
          embed_url: string
          id: string
          module_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embed_url: string
          id?: string
          module_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embed_url?: string
          id?: string
          module_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_embeds_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_menu_visible: boolean | null
          menu_group: string | null
          module_type: string | null
          name: string
          route: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_menu_visible?: boolean | null
          menu_group?: string | null
          module_type?: string | null
          name: string
          route?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_menu_visible?: boolean | null
          menu_group?: string | null
          module_type?: string | null
          name?: string
          route?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_modules: {
        Row: {
          created_at: string
          module_id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          module_id: string
          plan_id: string
        }
        Update: {
          created_at?: string
          module_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          price_annual: number | null
          price_quarterly: number | null
          price_semiannual: number | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          price_annual?: number | null
          price_quarterly?: number | null
          price_semiannual?: number | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          price_annual?: number | null
          price_quarterly?: number | null
          price_semiannual?: number | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          cod_agent: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          use_custom_permissions: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          cod_agent?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          use_custom_permissions?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          cod_agent?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          use_custom_permissions?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_providers: {
        Row: {
          client_id: string
          created_at: string
          evo_apikey: string | null
          evo_url: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          evo_apikey?: string | null
          evo_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          provider_type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          evo_apikey?: string | null
          evo_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      queues: {
        Row: {
          channel_type: string
          client_id: string
          created_at: string
          deleted_at: string | null
          evo_apikey: string | null
          evo_instance: string | null
          evo_url: string | null
          hub: string | null
          id: string
          is_active: boolean
          is_deleted: boolean
          metadata: Json | null
          name: string
          phone_number: string | null
          updated_at: string
          waba_id: string | null
          waba_number_id: string | null
          waba_token: string | null
        }
        Insert: {
          channel_type?: string
          client_id: string
          created_at?: string
          deleted_at?: string | null
          evo_apikey?: string | null
          evo_instance?: string | null
          evo_url?: string | null
          hub?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          metadata?: Json | null
          name: string
          phone_number?: string | null
          updated_at?: string
          waba_id?: string | null
          waba_number_id?: string | null
          waba_token?: string | null
        }
        Update: {
          channel_type?: string
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          evo_apikey?: string | null
          evo_instance?: string | null
          evo_url?: string | null
          hub?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          metadata?: Json | null
          name?: string
          phone_number?: string | null
          updated_at?: string
          waba_id?: string | null
          waba_number_id?: string | null
          waba_token?: string | null
        }
        Relationships: []
      }
      role_default_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_default_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
      app_role:
        | "admin"
        | "manager"
        | "agent"
        | "user"
        | "superadmin"
        | "time"
        | "colaborador"
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
      app_role: [
        "admin",
        "manager",
        "agent",
        "user",
        "superadmin",
        "time",
        "colaborador",
      ],
    },
  },
} as const
