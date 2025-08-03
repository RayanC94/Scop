'use client';

import { supabase } from '@/lib/supabaseClient';
import { Offer, Request } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';

// On exclut les champs auto-générés pour la création
type NewOfferData = Omit<Offer, 'id' | 'created_at'>;

interface AddOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
  onOfferAdded: () => void; // Pour rafraîchir les données
}

export default function AddOfferModal({ open, onOpenChange, request, onOfferAdded }: AddOfferModalProps) {
  const [formData, setFormData] = useState<Omit<NewOfferData, 'request_id' | 'is_visible_to_client'>>({
    supplier_name: '',
    product_specs: '',
    packaging_type: '',
    unit_price_rmb: 0,
    unit_weight: 0,
    unit_volume: 0,
    quality_details: '',
    remarks: '',
    photo_url: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    setLoading(true);
    const offerData: NewOfferData = {
      ...formData,
      request_id: request.id,
      is_visible_to_client: false, // Par défaut, non visible
    };

    const { error } = await supabase.from('offers').insert(offerData);

    if (error) {
      console.error("Erreur lors de l'ajout de l'offre:", error);
      alert("Une erreur est survenue.");
    } else {
      onOfferAdded(); // Rafraîchit la liste
      onOpenChange(false); // Ferme la modale
    }
    setLoading(false);
  };
  
  if (!request) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 overflow-y-auto">
          <Dialog.Title className="text-lg font-bold mb-4">
            Ajouter une offre pour "{request.name}"
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne de gauche */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom du fournisseur</label>
                <input name="supplier_name" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium">Spécifications produit</label>
                <textarea name="product_specs" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" rows={3} required></textarea>
              </div>
              <div>
                <label className="text-sm font-medium">Type d’emballage</label>
                <input name="packaging_type" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium">Prix unitaire (RMB)</label>
                <input name="unit_price_rmb" type="number" step="0.01" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required />
              </div>
            </div>
            {/* Colonne de droite */}
            <div className="space-y-4">
               <div>
                <label className="text-sm font-medium">Poids unitaire (kg)</label>
                <input name="unit_weight" type="number" step="0.01" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium">Volume unitaire (m³)</label>
                <input name="unit_volume" type="number" step="0.001" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required />
              </div>
               <div>
                <label className="text-sm font-medium">Détails qualité/production</label>
                <textarea name="quality_details" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" rows={3} required></textarea>
              </div>
              <div>
                <label className="text-sm font-medium">Remarques (optionnel)</label>
                <textarea name="remarks" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" rows={2}></textarea>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end pt-4">
              <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400">
                {loading ? 'Sauvegarde...' : 'Ajouter l’offre'}
              </button>
            </div>
          </form>
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
