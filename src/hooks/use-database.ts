import { useEffect, useState } from 'react';

import { getDatabase } from '@/db';

export type DatabaseStatus = 'loading' | 'ready' | 'error';

/**
 * Opens + migrates the database once on mount and reports readiness. The UI tree
 * (tabs/screens) should gate on `'ready'` so no screen queries before migrations
 * have run. The underlying connection is a module singleton, so mounting this in
 * multiple places is cheap — they all await the same promise.
 */
export function useDatabaseReady(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    getDatabase()
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((error) => {
        if (!cancelled) setStatus('error');
        console.error('[DailyFlow] Database failed to initialize:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
