'use client';

import * as Dialog from '@radix-ui/react-dialog'; // Correction de la syntaxe d'import
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Request, RequestGroup } from '@/types';

// Le type peut être soit une requête, soit un groupe
type EditableItem = Request | RequestGroup;

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit: EditableItem | null;
  onUpdate: (id: string, updates: Partial<EditableItem>, table: 'requests' | 'groups') => void;
}

export default function EditModal({ open, onOpenChange, itemToEdit, onUpdate }: EditModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [specification, setSpecification] = useState('');
  const [loading, setLoading] = useState(false);

  // Pré-remplit le formulaire quand un item est passé en prop
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      // Si c'est une requête, on remplit les autres champs
      if (!('requests' in itemToEdit)) {
        setQuantity(itemToEdit.quantity);
        setSpecification(itemToEdit.specification || '');
      }
    }
  }, [itemToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || !name) return;

    setLoading(true);
    
    // On détermine la table et les données à mettre à jour
    if ('requests' in itemToEdit) {
      // C'est un groupe
      await onUpdate(itemToEdit.id, { name }, 'groups');
    } else {
      // C'est une requête
      const updates: Partial<Request> = { name, quantity, specification };
      await onUpdate(itemToEdit.id, updates, 'requests');
    }
    
    setLoading(false);
    onOpenChange(false);
  };
  
  const isGroup = itemToEdit && 'requests' in itemToEdit;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-bold mb-4">
            Modifier {isGroup ? 'le groupe' : 'la requête'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="text-sm font-medium">Nom</label>
              <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" required />
            </div>

            {!isGroup && (
              <>
                <div>
                  <label htmlFor="edit-quantity" className="text-sm font-medium">Quantité</label>
                  <input id="edit-quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} className="w-full p-2 border border-gray-300 rounded-md mt-1" min="1" required />
                </div>
                <div>
                  <label htmlFor="edit-specification" className="text-sm font-medium">Spécification</label>
                  <textarea id="edit-specification" value={specification} onChange={(e) => setSpecification(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" rows={3}></textarea>
                </div>
              </>
            )}
            
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
