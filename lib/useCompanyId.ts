'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCompanyId() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!alive) return;
      if (error) { console.error('Erro memberships:', error); setLoading(false); return; }
      setCompanyId(data?.company_id ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { companyId, loading };
}