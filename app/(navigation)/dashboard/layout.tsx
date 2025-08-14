import SideBar from '@/components/ui/SideBar';
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <SideBar />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto bg-teal-100">
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
