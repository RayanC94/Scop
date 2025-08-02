'use client';

import { supabase } from '@/lib/supabaseClient';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Request } from '@/types';

type NewRequestData = Omit<Request, 'id' | 'last_modified' | 'position'>;

interface AddRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRequest: (data: NewRequestData) => void;
}

export default function AddRequestModal({ open, onOpenChange, onAddRequest }: AddRequestModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [specification, setSpecification] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || quantity <= 0 || !imageFile) return;

    setIsUploading(true);

    try {
      // CORRECTION : On nettoie le nom du fichier pour le rendre sûr
      const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filePath = `public/${Date.now()}_${cleanFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('request-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('request-images')
        .getPublicUrl(filePath);

      onAddRequest({ 
        name, 
        quantity, 
        image_url: urlData.publicUrl, 
        specification 
      });

      // Reset form
      setName('');
      setQuantity(1);
      setImageFile(null);
      setSpecification('');
      onOpenChange(false);

    } catch (error) {
      console.error("Erreur lors de l'envoi de l'image:", error);
      alert("Une erreur est survenue lors de l'envoi de l'image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none overflow-y-auto">
          <Dialog.Title className="text-lg font-bold mb-4">
            Nouvelle Requête
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">Nom du produit (obligatoire)</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" required />
            </div>
            <div>
              <label htmlFor="quantity" className="text-sm font-medium">Quantité (obligatoire)</label>
              <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} className="w-full p-2 border border-gray-300 rounded-md mt-1" min="1" required />
            </div>
             <div>
              <label htmlFor="imageFile" className="text-sm font-medium">Image (obligatoire)</label>
              <input 
                id="imageFile" 
                type="file" 
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200"
                accept="image/png, image/jpeg, image/webp" 
                required 
              />
            </div>
            <div>
              <label htmlFor="specification" className="text-sm font-medium">Spécification (optionnel)</label>
              <textarea id="specification" value={specification} onChange={(e) => setSpecification(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" rows={3}></textarea>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isUploading} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400">
                {isUploading ? 'Envoi en cours...' : 'Ajouter la requête'}
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