'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({ open, onOpenChange, onConfirm }: ConfirmDeleteModalProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <div className="flex items-center">
            <div className="mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
                <Dialog.Title className="text-lg font-bold">
                    Confirmer la suppression
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                    Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ? Cette action est irréversible.
                </Dialog.Description>
            </div>
          </div>

          <div className="flex justify-end pt-6 space-x-3">
            <Dialog.Close asChild>
                <button className="bg-white border border-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-100 font-semibold">
                    Annuler
                </button>
            </Dialog.Close>
            <button 
                onClick={handleConfirm}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold"
            >
              Supprimer
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}