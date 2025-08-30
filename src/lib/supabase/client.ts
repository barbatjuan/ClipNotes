"use client";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Tipos de tablas de la base de datos
export type Tables = {
  profiles: {
    Row: {
      user_id: string;
      plan_tier: 'free' | 'pro';
      minutes_processed_current_month: number;
      monthly_minutes_limit: number;
      created_at: string;
      updated_at: string;
    };
  };
  jobs: {
    Row: {
      id: string;
      user_id: string;
      input_url: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      audio_duration: number | null;
      raw_transcription: string | null;
      ai_summary: string | null;
      created_at: string;
      updated_at: string;
    };
  };
};
