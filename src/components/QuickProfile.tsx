"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const QuickProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan_tier')
          .eq('user_id', data.session.user.id)
          .single();
        if (!mounted) return;
        setProfile(profileData);
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('plan_tier')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data))
          .catch(() => {});
      } else {
        setProfile(null);
      }
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // If there's no authenticated user, show a small call-to-action so
  // the top-right area doesn't remain empty. This helps during dev and
  // for users that are not logged in yet.
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 text-sm text-secondary-700 dark:text-secondary-300">
      <div className="flex flex-col text-right">
        <span className="font-semibold">{user.email}</span>
        <span className="text-xs text-secondary-500">{profile?.plan_tier ? `Plan ${profile.plan_tier}` : 'Plan Activo'}</span>
      </div>
    </div>
  );
};

export default QuickProfile;
