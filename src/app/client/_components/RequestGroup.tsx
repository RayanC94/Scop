'use client';

import React, { useState } from 'react';
import { RequestGroup as RequestGroupType, Request } from '@/types';
import RequestItem from './RequestItem';
import { ChevronDown, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RequestGroupProps {
  group: RequestGroupType;
  selectedIds: string[];
  onSelection: (id: string, type: 'request' | 'group') => void;
  isSelected: boolean;
}

export default function RequestGroup({ group, selectedIds, onSelection, isSelected }: RequestGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className={`border rounded-lg overflow-hidden transition-colors ${isOver ? 'border-black bg-gray-100' : isSelected ? 'border-black bg-white' : 'bg-gray-50 border-gray-200'}`}>
        <div
          {...attributes}
          onClick={() => onSelection(group.id, 'group')}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-200/50"
        >
          <div className="flex items-center flex-1">
            <input 
              type="checkbox" 
              className="mr-4 h-4 w-4 accent-black pointer-events-none"
              readOnly
              checked={isSelected}
            />
            <h3 className="font-bold text-lg">{group.name}</h3>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="p-1">
             <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          <div 
            {...listeners} 
            className="p-2 cursor-grab ml-2 text-gray-400 hover:text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5" />
          </div>
        </div>
        
        {isOpen && (
           <div className="p-4 pt-0 space-y-3">
             {group.requests.map((request: Request) => (
                <RequestItem 
                  key={request.id} 
                  request={request}
                  isSelected={selectedIds.includes(request.id)}
                  onSelection={onSelection}
                />
             ))}
           </div>
        )}
      </div>
    </div>
  );
}