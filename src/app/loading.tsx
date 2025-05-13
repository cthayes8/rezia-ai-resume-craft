"use client";
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
    </div>
  );
}