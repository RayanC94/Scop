'use client';

import Image from 'next/image';
import { Request } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface RequestItemProps {
  request: Request;
  isSelected: boolean;
  onSelection: (id: string, type: 'request' | 'group') => void;
}

export default function RequestItem({ request, isSelected, onSelection }: RequestItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelection(request.id, 'request')}
      {...attributes}
      className={`flex items-center bg-white p-3 border rounded-md shadow-sm transition-colors duration-200 cursor-pointer ${isSelected ? 'border-black' : 'border-gray-200 hover:border-gray-400'} touch-none`}
    >
      <input 
        type="checkbox" 
        className="mr-3 h-4 w-4 accent-black pointer-events-none"
        checked={isSelected}
        readOnly
      />
      <Image
        src={request.image_url || placeholderImage}
        alt={request.name}
        width={48}
        height={48}
        className="w-12 h-12 rounded-md object-cover mr-4 bg-gray-100"
      />
      <div className="flex-1">
        <p className="font-semibold text-black">{request.name}</p>
        <p className="text-sm text-gray-600">Quantité : {request.quantity}</p>
      </div>
      <div 
        {...listeners}
        className="p-2 cursor-grab text-gray-400 hover:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5" />
      </div>
    </div>
  );
}
