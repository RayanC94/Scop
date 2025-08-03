// src/app/agent/layout.tsx
import React from 'react';
import SidebarLeftAgent from './_components/SidebarLeftAgent';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <SidebarLeftAgent />
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
