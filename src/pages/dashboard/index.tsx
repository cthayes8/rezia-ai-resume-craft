import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import ResumeUpload from "@/components/dashboard/ResumeUpload";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex-1">
          <div className="p-4 lg:px-6 border-b bg-white">
            <div className="flex justify-between items-center">
              <div className="lg:hidden">
                <MobileSidebar />
              </div>
              <div className="ml-auto flex items-center">
                <span className="text-sm font-medium text-gray-700">John Doe</span>
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-6">
            <ResumeUpload />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 