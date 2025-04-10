export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          company_website: string
          crawling_date: string
          dominio: string
          id: number
        }
        Insert: {
          company_website: string
          crawling_date: string
          dominio: string
          id?: number
        }
        Update: {
          company_website?: string
          crawling_date?: string
          dominio?: string
          id?: number
        }
        Relationships: []
      }
      company_addresses: {
        Row: {
          address: string | null
          company_id: number | null
          id: number
        }
        Insert: {
          address?: string | null
          company_id?: number | null
          id?: number
        }
        Update: {
          address?: string | null
          company_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_emails: {
        Row: {
          company_id: number | null
          email: string | null
          id: number
        }
        Insert: {
          company_id?: number | null
          email?: string | null
          id?: number
        }
        Update: {
          company_id?: number | null
          email?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_output: {
        Row: {
          company_id: number | null
          id: number
          whatsapp: string | null
        }
        Insert: {
          company_id?: number | null
          id?: number
          whatsapp?: string | null
        }
        Update: {
          company_id?: number | null
          id?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_output_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_phones: {
        Row: {
          company_id: number | null
          id: number
          phone: string | null
        }
        Insert: {
          company_id?: number | null
          id?: number
          phone?: string | null
        }
        Update: {
          company_id?: number | null
          id?: number
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_phones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_social_media: {
        Row: {
          company_id: number | null
          id: number
          platform: string | null
        }
        Insert: {
          company_id?: number | null
          id?: number
          platform?: string | null
        }
        Update: {
          company_id?: number | null
          id?: number
          platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_social_media_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      domains_data_arg: {
        Row: {
          dominio: string | null
          fecha_registro: string | null
          id: number
          id_dominio: number | null
          numero_doc: string | null
          tipo: string | null
          tipo_doc: string | null
          titular: string | null
          zona: string | null
        }
        Insert: {
          dominio?: string | null
          fecha_registro?: string | null
          id?: number
          id_dominio?: number | null
          numero_doc?: string | null
          tipo?: string | null
          tipo_doc?: string | null
          titular?: string | null
          zona?: string | null
        }
        Update: {
          dominio?: string | null
          fecha_registro?: string | null
          id?: number
          id_dominio?: number | null
          numero_doc?: string | null
          tipo?: string | null
          tipo_doc?: string | null
          titular?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      domains_data_cl: {
        Row: {
          crawling_date: string | null
          crawling_status: string | null
          dominio: string | null
          error_message: string | null
          fecha_expiracion: string | null
          fecha_registro: string | null
          fecha_revision_init: string | null
          fecha_ultima_modificacion: string | null
          id: number
          id_dominio: number | null
          is_active: boolean | null
          last_crawling_date: string | null
          last_status_code: number | null
          numero_doc: string | null
          retries_count: number | null
          status_code_init: number | null
          tipo: string | null
          tipo_doc: string | null
          titular: string | null
          zona: string | null
        }
        Insert: {
          crawling_date?: string | null
          crawling_status?: string | null
          dominio?: string | null
          error_message?: string | null
          fecha_expiracion?: string | null
          fecha_registro?: string | null
          fecha_revision_init?: string | null
          fecha_ultima_modificacion?: string | null
          id?: number
          id_dominio?: number | null
          is_active?: boolean | null
          last_crawling_date?: string | null
          last_status_code?: number | null
          numero_doc?: string | null
          retries_count?: number | null
          status_code_init?: number | null
          tipo?: string | null
          tipo_doc?: string | null
          titular?: string | null
          zona?: string | null
        }
        Update: {
          crawling_date?: string | null
          crawling_status?: string | null
          dominio?: string | null
          error_message?: string | null
          fecha_expiracion?: string | null
          fecha_registro?: string | null
          fecha_revision_init?: string | null
          fecha_ultima_modificacion?: string | null
          id?: number
          id_dominio?: number | null
          is_active?: boolean | null
          last_crawling_date?: string | null
          last_status_code?: number | null
          numero_doc?: string | null
          retries_count?: number | null
          status_code_init?: number | null
          tipo?: string | null
          tipo_doc?: string | null
          titular?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      downloaded_csvs: {
        Row: {
          created_at: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          id: number
        }
        Update: {
          created_at?: string | null
          id?: number
        }
        Relationships: []
      }
      social_media_urls: {
        Row: {
          id: number
          social_media_id: number | null
          url: string
        }
        Insert: {
          id?: number
          social_media_id?: number | null
          url: string
        }
        Update: {
          id?: number
          social_media_id?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_urls_social_media_id_fkey"
            columns: ["social_media_id"]
            isOneToOne: false
            referencedRelation: "company_social_media"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
