"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserJobs } from '@/lib/supabase/jobs';
import { supabase } from '@/lib/supabase/client';

interface JobsContextType {
  jobs: any[];
  loading: boolean;
  refreshJobs: () => Promise<void>;
  setJobs: (jobs: any[]) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const refreshJobs = async (targetUserId?: string) => {
    const userId = targetUserId || user?.id;
    if (!userId) return;
    try {
      const list = await getUserJobs(userId);
      setJobs(list);
    } catch (error) {
      console.error('Error refreshing jobs:', error);
    }
  };

  // Initialize user and jobs
  useEffect(() => {
    const initializeJobs = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await refreshJobs(currentUser.id);
      }
      setLoading(false);
    };

    initializeJobs();
  }, []);

  // Update user when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser && event === 'SIGNED_IN') {
        await refreshJobs();
      } else if (event === 'SIGNED_OUT') {
        setJobs([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh jobs every 10 seconds when there are pending/processing jobs
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      // Only poll if there are jobs in progress
      if (jobs.some(j => j.status === 'pending' || j.status === 'processing')) {
        await refreshJobs();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, jobs]);

  return (
    <JobsContext.Provider value={{
      jobs,
      loading,
      refreshJobs,
      setJobs
    }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}
