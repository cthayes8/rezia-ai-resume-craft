import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AccountPage from '@/components/dashboard/AccountPage';

/**
 * /dashboard/account - custom account overview page
 */
export default function DashboardAccount() {
  return (
    <DashboardLayout>
      <AccountPage />
    </DashboardLayout>
  );
}