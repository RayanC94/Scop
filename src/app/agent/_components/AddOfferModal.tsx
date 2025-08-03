'use client';

import { supabase } from '@/lib/supabaseClient';
import { Offer, Request } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

// On exclut les champs auto-générés pour la création
type NewOfferData = Omit<Offer, 'id' | 'created_at' | 'is_visible_to_client' | 'request_id'>;

interface AddOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
  onOfferAdded: () => void; // Pour rafraîchir les données
}

// Fonction intelligente pour normaliser la taille
const normalizeSize = (input: string): string => {
  if (!input.trim()) return '';
  let cleanedInput = input.replace(/,/g, '.').trim();
  const unitMatch = cleanedInput.match(/(cm|mm|m)$/i);
  const unit = unitMatch ? ` ${unitMatch[0].toLowerCase()}` : ' cm';
  if (unitMatch) {
    cleanedInput = cleanedInput.slice(0, -unitMatch[0].length).trim();
  }
  const parts = cleanedInput.split(/[x*]/i).map(part => part.trim().replace(/\./g, ','));
  return parts.join(' x ') + unit;
};

// Taux de change (RMB pour 1 unité de devise étrangère)
const exchangeRates: { [key: string]: number } = {
  EUR: 7.8,
  USD: 7.2,
  CAD: 5.3,
};

export default function AddOfferModal({ open, onOpenChange, request, onOfferAdded }: AddOfferModalProps) {
  const [formData, setFormData] = useState<NewOfferData>({
    supplier_name: '',
    product_specs: '',
    packaging_type: '',
    unit_price_rmb: 0,
    client_currency: 'EUR',
    exchange_rate: exchangeRates['EUR'],
    unit_weight: 0,
    size: '',
    remarks: '',
    photo_url: '',
  });
  const [factoryPhotoFile, setFactoryPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      exchange_rate: exchangeRates[prev.client_currency] || 0,
    }));
  }, [formData.client_currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isNumber = type === 'number';
    setFormData(prev => ({
      ...prev,
      [name]: isNumber ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSizeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeSize(e.target.value);
    setFormData(prev => ({ ...prev, size: normalized }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFactoryPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    setLoading(true);
    let photoUrl = null;

    if (factoryPhotoFile) {
      const cleanFileName = factoryPhotoFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filePath = `public/offer-photos/${Date.now()}_${cleanFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('request-images')
        .upload(filePath, factoryPhotoFile);

      if (uploadError) {
        console.error("Erreur d'upload:", uploadError);
        alert("Une erreur est survenue lors de l'envoi de la photo.");
        setLoading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('request-images').getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }

    const offerData = {
      ...formData,
      photo_url: photoUrl,
      request_id: request.id,
      is_visible_to_client: false,
    };

    const { error } = await supabase.from('offers').insert(offerData);

    if (error) {
      console.error("Erreur lors de l'ajout de l'offre:", error);
      alert("Une erreur est survenue.");
    } else {
      onOfferAdded();
      onOpenChange(false);
    }
    setLoading(false);
  };
  
  const unitPriceConverted = formData.unit_price_rmb / formData.exchange_rate;
  const totalRMB = formData.unit_price_rmb * (request?.quantity || 0);
  const totalConverted = unitPriceConverted * (request?.quantity || 0);

  if (!request) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 h-full max-h-[90vh] w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg focus:outline-none z-50 flex flex-col">
          <div className="p-6 border-b">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              Ajouter une offre pour "{request.name}"
            </Dialog.Title>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2"><label className="text-sm font-medium text-gray-800">Nom du fournisseur</label><input name="supplier_name" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required /></div>
              <div><label className="text-sm font-medium text-gray-800">Spécifications du produit</label><textarea name="product_specs" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" rows={2} required></textarea></div>
              <div><label className="text-sm font-medium text-gray-800">Emballage</label><input name="packaging_type" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-800">Prix unitaire (RMB)</label><input name="unit_price_rmb" type="number" step="0.01" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required /></div>
                <div><label className="text-sm font-medium text-gray-800">Devise du client</label><select name="client_currency" value={formData.client_currency} onChange={handleChange} className="w-full p-2 border rounded-md mt-1 bg-white"><option value="EUR">Euro (EUR)</option><option value="USD">Dollar Américain (USD)</option><option value="CAD">Dollar Canadien (CAD)</option></select></div>
              </div>
              <div><label className="text-sm font-medium text-gray-800">Taux de change ({formData.client_currency} → RMB)</label><input name="exchange_rate" type="number" value={formData.exchange_rate} onChange={handleChange} step="0.0001" className="w-full p-2 border rounded-md mt-1" /></div>
              <div><label className="text-sm font-medium text-gray-800">Poids unitaire (kg)</label><input name="unit_weight" type="number" step="0.01" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" required /></div>
              <div><label className="text-sm font-medium text-gray-800">Dimensions du produit</label><input name="size" value={formData.size || ''} onChange={handleChange} onBlur={handleSizeBlur} className="w-full p-2 border rounded-md mt-1" placeholder="ex: 10x20x30cm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-medium text-gray-800">Remarques</label><textarea name="remarks" onChange={handleChange} className="w-full p-2 border rounded-md mt-1" rows={2}></textarea></div>
              <div className="md:col-span-2"><label className="text-sm font-medium text-gray-800">Photo de l’usine (Optionnel)</label><input type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 mt-1"/></div>
            </div>
          </form>
          <div className="p-6 border-t bg-gray-50/50">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2 text-gray-900">Calcul automatique</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-gray-600">Prix unitaire converti:</span><span className="font-semibold text-right">{unitPriceConverted.toFixed(2)} {formData.client_currency}</span>
                <span className="text-gray-600">Total calculé (RMB):</span><span className="font-semibold text-right">{totalRMB.toFixed(2)} RMB</span>
                <span className="text-gray-600">Total calculé ({formData.client_currency}):</span><span className="font-semibold text-right">{totalConverted.toFixed(2)} {formData.client_currency}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400">
                {loading ? 'Sauvegarde...' : 'Soumettre l\'offre'}
              </button>
            </div>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
