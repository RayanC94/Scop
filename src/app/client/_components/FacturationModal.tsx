'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, File, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Company, Request } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface FacturationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequests: Request[];
  type: 'devis' | 'facture';
}

export default function FacturationModal({ open, onOpenChange, selectedRequests, type }: FacturationModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('own_name');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setSuccess('');
      setLoading(false);
      setSelectedCompanyId('own_name');
      setFormat('pdf');

      const fetchInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const { data: companyData } = await supabase.from('companies').select('*').eq('user_id', user.id);
          if (companyData) setCompanies(companyData);
        }
      };
      fetchInitialData();
    }
  }, [open]);
  
  const calculateTotalPrice = () => {
    return selectedRequests.reduce((total, request) => {
        if (request && request.offers) {
            const visibleOffers = request.offers.filter(offer => offer.is_visible_to_client);
            visibleOffers.forEach(offer => {
                total += (offer.unit_price_rmb / offer.exchange_rate) * request.quantity;
            });
        }
        return total;
    }, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!currentUser) {
        setError("Impossible de vérifier l'utilisateur. Veuillez vous reconnecter.");
        setLoading(false);
        return;
    }

    if (type === 'devis') {
      console.log('Génération du devis en format', format);
      alert('La génération de PDF/Excel sera implémentée ici.');
      setSuccess('Le téléchargement de votre devis va commencer.');

    } else if (type === 'facture') {
      const requestData = {
          user_id: currentUser.id,
          company_id: selectedCompanyId === 'own_name' ? null : selectedCompanyId,
          format: format,
          request_ids: selectedRequests.map(r => r.id),
          total_price: calculateTotalPrice(),
          status: 'pending',
      };

      const { error: insertError } = await supabase
        .from('invoice_requests')
        .insert(requestData);

      if (insertError) {
        setError(`Une erreur est survenue : ${insertError.message}`);
        console.error("Erreur d'insertion Supabase:", insertError);
      } else {
        setSuccess('Votre demande de facture a bien été envoyée à votre agent.');
      }
    }

    setLoading(false);
    setTimeout(() => {
        if (!error) onOpenChange(false);
    }, 2000);
  };

  const title = type === 'devis' ? 'Télécharger un devis' : 'Demander une facture';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50">
          <Dialog.Title className="text-lg font-bold mb-4">{title}</Dialog.Title>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium">Adresser à :</label>
              <select 
                value={selectedCompanyId} 
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white"
                disabled={companies.length === 0}
              >
                <option value="own_name">Mon nom propre</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              {companies.length === 0 && <p className="text-xs text-gray-500 mt-1">Aucune compagnie enregistrée. Le document sera à votre nom.</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Format de sortie :</label>
              <div className="flex gap-4 mt-2">
                <button onClick={() => setFormat('pdf')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border-2 ${format === 'pdf' ? 'border-black bg-gray-100' : 'hover:bg-gray-50'}`}>
                  <FileText className="h-5 w-5" /> PDF
                </button>
                <button onClick={() => setFormat('excel')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border-2 ${format === 'excel' ? 'border-black bg-gray-100' : 'hover:bg-gray-50'}`}>
                  <File className="h-5 w-5" /> Excel
                </button>
              </div>
            </div>
          </div>
          
          {success && <p className="text-green-600 text-sm mt-4 text-center">{success}</p>}
          {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

          <div className="flex justify-end pt-6 mt-6 border-t">
            <button 
              onClick={handleSubmit} 
              disabled={loading || !!success}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Traitement...' : 'Confirmer'}
            </button>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}