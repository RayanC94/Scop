'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Le type complet pour une compagnie de l'agent
type AgentCompany = {
  id?: string;
  agent_id?: string;
  company_name?: string | null;
  business_registration_number?: string | null;
  address?: string | null;
  phone_number?: string | null;
  website?: string | null;
  email?: string | null;
  beneficiary_name?: string | null;
  account_number?: string | null;
  beneficiary_address?: string | null;
  bank_name?: string | null;
  bank_address?: string | null;
  swift_code?: string | null;
  bank_code?: string | null;
  branch_code?: string | null;
  country_region?: string | null;
  stamp_image_url?: string | null;
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyToEdit: Partial<AgentCompany> | null;
  onSaveSuccess: () => void;
}

export default function AgentCompanyFormModal({ open, onOpenChange, companyToEdit, onSaveSuccess }: ModalProps) {
  const [formData, setFormData] = useState<AgentCompany>({});
  const [stampFile, setStampFile] = useState<File | null>(null); // État pour le fichier du cachet
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyToEdit) {
      setFormData(companyToEdit);
    } else {
      setFormData({}); // Reset for new company
    }
    setStampFile(null); // Toujours réinitialiser le fichier
  }, [companyToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStampFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Vous n'êtes pas connecté.");
        setLoading(false);
        return;
    }

    let stampImageUrl = companyToEdit?.stamp_image_url || null;

    // Si un nouveau fichier a été sélectionné, on le téléverse
    if (stampFile) {
        const cleanFileName = stampFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `public/company-stamps/${user.id}-${Date.now()}_${cleanFileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from('request-images') // Assurez-vous que ce bucket existe et a les bonnes policies
            .upload(filePath, stampFile);

        if (uploadError) {
            console.error("Erreur d'upload du cachet:", uploadError);
            alert("Une erreur est survenue lors de l'envoi de l'image du cachet.");
            setLoading(false);
            return;
        }
        
        const { data: urlData } = supabase.storage.from('request-images').getPublicUrl(filePath);
        stampImageUrl = urlData.publicUrl;
    }

    const dataToSave = { ...formData, agent_id: user.id, stamp_image_url: stampImageUrl };

    if (companyToEdit?.id) {
      // Mise à jour
      const { error } = await supabase.from('agent_companies').update(dataToSave).eq('id', companyToEdit.id);
      if (error) console.error("Erreur de mise à jour:", error);
    } else {
      // Création
      const { error } = await supabase.from('agent_companies').insert(dataToSave);
      if (error) console.error("Erreur d'insertion:", error);
    }
    
    setLoading(false);
    onSaveSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[90vh] w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">
            {companyToEdit ? 'Modifier la compagnie' : 'Ajouter une compagnie'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Info Compagnie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="company_name" value={formData.company_name || ''} onChange={handleChange} placeholder="Company Name" className="p-2 border rounded-md" />
              <input name="business_registration_number" value={formData.business_registration_number || ''} onChange={handleChange} placeholder="Business Registration #" className="p-2 border rounded-md" />
              <textarea name="address" value={formData.address || ''} onChange={handleChange} placeholder="Address" className="p-2 border rounded-md md:col-span-2" rows={2}/>
              <input name="phone_number" value={formData.phone_number || ''} onChange={handleChange} placeholder="Phone Number" className="p-2 border rounded-md" />
              <input name="website" value={formData.website || ''} onChange={handleChange} placeholder="Website" className="p-2 border rounded-md" />
              <input name="email" value={formData.email || ''} onChange={handleChange} type="email" placeholder="Email" className="p-2 border rounded-md md:col-span-2" />
            </div>

            <h3 className="font-semibold text-lg border-b pb-2">Info Bancaire</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="beneficiary_name" value={formData.beneficiary_name || ''} onChange={handleChange} placeholder="Beneficiary Name" className="p-2 border rounded-md" />
               <input name="account_number" value={formData.account_number || ''} onChange={handleChange} placeholder="Account Number" className="p-2 border rounded-md" />
               <textarea name="beneficiary_address" value={formData.beneficiary_address || ''} onChange={handleChange} placeholder="Beneficiary Address" className="p-2 border rounded-md md:col-span-2" rows={2}/>
               <input name="bank_name" value={formData.bank_name || ''} onChange={handleChange} placeholder="Bank Name" className="p-2 border rounded-md" />
               <input name="bank_address" value={formData.bank_address || ''} onChange={handleChange} placeholder="Bank Address" className="p-2 border rounded-md" />
               <input name="swift_code" value={formData.swift_code || ''} onChange={handleChange} placeholder="Swift Code" className="p-2 border rounded-md" />
               <input name="bank_code" value={formData.bank_code || ''} onChange={handleChange} placeholder="Bank Code" className="p-2 border rounded-md" />
               <input name="branch_code" value={formData.branch_code || ''} onChange={handleChange} placeholder="Branch Code" className="p-2 border rounded-md" />
               <input name="country_region" value={formData.country_region || ''} onChange={handleChange} placeholder="Country/Region" className="p-2 border rounded-md" />
            </div>

            <h3 className="font-semibold text-lg border-b pb-2">Cachet de l'entreprise</h3>
            <div>
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg, image/webp"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200"
                />
                {formData.stamp_image_url && !stampFile && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">Cachet actuel :</p>
                        <img src={formData.stamp_image_url} alt="Cachet" className="h-20 w-auto border rounded-md mt-1" />
                    </div>
                )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400">
                {loading ? 'Sauvegarde...' : 'Sauvegarder le profil'}
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