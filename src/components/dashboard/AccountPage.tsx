"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Dynamically load Clerk's UserProfile for profile management
const UserProfile = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.UserProfile),
  { ssr: false }
);
export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState<{ tierLabel: string; status: string; currentPeriodEnd: string } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    // Fetch subscription status
    fetch('/api/me/subscription')
      .then(res => res.json())
      .then(data => setSubscription(data.subscription))
      .catch(err => toast({ title: 'Error', description: 'Unable to load subscription', variant: 'destructive' }));
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="max-w-screen-lg mx-auto space-y-8 py-4">
      {/* Profile section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
        <p className="mb-2"><strong>Name:</strong> {user?.fullName || user?.firstName}</p>
        <p className="mb-4"><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
        <Button onClick={() => setEditingProfile(true)}>Manage Account</Button>
        {editingProfile && (
          <div className="mt-6">
            <UserProfile routing="path" appearance={{ elements: { rootBox: 'w-full' } }} />
          </div>
        )}
      </section>

      {/* Subscription section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Subscription</h2>
        {subscription ? (
          <div className="space-y-2">
            <p><strong>Plan:</strong> {subscription.tierLabel}</p>
            <p><strong>Status:</strong> {subscription.status}</p>
            <p><strong>Next Billing:</strong> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            <Button onClick={() => window.location.href = '/api/stripe/portal'}>Manage Subscription</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p>You are currently on the Free plan.</p>
            <Button onClick={() => router.push('/choose-plan')}>Upgrade Plan</Button>
          </div>
        )}
      </section>

    </div>
  );
}