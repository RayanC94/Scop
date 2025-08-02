'use client';

import React, { useState } from 'react';
import { RequestGroup as RequestGroupType } from '@/types';
import RequestItem from './RequestItem';
import { ChevronDown, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RequestGroupProps {
  group: RequestGroupType;
  selectedIds: string[];
  onSelection: (id: string, type: 'request' | 'group') => void;
  onImageClick: (imageUrl: string) => void;
  isSelected: boolean;
}

export default function RequestGroup({ group, selectedIds, onSelection, onImageClick, isSelected }: RequestGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        onClick={() => onSelection(group.id, 'group')}
        className={`bg-gray-50 transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
      >
        <td className="p-4 w-12" {...attributes}>
          <input 
            type="checkbox" 
            className="h-4 w-4 accent-black pointer-events-none"
            readOnly
            checked={isSelected}
          />
        </td>
        <td colSpan={4} className="p-4">
          <div className="flex items-center">
            <h3 className="font-bold text-lg">{group.name}</h3>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="p-1 ml-2">
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} />
            </button>
          </div>
        </td>
        <td 
          {...listeners}
          className="p-4 w-12 cursor-grab text-gray-400 hover:text-black"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5" />
        </td>
      </tr>

      {isOpen && group.requests.map(request => (
        <RequestItem 
          key={request.id} 
          request={request}
          isSelected={selectedIds.includes(request.id)}
          onSelection={onSelection}
          onImageClick={onImageClick}
        />
      ))}
    </>
  );
}