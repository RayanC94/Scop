'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import AddGroupModal from '../_components/AddGroupModal';

export default function DashboardPage() {
  const [items, setItems] = useState<(Request | RequestGroupType)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddRequestModalOpen, setIsAddRequestModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Ne pas montrer le loader pour les re-fetch rapides pour une meilleure UX
    // setLoading(true); 
    
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*, requests(*)')
      .order('position');
    
    const { data: freeRequestsData, error: requestsError } = await supabase
      .from('requests')
      .select('*')
      .is('group_id', null)
      .order('position');

    if (groupsError || requestsError) {
      console.error('Erreur de chargement:', groupsError || requestsError);
    } else {
      const allItems: (Request | RequestGroupType)[] = [...(groupsData || []), ...(freeRequestsData || [])];
      // Tri principal par position
      allItems.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
      // Tri secondaire des requêtes dans les groupes (si elles ont une position)
      allItems.forEach(item => {
        if ('requests' in item) {
          item.requests.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        }
      });
      setItems(allItems);
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchData(); 
    setHasMounted(true); 
  }, [fetchData]);

  const isSingleGroupSelected = useMemo(() => {
    // 1. Trouver tous les groupes sélectionnés
    const selectedGroups = items.filter(
      item => 'requests' in item && selectedIds.includes(item.id)
    ) as RequestGroupType[];

    // 2. S'il n'y a pas exactement un groupe sélectionné, ce n'est pas le bon contexte
    if (selectedGroups.length !== 1) {
      return false;
    }

    // 3. Vérifier qu'aucune requête libre n'est sélectionnée en même temps
    const selectedFreeRequests = items.filter(
      item => !('requests' in item) && selectedIds.includes(item.id)
    );

    // S'il y a des requêtes libres sélectionnées, ce n'est pas un contexte de groupe unique
    if (selectedFreeRequests.length > 0) {
      return false;
    }

    // C'est bien un contexte de groupe unique
    return true;
  }, [selectedIds, items]);

  const getTopPosition = (): number => {
    if (items.length === 0) return 0;
    const topItem = items.reduce((prev, curr) => ((prev.position ?? Infinity) < (curr.position ?? Infinity) ? prev : curr));
    return (topItem.position ?? 0) - 1;
  };

  const handleSelection = (id: string) => {
    setSelectedIds(prevSelectedIds => {
        const newSelectedIds = new Set(prevSelectedIds);
        const item = items.find(i => i.id === id) || items.flatMap(i => 'requests' in i ? i.requests : []).find(r => r.id === id);
        if (!item) return prevSelectedIds;

        // CAS 1 : Clic sur un groupe
        if ('requests' in item) {
            const isSelected = newSelectedIds.has(item.id);
            if (isSelected) {
                newSelectedIds.delete(item.id);
                item.requests.forEach(r => newSelectedIds.delete(r.id));
            } else {
                newSelectedIds.add(item.id);
                item.requests.forEach(r => newSelectedIds.add(r.id));
            }
        } 
        // CAS 2 : Clic sur une requête
        else {
            const isSelected = newSelectedIds.has(item.id);
            if (isSelected) {
                newSelectedIds.delete(item.id);
            } else {
                newSelectedIds.add(item.id);
            }

            // Vérifier le statut du groupe parent
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
    const { name, quantity, image_url, specification } = data;
    const groupId = targetGroupId;
    let newPosition: number | null = null;
    if (!groupId) { 
      newPosition = getTopPosition(); 
    }
    const { error } = await supabase.from('requests').insert({ name, quantity, image_url, specification, group_id: groupId, position: newPosition });
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
    const newPosition = getTopPosition();
    const { error } = await supabase.from('groups').insert({ name, position: newPosition });
    if (!error) fetchData();
  };

  const handleDeleteSelected = async () => {
    const requestIdsToDelete: string[] = [];
    const groupIdsToDelete: string[] = [];
    selectedIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item && 'requests' in item) { groupIdsToDelete.push(id); } 
      else if (item) { requestIdsToDelete.push(id); }
    });
    if (groupIdsToDelete.length > 0) { alert("La suppression de groupes entiers n'est pas encore implémentée."); return; }
    if (requestIdsToDelete.length === 0) return;
    const { error } = await supabase.from('requests').delete().in('id', requestIdsToDelete);
    if (error) { 
      console.error('Erreur lors de la suppression:', error); 
      alert(error.message); 
    } else {
      fetchData();
      setSelectedIds([]);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    if (activeId === overId) return;

    let activeItem: Request | undefined;
    let sourceGroupId: string | null = null;

    for (const item of items) {
        if (item.id === activeId && !('requests' in item)) { activeItem = item; break; }
        if ('requests' in item) {
            const nested = item.requests.find(r => r.id === activeId);
            if (nested) { activeItem = nested; sourceGroupId = item.id; break; }
        }
    }
    if (!activeItem) return;

    const overItem = overId ? items.find(i => i.id === overId) : null;
    const overIsGroup = overItem && 'requests' in overItem;

    // CAS 1: Déplacer une requête VERS un groupe
    if (overIsGroup) {
        await supabase.from('requests').update({ group_id: overId, position: null }).eq('id', activeId);
        await supabase.from('groups').update({ position: getTopPosition() }).eq('id', overId);
    } 
    // CAS 2: Déplacer une requête HORS d'un groupe ou ré-ordonner
    else {
        // Si on déplace hors d'un groupe (même dans le vide)
        if (sourceGroupId) {
            const newPosition = overId ? items.findIndex(i => i.id === overId) : items.length;
            await supabase.from('requests').update({ group_id: null, position: newPosition }).eq('id', activeId);
        }
        // Si on ré-ordonne la liste principale
        else if (overId) {
            const oldIndex = items.findIndex(i => i.id === activeId);
            const newIndex = items.findIndex(i => i.id === overId);
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems); // Mise à jour optimiste
            const updates = newItems.map((item, index) => {
                const table = 'requests' in item ? 'groups' : 'requests';
                return supabase.from(table).update({ position: index }).eq('id', item.id);
            });
            await Promise.all(updates);
        }
    }
    fetchData();
  };

  const handleOpenAddRequestToGroup = () => {
    // On trouve le groupe sélectionné, même si d'autres de ses requêtes le sont aussi
    const selectedGroup = items.find(item => 'requests' in item && selectedIds.includes(item.id));
    if(selectedGroup) {
        setTargetGroupId(selectedGroup.id);
        setIsAddRequestModalOpen(true);
    }
  };

  if (loading && !hasMounted) { 
    return <div className="flex h-screen items-center justify-center"><p>Chargement...</p></div>; 
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <SidebarLeft />
      <main className="flex-1 p-6 overflow-y-auto">
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
              <SortableContext 
                items={items.flatMap(i => 'requests' in i ? [i.id, ...i.requests.map(r => r.id)] : [i.id])}
              >
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
        isGroupSelected={isSingleGroupSelected}
        onDelete={() => setIsDeleteModalOpen(true)}
        onAddRequestToGroup={handleOpenAddRequestToGroup}
      />

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
    </div>
  );
}
