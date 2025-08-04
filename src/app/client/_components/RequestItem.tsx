'use client';

import React from 'react';
import Image from 'next/image';
import { Request } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface RequestItemProps {
  request: Request;
  isSelected: boolean;
  onSelection: (id: string, type: 'request' | 'group') => void;
  onImageClick: (imageUrl: string) => void;
}

export default function RequestItem({ request, isSelected, onSelection, onImageClick }: RequestItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const placeholderImage = 'https://via.placeholder.com/100';
  const visibleOffers = request.offers?.filter(o => o.is_visible_to_client) || [];
  const rowCount = Math.max(1, visibleOffers.length);
  // Ajout de classes pour le retour à la ligne
  const cellClasses = "p-4 align-top border-b border-gray-200 whitespace-normal break-words";
  const requestCellClasses = `${cellClasses} sticky z-10`;

  // Cas 1: Aucune offre visible
  if (visibleOffers.length === 0) {
    return (
      <tr ref={setNodeRef} style={style} onClick={() => onSelection(request.id, 'request')} className={`transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
        <td className={`${requestCellClasses} left-0 ${isSelected ? 'bg-gray-100' : 'bg-white'}`}><input type="checkbox" className="h-4 w-4 accent-black pointer-events-none" checked={isSelected} readOnly /></td>
        <td className={cellClasses}><button type="button" onClick={(e) => { e.stopPropagation(); onImageClick(request.image_url || placeholderImage); }}><Image src={request.image_url || placeholderImage} alt={request.name} width={48} height={48} className="w-12 h-12 rounded-md object-cover bg-gray-100" /></button></td>
        <td className={`${cellClasses} font-semibold`}>{request.name}</td>
        <td className={cellClasses}>{request.quantity}</td>
        <td className={`${cellClasses} text-sm text-gray-600 max-w-xs`}>{request.specification || '-'}</td>
        {/* Cellules vides pour l'alignement */}
        <td className={cellClasses} colSpan={7}></td> 
        <td {...listeners} className={`${cellClasses} cursor-grab text-gray-400 hover:text-black`} onClick={(e) => e.stopPropagation()}><GripVertical className="h-5 w-5" /></td>
      </tr>
    );
  }

  // Cas 2: Une ou plusieurs offres visibles
  return (
    <React.Fragment>
      {visibleOffers.map((offer, index) => {
        const unitPrice = offer.unit_price_rmb / offer.exchange_rate;
        const totalPrice = unitPrice * request.quantity;

        // La première ligne contient les informations de la requête et la première offre
        if (index === 0) {
          return (
            <tr ref={setNodeRef} style={style} key={offer.id} onClick={() => onSelection(request.id, 'request')} className={`transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
              <td className={`${requestCellClasses} left-0 ${isSelected ? 'bg-gray-100' : 'bg-white'}`} rowSpan={rowCount}>
                <input type="checkbox" className="h-4 w-4 accent-black pointer-events-none" checked={isSelected} readOnly />
              </td>
              <td className={cellClasses} rowSpan={rowCount}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onImageClick(request.image_url || placeholderImage); }}>
                  <Image src={request.image_url || placeholderImage} alt={request.name} width={48} height={48} className="w-12 h-12 rounded-md object-cover bg-gray-100" />
                </button>
              </td>
              <td className={`${cellClasses} font-semibold`} rowSpan={rowCount}>{request.name}</td>
              <td className={cellClasses} rowSpan={rowCount}>{request.quantity}</td>
              <td className={`${cellClasses} text-sm text-gray-600 max-w-xs`} rowSpan={rowCount}>{request.specification || '-'}</td>
              
              {/* Détails de la première offre */}
              <td className={cellClasses}><Image src={offer.photo_url || placeholderImage} alt={offer.supplier_name} width={48} height={48} className="w-12 h-12 rounded-md object-cover bg-gray-100" /></td>
              <td className={`${cellClasses} text-sm max-w-xs`}>{offer.product_specs}</td>
              <td className={`${cellClasses} text-sm`}>{offer.packaging_type}</td>
              <td className={`${cellClasses} text-sm`}>{offer.size || '-'}</td>
              <td className={`${cellClasses} text-sm max-w-xs`}>{offer.remarks || '-'}</td>
              <td className={`${cellClasses} text-sm font-mono`}>{unitPrice.toFixed(2)} {offer.client_currency}</td>
              <td className={`${cellClasses} text-sm font-mono font-bold`}>{totalPrice.toFixed(2)} {offer.client_currency}</td>

              <td {...listeners} rowSpan={rowCount} className={`${cellClasses} cursor-grab text-gray-400 hover:text-black`} onClick={(e) => e.stopPropagation()}>
                <GripVertical className="h-5 w-5" />
              </td>
            </tr>
          );
        }

        // Les lignes suivantes ne contiennent que les détails des offres additionnelles
        return (
            <tr key={offer.id} onClick={() => onSelection(request.id, 'request')} className={`transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
              {/* Les 5 premières colonnes sont couvertes par rowSpan */}
              <td className={cellClasses}><Image src={offer.photo_url || placeholderImage} alt={offer.supplier_name} width={48} height={48} className="w-12 h-12 rounded-md object-cover bg-gray-100" /></td>
              <td className={`${cellClasses} text-sm max-w-xs`}>{offer.product_specs}</td>
              <td className={`${cellClasses} text-sm`}>{offer.packaging_type}</td>
              <td className={`${cellClasses} text-sm`}>{offer.size || '-'}</td>
              <td className={`${cellClasses} text-sm max-w-xs`}>{offer.remarks || '-'}</td>
              <td className={`${cellClasses} text-sm font-mono`}>{unitPrice.toFixed(2)} {offer.client_currency}</td>
              <td className={`${cellClasses} text-sm font-mono font-bold`}>{totalPrice.toFixed(2)} {offer.client_currency}</td>
              {/* La dernière colonne est couverte par rowSpan */}
            </tr>
        )
      })}
    </React.Fragment>
  );
}