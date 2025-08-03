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

  // Cas 1: Aucune offre visible, on affiche la spécification du client
  if (visibleOffers.length === 0) {
    return (
      <tr ref={setNodeRef} style={style} onClick={() => onSelection(request.id, 'request')} className={`bg-white transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
        <td className="p-4 w-12" {...attributes}><input type="checkbox" className="h-4 w-4 accent-black pointer-events-none" checked={isSelected} readOnly /></td>
        <td className="p-4 w-20"><button type="button" onClick={(e) => { e.stopPropagation(); onImageClick(request.image_url || placeholderImage); }}><Image src={request.image_url || placeholderImage} alt={request.name} width={48} height={48} className="w-12 h-12 rounded-md object-cover bg-gray-100" /></button></td>
        <td className="p-4 font-semibold">{request.name}</td>
        <td className="p-4">{request.quantity}</td>
        <td className="p-4 text-sm text-gray-600 col-span-2 whitespace-pre-wrap">{request.specification || '-'}</td>
        <td {...listeners} className="p-4 w-12 cursor-grab text-gray-400 hover:text-black" onClick={(e) => e.stopPropagation()}><GripVertical className="h-5 w-5" /></td>
      </tr>
    );
  }

  // Cas 2: Une ou plusieurs offres visibles
  const firstOffer = visibleOffers[0];
  const additionalOffers = visibleOffers.slice(1);

  return (
    <React.Fragment>
      {/* Ligne principale avec la première offre */}
      <tr ref={setNodeRef} style={style} onClick={() => onSelection(request.id, 'request')} className={`bg-white transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
        <td className="p-4 w-12" {...attributes}><input type="checkbox" className="h-4 w-4 accent-black pointer-events-none" checked={isSelected} readOnly /></td>
        <td className="p-4 w-20"><button type="button" onClick={(e) => { e.stopPropagation(); onImageClick(request.image_url || placeholderImage); }}><Image src={request.image_url || placeholderImage} alt={request.name} width={48} height={48} className="w-12 h-12 rounded-md object-cover bg-gray-100" /></button></td>
        <td className="p-4 font-semibold">{request.name}</td>
        <td className="p-4">{request.quantity}</td>
        <td className="p-4 text-sm font-medium">{firstOffer.supplier_name}</td>
        <td className="p-4 text-sm font-mono">{(firstOffer.unit_price_rmb / firstOffer.exchange_rate).toFixed(2)} {firstOffer.client_currency}</td>
        <td {...listeners} className="p-4 w-12 cursor-grab text-gray-400 hover:text-black" onClick={(e) => e.stopPropagation()}><GripVertical className="h-5 w-5" /></td>
      </tr>
      {/* Lignes supplémentaires pour les autres offres */}
      {additionalOffers.map(offer => (
        <tr key={offer.id} className={`bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}>
          <td colSpan={4}></td>
          <td className="p-4 text-sm font-medium">{offer.supplier_name}</td>
          <td className="p-4 text-sm font-mono">{(offer.unit_price_rmb / offer.exchange_rate).toFixed(2)} {offer.client_currency}</td>
          <td></td>
        </tr>
      ))}
    </React.Fragment>
  );
}
