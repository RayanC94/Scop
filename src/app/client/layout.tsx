// src/app/client/layout.tsx
import React from 'react';
import SidebarLeft from './_components/SidebarLeft';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <SidebarLeft />
      {/* La balise <main> est maintenant un conteneur flex horizontal */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
