'use client';

import { Download, FileText, Trash2, Archive, Move, Plus, Edit } from 'lucide-react';
import React from 'react';

interface SidebarRightProps {
  selectedCount: number;
  isGroupSelected: boolean;
  onDelete: () => void;
  onAddRequestToGroup: () => void;
  onEdit: () => void;
  onMove: () => void;
  selectedTotalPrice: number; // Ajout de la prop pour le total
}

const ActionButton = ({ icon, label, onClick, className = '' }: { icon: React.ReactNode, label: string, onClick?: () => void, className?: string }) => (
  <button onClick={onClick} className={`flex items-center w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm font-medium ${className}`}>
    {icon}
    {label}
  </button>
);

export default function SidebarRight({ selectedCount, isGroupSelected, onDelete, onAddRequestToGroup, onEdit, onMove, selectedTotalPrice }: SidebarRightProps) {
  const hasSelection = selectedCount > 0;
  const isSingleSelection = selectedCount === 1;
  const hasRequestsSelected = !isGroupSelected || selectedCount > 1;

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">Actions</h2>
      
      {!hasSelection && (
        <div className="bg-gray-100 p-4 rounded-md text-center">
            <p className="text-sm text-gray-500">Sélectionnez un élément.</p>
        </div>
      )}

      {hasSelection && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2 font-semibold">
            {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </p>
          <div className="border-t my-2"></div>

          {isGroupSelected && isSingleSelection && (
            <ActionButton 
                icon={<Plus className="w-4 h-4 mr-3" />} 
                label="Ajouter une requête"
                onClick={onAddRequestToGroup}
            />
          )}

          <ActionButton icon={<Download className="w-4 h-4 mr-3" />} label="Télécharger le devis" />
          <ActionButton icon={<FileText className="w-4 h-4 mr-3" />} label="Demander la facture" />
          
          {isSingleSelection && <ActionButton icon={<Edit className="w-4 h-4 mr-3" />} label="Modifier" onClick={onEdit} />}
          
          {hasRequestsSelected && <ActionButton icon={<Move className="w-4 h-4 mr-3" />} label="Déplacer" onClick={onMove} />}
          
          <ActionButton icon={<Archive className="w-4 h-4 mr-3" />} label="Archiver" />
          <ActionButton 
              icon={<Trash2 className="w-4 h-4 mr-3 text-red-600" />} 
              label={isGroupSelected && isSingleSelection ? "Supprimer le groupe" : "Supprimer"}
              onClick={onDelete}
              className="text-red-600"
          />

          {/* Affichage du prix total */}
          {selectedTotalPrice > 0 && (
            <div className="border-t mt-4 pt-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Total estimé</h3>
              <p className="text-2xl font-bold text-right">
                {selectedTotalPrice.toFixed(2)} EUR
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}