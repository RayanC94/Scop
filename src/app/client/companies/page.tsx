'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Company } from '@/types';
import CompanyFormModal from '../_components/CompanyFormModal';
import ConfirmDeleteModal from '../_components/ConfirmDeleteModal';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) {
      console.error('Erreur:', error);
    } else {
      setCompanies(data as Company[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenModal = (company: Company | null) => {
    setCompanyToEdit(company);
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (companyToEdit) {
      // Mise à jour
      const { error } = await supabase.from('companies').update(companyData).eq('id', companyToEdit.id);
      if (error) console.error("Erreur de mise à jour:", error);
    } else {
      // Création, en ajoutant l'user_id
      const { error } = await supabase.from('companies').insert({ ...companyData, user_id: user.id });
      if (error) console.error("Erreur d'insertion:", error);
    }
    fetchCompanies();
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    const { error } = await supabase.from('companies').delete().eq('id', companyToDelete.id);
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
          <h1 className="text-3xl font-bold">Mes Compagnies</h1>
          <button onClick={() => handleOpenModal(null)} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center font-semibold">
            <Plus className="h-5 w-5 mr-2" /> Ajouter une compagnie
          </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {companies.map((company) => (
            <div key={company.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
              <div>
                <p className="font-bold">{company.name}</p>
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

      <CompanyFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveCompany}
        companyToEdit={companyToEdit}
      />
      <ConfirmDeleteModal
        open={!!companyToDelete}
        onOpenChange={() => setCompanyToDelete(null)}
        onConfirm={handleDeleteCompany}
      />
    </div>
  );
}