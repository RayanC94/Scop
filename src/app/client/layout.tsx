// src/app/client/layout.tsx
import React from 'react';
import SidebarLeft from './_components/SidebarLeft';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <SidebarLeft />
      {/* La balise <main> prend maintenant tout l'espace restant */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
