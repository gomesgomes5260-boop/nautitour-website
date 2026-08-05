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
      admins: {
        Row: {
          created_at: string
          created_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: Json
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          og_image_url: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: Json
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: Json
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          actor_user_id: string | null
          booking_id: string
          created_at: string
          id: string
          kind: string
          payload: Json | null
        }
        Insert: {
          actor_user_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          kind: string
          payload?: Json | null
        }
        Update: {
          actor_user_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_passengers: {
        Row: {
          birth_date: string | null
          booking_id: string
          created_at: string
          document: string | null
          full_name: string
          id: string
          is_child: boolean
        }
        Insert: {
          birth_date?: string | null
          booking_id: string
          created_at?: string
          document?: string | null
          full_name: string
          id?: string
          is_child?: boolean
        }
        Update: {
          birth_date?: string | null
          booking_id?: string
          created_at?: string
          document?: string | null
          full_name?: string
          id?: string
          is_child?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_paid_cents: number
          booking_code: string
          checked_in_at: string | null
          checked_in_by: string | null
          confirmation_email_sent_at: string | null
          created_at: string
          currency: string
          customer_id: string
          expires_at: string | null
          id: string
          manual_payment_method: string | null
          needs_pickup: boolean
          notes: string | null
          passenger_count: number
          payment_link_token: string | null
          pickup_address: string | null
          pickup_room: string | null
          reminder_sent_at: string | null
          review_request_sent_at: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_cents: number
          tour_id: string
          tour_schedule_id: string | null
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          booking_code?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          confirmation_email_sent_at?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          manual_payment_method?: string | null
          needs_pickup?: boolean
          notes?: string | null
          passenger_count: number
          payment_link_token?: string | null
          pickup_address?: string | null
          pickup_room?: string | null
          reminder_sent_at?: string | null
          review_request_sent_at?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_cents: number
          tour_id: string
          tour_schedule_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          booking_code?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          confirmation_email_sent_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          manual_payment_method?: string | null
          needs_pickup?: boolean
          notes?: string | null
          passenger_count?: number
          payment_link_token?: string | null
          pickup_address?: string | null
          pickup_room?: string | null
          reminder_sent_at?: string | null
          review_request_sent_at?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_cents?: number
          tour_id?: string
          tour_schedule_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tour_schedule_id_fkey"
            columns: ["tour_schedule_id"]
            isOneToOne: false
            referencedRelation: "tour_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          auth_user_id: string | null
          cpf: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_guest: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_guest?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_guest?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      embarkation_piers: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          fee_cents: number
          google_maps_url: string | null
          id: string
          is_default: boolean | null
          name: string
          notes: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          fee_cents?: number
          google_maps_url?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          notes?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          fee_cents?: number
          google_maps_url?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          notes?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inquiry_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string
          end_time: string | null
          id: string
          interested_in_open_bar: boolean
          message: string | null
          passenger_count: number | null
          requested_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          tour_id: string
          updated_at: string
          whatsapp_contacted_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id: string
          end_time?: string | null
          id?: string
          interested_in_open_bar?: boolean
          message?: string | null
          passenger_count?: number | null
          requested_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          tour_id: string
          updated_at?: string
          whatsapp_contacted_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string
          end_time?: string | null
          id?: string
          interested_in_open_bar?: boolean
          message?: string | null
          passenger_count?: number | null
          requested_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          tour_id?: string
          updated_at?: string
          whatsapp_contacted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_requests_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_invitations: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          source: string | null
          token: string
          used_at: string | null
          recovery_email_sent_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          source?: string | null
          token: string
          used_at?: string | null
          recovery_email_sent_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          source?: string | null
          token?: string
          used_at?: string | null
          recovery_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_invitations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          id: string
          pagarme_charge_id: string | null
          pagarme_order_id: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          raw_response: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          id?: string
          pagarme_charge_id?: string | null
          pagarme_order_id?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          id?: string
          pagarme_charge_id?: string | null
          pagarme_order_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          hits: number
          key: string
          window_started_at: string
        }
        Insert: {
          hits?: number
          key: string
          window_started_at?: string
        }
        Update: {
          hits?: number
          key?: string
          window_started_at?: string
        }
        Relationships: []
      }
      schedule_templates: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          departure_time: string
          id: string
          price_cents: number | null
          tour_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          capacity: number
          created_at?: string
          departure_time: string
          id?: string
          price_cents?: number | null
          tour_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          departure_time?: string
          id?: string
          price_cents?: number | null
          tour_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      site_image_usage: {
        Row: {
          last_used_at: string
          path: string
          times_used: number
        }
        Insert: {
          last_used_at?: string
          path: string
          times_used?: number
        }
        Update: {
          last_used_at?: string
          path?: string
          times_used?: number
        }
        Relationships: []
      }
      seller_payouts: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          e2e_id: string | null
          error: string | null
          id: string
          pix_key: string | null
          seller_id: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          e2e_id?: string | null
          error?: string | null
          id?: string
          pix_key?: string | null
          seller_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          e2e_id?: string | null
          error?: string | null
          id?: string
          pix_key?: string | null
          seller_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          active: boolean
          agency_id: string | null
          created_at: string
          full_name: string
          id: string
          neto_value_cents: number
          phone: string | null
          pix_key: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          agency_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          neto_value_cents?: number
          phone?: string | null
          pix_key?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          agency_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          neto_value_cents?: number
          phone?: string | null
          pix_key?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_schedules: {
        Row: {
          capacity: number
          created_at: string
          departure_at: string
          embarkation_pier_id: string
          id: string
          price_cents: number | null
          seats_taken: number
          status: Database["public"]["Enums"]["schedule_status"]
          tour_id: string
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          departure_at: string
          embarkation_pier_id: string
          id?: string
          price_cents?: number | null
          seats_taken?: number
          status?: Database["public"]["Enums"]["schedule_status"]
          tour_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          departure_at?: string
          embarkation_pier_id?: string
          id?: string
          price_cents?: number | null
          seats_taken?: number
          status?: Database["public"]["Enums"]["schedule_status"]
          tour_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_schedules_embarkation_pier_id_fkey"
            columns: ["embarkation_pier_id"]
            isOneToOne: false
            referencedRelation: "embarkation_piers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_schedules_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          active: boolean
          base_price_cents: number | null
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number | null
          gallery: string[]
          highlights: Json
          id: string
          is_test_only: boolean
          max_capacity: number | null
          name: string
          slug: string
          tour_type: Database["public"]["Enums"]["tour_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price_cents?: number | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          gallery?: string[]
          highlights?: Json
          id?: string
          is_test_only?: boolean
          max_capacity?: number | null
          name: string
          slug: string
          tour_type: Database["public"]["Enums"]["tour_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price_cents?: number | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          gallery?: string[]
          highlights?: Json
          id?: string
          is_test_only?: boolean
          max_capacity?: number | null
          name?: string
          slug?: string
          tour_type?: Database["public"]["Enums"]["tour_type"]
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_clicks: {
        Row: {
          clicked_at: string
          id: string
          source: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          source: string
        }
        Update: {
          clicked_at?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      admins_with_email: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_email: string | null
          email: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_add_admin_by_email: {
        Args: { p_email: string; p_role?: string }
        Returns: string
      }
      admin_cancel_booking: {
        Args: { p_booking_id: string; p_reason: string }
        Returns: undefined
      }
      admin_check_in_booking: {
        Args: { p_booking_code: string }
        Returns: {
          booking_id: string
          first_checkin: boolean
        }[]
      }
      admin_convert_inquiry_to_booking: {
        Args: {
          p_departure_at: string
          p_inquiry_id: string
          p_price_cents: number
        }
        Returns: {
          booking_code: string
          booking_id: string
          payment_link_token: string
        }[]
      }
      admin_create_schedule_template: {
        Args: {
          p_capacity: number
          p_departure_time: string
          p_price_cents?: number
          p_tour_id: string
          p_weekday: number
        }
        Returns: string
      }
      admin_create_tour_schedule: {
        Args: {
          p_capacity: number
          p_departure_at: string
          p_pier_slug?: string
          p_price_cents?: number
          p_status?: string
          p_tour_id: string
        }
        Returns: string
      }
      admin_delete_schedule_template: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      admin_delete_tour_schedule: {
        Args: { p_force?: boolean; p_schedule_id: string }
        Returns: number
      }
      admin_mark_refund_attempt: {
        Args: {
          p_booking_id: string
          p_charge_id: string
          p_ok: boolean
          p_response: Json
        }
        Returns: undefined
      }
      admin_remove_admin: { Args: { p_user_id: string }; Returns: undefined }
      admin_set_embarkation_pier: {
        Args: { p_pier_slug: string; p_schedule_id: string }
        Returns: undefined
      }
      admin_update_inquiry: {
        Args: {
          p_admin_notes?: string
          p_inquiry_id: string
          p_status?: Database["public"]["Enums"]["inquiry_status"]
        }
        Returns: undefined
      }
      admin_update_schedule_template: {
        Args: {
          p_active?: boolean
          p_capacity?: number
          p_departure_time?: string
          p_price_cents?: number
          p_template_id: string
          p_weekday?: number
        }
        Returns: undefined
      }
      admin_update_tour_pricing: {
        Args: {
          p_apply_to_future_schedules?: boolean
          p_base_price_cents?: number
          p_max_capacity?: number
          p_tour_id: string
        }
        Returns: number
      }
      admin_update_tour_schedule: {
        Args: {
          p_capacity?: number
          p_departure_at?: string
          p_price_cents?: number
          p_schedule_id: string
          p_status?: string
        }
        Returns: {
          affected_booking_code: string
          affected_booking_id: string
          customer_email: string
          new_departure_at: string
          old_departure_at: string
        }[]
      }
      block_schedule: {
        Args: { p_reason: string; p_schedule_id: string }
        Returns: number
      }
      claim_seller_payout: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_pix_key?: string
          p_seller_id: string
        }
        Returns: boolean
      }
      confirm_booking_payment: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_pagarme_charge_id: string
          p_pagarme_order_id: string
          p_paid_at: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_raw_response: Json
        }
        Returns: undefined
      }
      confirm_booking_payment_v2: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_pagarme_charge_id: string
          p_pagarme_order_id: string
          p_paid_at: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_raw_response: Json
        }
        Returns: boolean
      }
      create_booking_pending: {
        Args: {
          p_cpf?: string
          p_email: string
          p_full_name: string
          p_notes?: string
          p_passengers?: Json
          p_phone: string
          p_schedule_id: string
        }
        Returns: {
          booking_code: string
          booking_id: string
          total_cents: number
        }[]
      }
      create_inquiry_request: {
        Args: {
          p_email: string
          p_end_time: string
          p_full_name: string
          p_interested_in_open_bar?: boolean
          p_message?: string
          p_passenger_count: number
          p_phone: string
          p_requested_date: string
          p_start_time: string
        }
        Returns: {
          inquiry_id: string
        }[]
      }
      create_lead_invitation: {
        Args: {
          p_email: string
          p_full_name?: string
          p_phone?: string
          p_source?: string
        }
        Returns: {
          token: string
          was_new: boolean
        }[]
      }
      customer_cancel_booking: {
        Args: { p_booking_id: string; p_reason: string }
        Returns: undefined
      }
      ensure_escuna_schedules: {
        Args: { p_days_ahead?: number }
        Returns: number
      }
      expire_pending_bookings: { Args: never; Returns: number }
      gen_booking_code: { Args: never; Returns: string }
      generate_future_schedules: {
        Args: { p_days_ahead?: number }
        Returns: number
      }
      get_booking_by_code: {
        Args: { p_code: string }
        Returns: {
          booking_code: string
          created_at: string
          currency: string
          customer_email: string
          customer_full_name: string
          departure_at: string
          passenger_count: number
          status: Database["public"]["Enums"]["booking_status"]
          total_cents: number
          tour_name: string
          tour_slug: string
        }[]
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_seller: { Args: { p_user_id: string }; Returns: boolean }
      rate_limit_check: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      mark_booking_payment_failed: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_pagarme_charge_id: string
          p_pagarme_order_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_raw_response: Json
          p_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      seller_create_booking: {
        Args: {
          p_amount_paid_cents?: number
          p_customer_email?: string
          p_customer_name: string
          p_customer_phone: string
          p_manual_payment_method?: string
          p_needs_pickup?: boolean
          p_notes?: string
          p_passengers?: Json
          p_pickup_address?: string
          p_pickup_room?: string
          p_schedule_id: string
        }
        Returns: {
          booking_code: string
          booking_id: string
          total_cents: number
        }[]
      }
      seller_id_for: { Args: { p_user_id: string }; Returns: string }
    }
    Enums: {
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "refunded"
      inquiry_status: "new" | "contacted" | "won" | "lost"
      payment_method: "pix" | "credit_card" | "boleto"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "expired"
      schedule_status: "open" | "sold_out" | "cancelled"
      tour_type: "scheduled" | "private" | "inquiry"
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
      booking_status: [
        "pending_payment",
        "confirmed",
        "cancelled",
        "completed",
        "refunded",
      ],
      inquiry_status: ["new", "contacted", "won", "lost"],
      payment_method: ["pix", "credit_card", "boleto"],
      payment_status: ["pending", "paid", "failed", "refunded", "expired"],
      schedule_status: ["open", "sold_out", "cancelled"],
      tour_type: ["scheduled", "private", "inquiry"],
    },
  },
} as const
