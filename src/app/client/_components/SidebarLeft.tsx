'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LayoutDashboard, FileText, ShoppingCart, Archive, Trash2, Building, LogOut } from 'lucide-react';

const SidebarLeft = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } else {
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/invoices', label: 'Factures', icon: FileText },
    { href: '/client/tracking', label: 'Suivi commande', icon: ShoppingCart },
    { href: '#', label: 'Archives', icon: Archive },
    { href: '#', label: 'Corbeille', icon: Trash2 },
    { href: '/client/companies', label: 'Compagnies', icon: Building },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <h1 className="text-2xl font-bold text-blue-600 mb-8">SCOP</h1>
      <nav className="flex flex-col space-y-2 flex-grow">
        {navLinks.map(link => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <a 
              key={link.label} 
              href={link.href} 
              className={`flex items-center p-2 rounded-md ${
                isActive 
                  ? 'bg-gray-100 text-gray-900 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" /> {link.label}
            </a>
          );
        })}
      </nav>
      
      <div className="mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-md font-semibold"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default SidebarLeft;