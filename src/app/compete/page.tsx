'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JoinHeatScreen } from '@/components/competition';
import { supabase } from '@/lib/supabase/client';
import { createHeatEngine } from '@/lib/competition/heat-engine';

export default function JoinHeatPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const engine = createHeatEngine(supabase);
      await engine.joinHeat(code);
      router.push(`/compete/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join Heat');
    } finally {
      setIsLoading(false);
    }
  };

  return <JoinHeatScreen onJoin={handleJoin} isLoading={isLoading} error={error} />;
}