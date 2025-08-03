'use client';

import { Request, Offer } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface OffersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
  onOfferUpdate: () => void; // Pour rafraîchir les données après une modification
}

export default function OffersModal({ open, onOpenChange, request, onOfferUpdate }: OffersModalProps) {
  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null);

  if (!request || !request.offers) return null;

  const handleToggleVisibility = async (offer: Offer) => {
    setUpdatingOfferId(offer.id);
    const { error } = await supabase
      .from('offers')
      .update({ is_visible_to_client: !offer.is_visible_to_client })
      .eq('id', offer.id);

    if (error) {
      console.error("Erreur lors de la mise à jour de la visibilité:", error);
      alert("Une erreur est survenue.");
    } else {
      // Si la mise à jour réussit, on demande à la page parente de rafraîchir les données
      onOfferUpdate();
    }
    setUpdatingOfferId(null);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[90vh] w-[90vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 flex flex-col">
          <Dialog.Title className="text-xl font-bold mb-4 text-gray-900">
            Gérer les offres pour "{request.name}"
          </Dialog.Title>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-sm text-gray-600 border-b">
                  <th className="p-4 font-semibold">Photo</th>
                  <th className="p-4 font-semibold">Fournisseur</th>
                  <th className="p-4 font-semibold">Spécification</th>
                  <th className="p-4 font-semibold">Emballage</th>
                  <th className="p-4 font-semibold">Prix (RMB)</th>
                  <th className="p-4 font-semibold">Statut</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {request.offers.map(offer => (
                  <tr key={offer.id} className="border-b last:border-b-0">
                    <td className="p-4">
                      <Image
                        src={offer.photo_url || 'https://via.placeholder.com/100'}
                        alt={offer.supplier_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-md object-cover bg-gray-100"
                      />
                    </td>
                    <td className="p-4 font-semibold">{offer.supplier_name}</td>
                    <td className="p-4 text-sm">{offer.product_specs}</td>
                    <td className="p-4 text-sm">{offer.packaging_type}</td>
                    <td className="p-4 text-sm font-mono">{offer.unit_price_rmb.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${offer.is_visible_to_client ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                        {offer.is_visible_to_client ? 'Visible' : 'Caché'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleVisibility(offer)}
                          disabled={updatingOfferId === offer.id}
                          className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                        >
                          {offer.is_visible_to_client ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button className="p-1 text-gray-500 hover:text-black"><Edit className="h-4 w-4" /></button>
                        <button className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
