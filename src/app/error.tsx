"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error boundary caught an error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="px-6 py-2">
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" className="px-6 py-2">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}