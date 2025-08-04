// src/app/agent/companies/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2 } from 'lucide-react';
// Nous allons créer ces deux composants juste après
import AgentCompanyFormModal from '../_components/AgentCompanyFormModal';
import ConfirmDeleteModal from '@/app/client/_components/ConfirmDeleteModal'; 

// Définir un type pour les compagnies de l'agent
type AgentCompany = {
  id: string;
  company_name: string | null;
  email: string | null;
  address: string | null;
};

export default function AgentCompaniesPage() {
  const [companies, setCompanies] = useState<AgentCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<AgentCompany | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<AgentCompany | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('agent_companies').select('*').eq('agent_id', user.id).order('company_name');
    if (error) {
      console.error('Erreur:', error);
    } else {
      setCompanies(data as AgentCompany[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenModal = (company: AgentCompany | null) => {
    setCompanyToEdit(company);
    setIsModalOpen(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    const { error } = await supabase.from('agent_companies').delete().eq('id', companyToDelete.id);
    if (error) {
      console.error("Erreur de suppression:", error);
    } else {
      setCompanyToDelete(null);
      fetchCompanies();
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement...</div>;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Mes Compagnies de Facturation</h1>
          <button onClick={() => handleOpenModal(null)} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center font-semibold">
            <Plus className="h-5 w-5 mr-2" /> Ajouter une compagnie
          </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {companies.map((company) => (
            <div key={company.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
              <div>
                <p className="font-bold">{company.company_name || company.email}</p>
                <p className="text-sm text-gray-500">{company.address}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleOpenModal(company)} className="p-2 text-gray-500 hover:text-black rounded-md hover:bg-gray-100">
                  <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => setCompanyToDelete(company)} className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <p className="p-6 text-center text-gray-500">Aucune compagnie enregistrée.</p>
          )}
        </div>
      </div>

      <AgentCompanyFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        companyToEdit={companyToEdit}
        onSaveSuccess={fetchCompanies}
      />
      <ConfirmDeleteModal
        open={!!companyToDelete}
        onOpenChange={() => setCompanyToDelete(null)}
        onConfirm={handleDeleteCompany}
      />
    </div>
  );
}