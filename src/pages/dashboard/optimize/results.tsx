
// Force this page to be server-side rendered to avoid Next.js prefetch JSON errors
export async function getServerSideProps() {
  return { props: {} };
}
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ResumeViewer from "@/components/dashboard/ResumeViewer";

const DashboardResults = () => {
  return (
    <DashboardLayout>
      <ResumeViewer />
    </DashboardLayout>
  );
};

export default DashboardResults; 