'use client';

import { Download, FileText, Trash2, Archive, Move, Plus, Edit } from 'lucide-react';
import React from 'react';

interface SidebarRightProps {
  selectedCount: number;
  isGroupSelected: boolean;
  onDelete: () => void;
  onAddRequestToGroup: () => void;
  onEdit: () => void;
}

const ActionButton = ({ icon, label, onClick, className = '' }: { icon: React.ReactNode, label: string, onClick?: () => void, className?: string }) => (
  <button onClick={onClick} className={`flex items-center w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm font-medium ${className}`}>
    {icon}
    {label}
  </button>
);

export default function SidebarRight({ selectedCount, isGroupSelected, onDelete, onAddRequestToGroup, onEdit }: SidebarRightProps) {
  const hasSelection = selectedCount > 0;
  const isSingleSelection = selectedCount === 1;

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

          {/* Action spécifique si UN SEUL groupe est sélectionné */}
          {isGroupSelected && (
            <ActionButton 
                icon={<Plus className="w-4 h-4 mr-3" />} 
                label="Ajouter une requête"
                onClick={onAddRequestToGroup}
            />
          )}

          {/* Actions communes à toutes les sélections */}
          <ActionButton icon={<Download className="w-4 h-4 mr-3" />} label="Télécharger le devis" />
          <ActionButton icon={<FileText className="w-4 h-4 mr-3" />} label="Demander la facture" />
          
          {/* Action de modification si UNE SEULE LIGNE est sélectionnée (groupe ou requête) */}
          {isSingleSelection && <ActionButton icon={<Edit className="w-4 h-4 mr-3" />} label="Modifier" onClick={onEdit} />}
          
          {/* Actions communes à toutes les sélections */}
          <ActionButton icon={<Move className="w-4 h-4 mr-3" />} label="Déplacer" />
          <ActionButton icon={<Archive className="w-4 h-4 mr-3" />} label="Archiver" />
          <ActionButton 
              icon={<Trash2 className="w-4 h-4 mr-3 text-red-600" />} 
              label={isGroupSelected && isSingleSelection ? "Supprimer le groupe" : "Supprimer"}
              onClick={onDelete}
              className="text-red-600"
          />
        </div>
      )}
    </div>
  );
}
