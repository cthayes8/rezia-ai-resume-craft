"use client";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { FileText, History, Settings, LogOut, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from '@clerk/nextjs';

export type SidebarLink = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const DashboardSidebar = () => {
  const pathname = usePathname();
  const links: SidebarLink[] = [
    {
      icon: FileText,
      label: "Optimize",
      href: "/dashboard/optimize",
    },
    {
      icon: History,
      label: "History",
      href: "/dashboard/history",
    },
    {
      icon: Bookmark,
      label: "Saved Resumes",
      href: "/dashboard/saved",
    },
    {
      icon: Settings,
      label: "My Account",
      href: "/dashboard/account",
    },
  ];

  const { signOut } = useClerk();
  return (
    <div className="hidden lg:block h-screen w-64 bg-white border-r border-gray-200">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center">
          <img
            src="/Rezia_Logo_long.png"
            alt="Rezia Logo"
            className="h-10 w-auto"
          />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-rezia-blue text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
