"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  userRole?: string;
  userName?: string;
}

export default function AppShell({ children, title, userRole, userName }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} userName={userName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
