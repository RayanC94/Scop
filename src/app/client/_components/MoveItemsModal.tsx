'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Folder, Inbox } from 'lucide-react';
import { useState } from 'react';
import { RequestGroup } from '@/types';

interface MoveItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (destinationGroupId: string | null) => void; // null signifie "requête libre"
  groups: RequestGroup[];
}

export default function MoveItemsModal({ open, onOpenChange, onMove, groups }: MoveItemsModalProps) {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (selectedDestination === null) return;
    setLoading(true);
    // On passe `null` si l'option "requête libre" est choisie
    await onMove(selectedDestination === '__free_requests__' ? null : selectedDestination);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-bold mb-4">
            Déplacer vers...
          </Dialog.Title>
          
          <div className="max-h-64 overflow-y-auto my-4 space-y-2">
            {/* Nouvelle option pour les requêtes libres */}
            <div
              onClick={() => setSelectedDestination('__free_requests__')}
              className={`flex items-center p-3 rounded-md cursor-pointer border-2 ${
                selectedDestination === '__free_requests__' 
                  ? 'border-black bg-gray-100' 
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <Inbox className="h-5 w-5 mr-3 text-gray-500" />
              <span className="font-medium">Requêtes libres (aucun groupe)</span>
            </div>

            {/* Liste des groupes existants */}
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => setSelectedDestination(group.id)}
                className={`flex items-center p-3 rounded-md cursor-pointer border-2 ${
                  selectedDestination === group.id 
                    ? 'border-black bg-gray-100' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <Folder className="h-5 w-5 mr-3 text-gray-500" />
                <span className="font-medium">{group.name}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button 
              onClick={handleMove}
              disabled={selectedDestination === null || loading}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Déplacement...' : 'Déplacer'}
            </button>
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