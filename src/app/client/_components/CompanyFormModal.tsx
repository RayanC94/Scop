'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Company } from '@/types'; // Nous ajouterons ce type juste après

interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (companyData: Omit<Company, 'id' | 'created_at'>) => void;
  companyToEdit: Company | null;
}

export default function CompanyFormModal({ open, onOpenChange, onSave, companyToEdit }: CompanyFormModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name);
      setAddress(companyToEdit.address || '');
      setVatNumber(companyToEdit.vat_number || '');
      setCountry(companyToEdit.country || '');
    } else {
      // Réinitialiser le formulaire pour une nouvelle compagnie
      setName('');
      setAddress('');
      setVatNumber('');
      setCountry('');
    }
  }, [companyToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    await onSave({ name, address, vat_number: vatNumber, country });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-bold mb-4">
            {companyToEdit ? 'Modifier la compagnie' : 'Ajouter une compagnie'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="company-name" className="text-sm font-medium">Nom de l&apos;entreprise (obligatoire)</label>
              <input id="company-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" required />
            </div>
            <div>
              <label htmlFor="company-address" className="text-sm font-medium">Adresse</label>
              <textarea id="company-address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" rows={3}></textarea>
            </div>
            <div>
              <label htmlFor="company-vat" className="text-sm font-medium">Numéro de TVA</label>
              <input id="company-vat" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" />
            </div>
            <div>
              <label htmlFor="company-country" className="text-sm font-medium">Pays</label>
              <input id="company-country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" />
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400">
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4" aria-label="Close"><X className="h-5 w-5" /></button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
