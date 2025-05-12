"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Dashboard landing: redirect to Optimize page
 */
export default function DashboardHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/optimize');
  }, [router]);
  return null;
}