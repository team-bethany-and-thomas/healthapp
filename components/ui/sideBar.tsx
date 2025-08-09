"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  PanelTop,
  CalendarCheck2,
  BookPlus,
  MessageSquareText,
  FileText,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface sideItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

const sideItems: sideItem[] = [
  {
    name: "Overview",
    icon: <PanelTop className="h-4 w-4" />,
    path: "/dashboard",
  },
  {
    name: "Appointments",
    icon: <CalendarCheck2 className="h-4 w-4" />,
    path: "/dashboard/appointments",
  },
  {
    name: "Forms",
    icon: <BookPlus className="h-4 w-4" />,
    path: "/dashboard/forms",
  },
  // {
  //   name: "Messages",
  //   icon: <MessageSquareText className="h-4 w-4" />,
  //   path: "/dashboard/messages",
  // },
  {
    name: "File Manager",
    icon: <FileText className="h-4 w-4" />,
    path: "/dashboard/fileManager",
  },
];

const SideBar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div
        className={`h-screen bg-slate-100 text-stone-950 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-4">
          {!collapsed}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-stone-950 focus:outline-none"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 mt-4 space-y-2">
          {sideItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`
                  flex items-center space-x-4 px-4 py-2
                  ${isActive ? "bg-primary text-white" : "hover:bg-gray-200"}
                  transition-colors
                `}
              >
                <span>{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};
export default SideBar;
