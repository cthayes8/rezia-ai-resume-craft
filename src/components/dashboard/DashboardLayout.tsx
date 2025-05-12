"use client";
import React from "react";
import DashboardSidebar from "./DashboardSidebar";
import MobileSidebar from "./MobileSidebar";
import { useUser } from "@clerk/nextjs";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useUser();
  // Fallback to empty if no user
  const fullName = user?.fullName || user?.firstName || "";
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex-1">
          <div className="p-4 lg:px-6 border-b bg-white">
            <div className="flex justify-between items-center">
              <div className="lg:hidden">
                <MobileSidebar />
              </div>
              <div className="ml-auto flex items-center">
                {fullName && (
                  <span className="text-sm font-medium text-gray-700">
                    {fullName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;