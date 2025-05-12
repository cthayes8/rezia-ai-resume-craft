import dynamic from 'next/dynamic';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
// Dynamically import Clerk's UserProfile (client-side only)
const UserProfile = dynamic(
  () => import('@clerk/nextjs').then(mod => mod.UserProfile),
  { ssr: false }
);
import { PricingTable } from '@clerk/nextjs';

/**
 * Catch-all route for /dashboard/account and its sub-paths:
 * Renders Clerk's UserProfile with path-based routing
 */
export default function DashboardAccount() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-screen-lg mx-auto">
      <UserProfile
        routing="path"
        appearance={{ elements: { rootBox: "w-full" } }}
      />
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Choose a Plan</h2>
        <PricingTable />
      </div>
      </div>
    </DashboardLayout>
  );
}