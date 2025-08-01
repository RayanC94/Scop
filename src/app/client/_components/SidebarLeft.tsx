import React from 'react';
import { LayoutDashboard, FileText, ShoppingCart, Archive, Trash2, Building } from 'lucide-react';

const SidebarLeft = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <h1 className="text-2xl font-bold text-blue-600 mb-8">SCOP</h1>
      <nav className="flex flex-col space-y-2">
        <a href="/client/dashboard" className="flex items-center p-2 text-gray-700 bg-gray-100 rounded-md">
          <LayoutDashboard className="h-5 w-5 mr-3" /> Dashboard
        </a>
        <a href="#" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <FileText className="h-5 w-5 mr-3" /> Factures
        </a>
        <a href="#" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <ShoppingCart className="h-5 w-5 mr-3" /> Suivi commande
        </a>
        <a href="#" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Archive className="h-5 w-5 mr-3" /> Archives
        </a>
         <a href="#" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Trash2 className="h-5 w-5 mr-3" /> Corbeille
        </a>
         <a href="#" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Building className="h-5 w-5 mr-3" /> Compagnies
        </a>
      </nav>
      <div className="mt-auto">
        {/* Espace pour le profil utilisateur plus tard */}
      </div>
    </aside>
  );
};

export default SidebarLeft;