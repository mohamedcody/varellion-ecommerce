'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureUtmParameters } from '@/lib/utm';

function UtmTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchString = searchParams ? searchParams.toString() : '';
    if (searchString) {
      captureUtmParameters(`?${searchString}`);
    }
  }, [searchParams]);

  return null;
}

export function UtmTracker() {
  return (
    <Suspense fallback={null}>
      <UtmTrackerInner />
    </Suspense>
  );
}
