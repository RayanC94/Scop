'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Request, RequestGroup as RequestGroupType } from '@/types';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import RequestItem from '../_components/RequestItem';
import RequestGroup from '../_components/RequestGroup';
import SidebarRight from '../_components/SidebarRight';
import AddRequestModal from '../_components/AddRequestModal';
import ConfirmDeleteModal from '../_components/ConfirmDeleteModal';
import AddGroupModal from '../_components/AddGroupModal';
import EditModal from '../_components/EditModal';
import MoveItemsModal from '../_components/MoveItemsModal';
import ImagePreviewModal from '../_components/ImagePreviewModal';

export default function DashboardPage() {
  const [items, setItems] = useState<(Request | RequestGroupType)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddRequestModalOpen, setIsAddRequestModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Request | RequestGroupType | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    
    setLoading(true); 
    const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*, requests(*)').order('position');
    const { data: freeRequestsData, error: requestsError } = await supabase.from('requests').select('*').is('group_id', null).order('position');

    if (groupsError || requestsError) {
      console.error('Erreur de chargement:', groupsError || requestsError);
    } else {
      const allItems: (Request | RequestGroupType)[] = [...(groupsData || []), ...(freeRequestsData || [])];
      allItems.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
      allItems.forEach(item => {
        if ('requests' in item) {
          item.requests.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        }
      });
      setItems(allItems);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { 
    fetchData(); 
    setHasMounted(true); 
  }, [fetchData]);

  const { groupedItems } = useMemo(() => {
    const groupedItems = items.filter(item => 'requests' in item) as RequestGroupType[];
    return { groupedItems };
  }, [items]);

  const isSingleGroupSelected = useMemo(() => {
    if (selectedIds.length !== 1) return false;
    const selectedItem = items.find(item => item.id === selectedIds[0]);
    return !!(selectedItem && 'requests' in selectedItem);
  }, [selectedIds, items]);

  const getTopPosition = (): number => {
    if (items.length === 0) return 0;
    const topItem = items.reduce((prev, curr) => ((prev.position ?? Infinity) < (curr.position ?? Infinity) ? prev : curr));
    return (topItem.position ?? 0) - 1;
  };

  const handleSelection = (id: string, type: 'request' | 'group') => {
    const item = items.find(i => i.id === id) || items.flatMap(i => 'requests' in i ? i.requests : []).find(r => r.id === id);
    if (!item) return;

    setSelectedIds(prevSelectedIds => {
        const newSelectedIds = new Set(prevSelectedIds);

        if (type === 'group' && 'requests' in item) {
            const group = item;
            const childIds = group.requests.map(r => r.id);
            const isGroupSelected = newSelectedIds.has(group.id);
            const areAllChildrenSelected = childIds.every(cid => newSelectedIds.has(cid));

            if (isGroupSelected && areAllChildrenSelected) {
                childIds.forEach(cid => newSelectedIds.delete(cid));
            } else if (isGroupSelected) {
                newSelectedIds.delete(group.id);
            } else {
                newSelectedIds.add(group.id);
                childIds.forEach(cid => newSelectedIds.add(cid));
            }
        } else if (type === 'request') {
            if (newSelectedIds.has(item.id)) {
                newSelectedIds.delete(item.id);
            } else {
                newSelectedIds.add(item.id);
            }

            const parentGroup = items.find(g => 'requests' in g && g.requests.some(r => r.id === item.id)) as RequestGroupType | undefined;
            if (parentGroup) {
                const allChildrenSelected = parentGroup.requests.every(r => newSelectedIds.has(r.id));
                if (allChildrenSelected) {
                    newSelectedIds.add(parentGroup.id);
                } else {
                    newSelectedIds.delete(parentGroup.id);
                }
            }
        }
        return Array.from(newSelectedIds);
    });
  };

  const handleAddRequest = async (data: Omit<Request, 'id' | 'last_modified' | 'position'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { name, quantity, image_url, specification } = data;
    const groupId = targetGroupId;
    let newPosition: number | null = null;
    if (!groupId) { 
      newPosition = getTopPosition(); 
    }
    const { error } = await supabase.from('requests').insert({ name, quantity, image_url, specification, group_id: groupId, position: newPosition, user_id: user.id });
    if (error) { 
      console.error("Erreur:", error); 
    } else {
      if (groupId) {
        const groupTopPosition = getTopPosition();
        await supabase.from('groups').update({ position: groupTopPosition }).eq('id', groupId);
      }
      fetchData();
    }
    setTargetGroupId(null);
  };
  
  const handleAddGroup = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPosition = getTopPosition();
    const { error } = await supabase.from('groups').insert({ name, position: newPosition, user_id: user.id });
    if (!error) fetchData();
  };

  const handleDeleteSelected = async () => {
    const allItemsFlat = items.flatMap(item => 'requests' in item ? [item, ...item.requests] : [item]);
    
    const selectedGroupIds = new Set(
      selectedIds.filter(id => {
        const item = allItemsFlat.find(i => i.id === id);
        return item && 'requests' in item;
      })
    );

    const requestIdsToDelete = selectedIds.filter(id => {
      const item = allItemsFlat.find(i => i.id === id);
      if (!item || 'requests' in item) return false;

      const parentGroup = groupedItems.find(g => g.requests.some(r => r.id === id));
      
      return !parentGroup || !selectedGroupIds.has(parentGroup.id);
    });

    const groupIdsToDelete = Array.from(selectedGroupIds);

    const deletionPromises = [];
    if (groupIdsToDelete.length > 0) {
      deletionPromises.push(supabase.from('groups').delete().in('id', groupIdsToDelete));
    }
    if (requestIdsToDelete.length > 0) {
      deletionPromises.push(supabase.from('requests').delete().in('id', requestIdsToDelete));
    }
    if (deletionPromises.length === 0) return;

    const results = await Promise.all(deletionPromises);
    const errors = results.map(res => res.error).filter(Boolean);

    if (errors.length > 0) {
      console.error('Erreurs:', errors);
      alert(`Des erreurs sont survenues: ${errors.map(e => e.message).join(', ')}`);
    } else {
      fetchData();
      setSelectedIds([]);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = items.findIndex(i => i.id === activeId);
    const newIndex = items.findIndex(i => i.id === overId);
    
    if (oldIndex !== newIndex) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems); // Optimistic UI update for reordering

        const updates = newItems.map((item, index) => {
            const table = 'requests' in item ? 'groups' : 'requests';
            return supabase.from(table).update({ position: index }).eq('id', item.id);
        });
        await Promise.all(updates);
        fetchData(); // Resync with DB to be safe
    }
  };

  const handleOpenAddRequestToGroup = () => {
    const selectedGroup = items.find(item => 'requests' in item && selectedIds.includes(item.id));
    if(selectedGroup) {
        setTargetGroupId(selectedGroup.id);
        setIsAddRequestModalOpen(true);
    }
  };

  const handleOpenEditModal = () => {
    if (selectedIds.length !== 1) return;
    const selectedItem = items.find(i => i.id === selectedIds[0]) || 
                         items.flatMap(i => 'requests' in i ? i.requests : []).find(r => r.id === selectedIds[0]);
    if (selectedItem) {
      setItemToEdit(selectedItem);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<Request | RequestGroupType>, table: 'requests' | 'groups') => {
    const { error } = await supabase.from(table).update(updates).eq('id', id);
    if (error) {
      console.error("Erreur de mise à jour:", error);
    } else {
      fetchData();
    }
  };
  
  const handleMoveItems = async (destinationGroupId: string | null) => {
    const requestIdsToMove = selectedIds.filter(id => {
      const item = items.find(i => i.id === id) || items.flatMap(i => 'requests' in i ? i.requests : []).find(r => r.id === id);
      return item && !('requests' in item);
    });

    if (requestIdsToMove.length === 0) return;

    const updatePromises = [];

    if (destinationGroupId === null) {
        // Déplacement vers les requêtes libres
        const topPosition = getTopPosition();
        for (let i = 0; i < requestIdsToMove.length; i++) {
            const id = requestIdsToMove[i];
            updatePromises.push(
                supabase.from('requests').update({
                    group_id: null,
                    position: topPosition - i
                }).eq('id', id)
            );
        }
    } else {
        // Déplacement vers un groupe spécifique
        for (const id of requestIdsToMove) {
            updatePromises.push(
                supabase.from('requests').update({
                    group_id: destinationGroupId,
                    position: null
                }).eq('id', id)
            );
        }
        updatePromises.push(
            supabase.from('groups').update({ position: getTopPosition() }).eq('id', destinationGroupId)
        );
    }

    const results = await Promise.all(updatePromises);
    const errors = results.map(res => res.error).filter(Boolean);

    if (errors.length > 0) {
        console.error("Erreur de déplacement:", errors);
        alert(`Des erreurs sont survenues lors du déplacement: ${errors.map(e => e.message).join(', ')}`);
    }

    fetchData();
    setSelectedIds([]);
  };

  const availableGroups = useMemo(() => items.filter(item => 'requests' in item) as RequestGroupType[], [items]);

  if (loading && !hasMounted) { 
    return <div className="flex-1 flex items-center justify-center"><p>Chargement...</p></div>; 
  }

  return (
    <>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex space-x-3">
             <button onClick={() => setIsAddRequestModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center font-semibold">
                <Plus className="h-5 w-5 mr-2" /> Nouvelle Requête
            </button>
             <button onClick={() => setIsAddGroupModalOpen(true)} className="bg-white border border-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-100 flex items-center font-semibold">
                <Plus className="h-5 w-5 mr-2" /> Nouveau Groupe
            </button>
          </div>
        </div>
        
        {hasMounted && (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 w-12"></th>
                    <th className="p-4 w-20">Image</th>
                    <th className="p-4">Produit</th>
                    <th className="p-4">Quantité</th>
                    <th className="p-4">Spécification</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {items.map((item) => {
                      if ('requests' in item) { // C'est un groupe
                        return (
                          <RequestGroup
                            key={item.id}
                            group={item}
                            selectedIds={selectedIds}
                            onSelection={handleSelection}
                            isSelected={selectedIds.includes(item.id)}
                            onImageClick={setPreviewImageUrl}
                          />
                        );
                      } else { // C'est une requête libre
                        return (
                          <RequestItem
                            key={item.id}
                            request={item}
                            isSelected={selectedIds.includes(item.id)}
                            onSelection={handleSelection}
                            onImageClick={setPreviewImageUrl}
                          />
                        );
                      }
                    })}
                  </tbody>
                </SortableContext>
              </table>
              {!loading && items.length === 0 && (
                <p className="p-6 text-center text-gray-500">Aucune requête ou groupe trouvé.</p>
              )}
            </div>
          </DndContext>
        )}
      </div>

      <aside className="w-72 bg-white p-4 border-l border-gray-200 self-start">
        <SidebarRight 
          selectedCount={selectedIds.length} 
          isGroupSelected={isSingleGroupSelected}
          onDelete={() => setIsDeleteModalOpen(true)}
          onAddRequestToGroup={handleOpenAddRequestToGroup}
          onEdit={handleOpenEditModal}
          onMove={() => setIsMoveModalOpen(true)}
        />
      </aside>

      <AddRequestModal 
        open={isAddRequestModalOpen} 
        onOpenChange={(open) => { if (!open) setTargetGroupId(null); setIsAddRequestModalOpen(open); }} 
        onAddRequest={handleAddRequest} 
      />
      <AddGroupModal
        open={isAddGroupModalOpen}
        onOpenChange={setIsAddGroupModalOpen}
        onAddGroup={handleAddGroup}
      />
      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteSelected}
      />
      <EditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        itemToEdit={itemToEdit}
        onUpdate={handleUpdateItem}
      />
      <MoveItemsModal
        open={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
        onMove={handleMoveItems}
        groups={availableGroups}
      />
      <ImagePreviewModal
        open={!!previewImageUrl}
        onOpenChange={() => setPreviewImageUrl(null)}
        imageUrl={previewImageUrl}
      />
    </>
  );
}
