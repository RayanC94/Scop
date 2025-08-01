'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Request, RequestGroup as RequestGroupType } from '@/types';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import RequestItem from '../_components/RequestItem';
import RequestGroup from '../_components/RequestGroup';
import SidebarRight from '../_components/SidebarRight';
import SidebarLeft from '../_components/SidebarLeft';
import AddRequestModal from '../_components/AddRequestModal';
import ConfirmDeleteModal from '../_components/ConfirmDeleteModal';

export default function DashboardPage() {
  const [items, setItems] = useState<(Request | RequestGroupType)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*, requests(*)')
      .order('created_at', { ascending: false });
    
    const { data: freeRequestsData, error: requestsError } = await supabase
      .from('requests')
      .select('*')
      .is('group_id', null)
      .order('created_at', { ascending: false });

    if (groupsError || requestsError) {
      console.error('Erreur de chargement:', groupsError || requestsError);
    } else {
      const allItems = [...(groupsData || []), ...(freeRequestsData || [])];
      setItems(allItems);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    setHasMounted(true);
  }, [fetchData]);

  const handleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAddRequest = async (data: Omit<Request, 'id' | 'lastModified'>) => {
    const { name, quantity, imageUrl, specification } = data;
    
    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({ 
        name, 
        quantity,
        image_url: imageUrl,
        specification: specification || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'ajout de la requête:", error);
    } else if (newRequest) {
      // On rafraîchit toutes les données pour être sûr que tout est à jour
      fetchData();
    }
  };

  const handleDeleteSelected = () => {
    // Logique à connecter à Supabase
    console.log("Suppression des IDs :", selectedIds);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Logique à connecter à Supabase
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((currentItems) => {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);
      return arrayMove(currentItems, oldIndex, newIndex);
    });
  };

  if (loading && !hasMounted) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Chargement des données...</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <SidebarLeft />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex space-x-3">
             <button onClick={() => setIsAddModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center font-semibold">
                <Plus className="h-5 w-5 mr-2" /> Nouvelle Requête
            </button>
             <button className="bg-white border border-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-100 flex items-center font-semibold">
                <Plus className="h-5 w-5 mr-2" /> Nouveau Groupe
            </button>
          </div>
        </div>
        
        {hasMounted && (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {items.map((item) => {
                    if ('requests' in item) {
                      return <RequestGroup key={item.id} group={item} selectedIds={selectedIds} onSelection={handleSelection} isSelected={selectedIds.includes(item.id)} />;
                    } else {
                      return <RequestItem key={item.id} request={item} isSelected={selectedIds.includes(item.id)} onSelection={handleSelection} />;
                    }
                  })}
                </div>
              </SortableContext>
            </DndContext>
        )}
      </main>

      <SidebarRight 
        selectedCount={selectedIds.length} 
        onDelete={() => setIsDeleteModalOpen(true)} 
      />

      <AddRequestModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onAddRequest={handleAddRequest} 
      />
      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}