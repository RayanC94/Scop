'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Request, RequestGroup as RequestGroupType } from '@/types';
import { ChevronDown, FileText } from 'lucide-react';
import Image from 'next/image';
import AddOfferModal from '../_components/AddOfferModal';
import ImagePreviewModal from '../_components/ImagePreviewModal';
import OffersModal from '../_components/OffersModal'; // Importer la nouvelle modale

// --- TYPES ÉTENDUS ---
type GroupWithDetails = Omit<RequestGroupType, 'requests'> & {
  requests: Request[];
  profiles?: { id: string; email: string } | null;
};

// --- SOUS-COMPOSANTS ---
const GroupRow = ({ group, isExpanded, onToggle, children }: { group: GroupWithDetails, isExpanded: boolean, onToggle: () => void, children: React.ReactNode }) => (
  <>
    <tr className="border-b border-gray-200 bg-gray-100 hover:bg-gray-200/60 cursor-pointer" onClick={onToggle}>
      <td className="p-4 font-bold" colSpan={5}>
        <div className="flex items-center">
          <ChevronDown className={`h-5 w-5 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span>{group.name}</span>
          <span className="ml-4 text-sm font-normal text-gray-500">({group.requests.length} requêtes) - Dernière activité: {new Date(group.last_modified).toLocaleDateString()}</span>
        </div>
      </td>
    </tr>
    {isExpanded && children}
  </>
);

const RequestRow = ({ request, onAddOfferClick, onViewOffers, onImageClick, isInsideGroup = false }: { request: Request, onAddOfferClick: () => void, onViewOffers: () => void, onImageClick: (imageUrl: string) => void, isInsideGroup?: boolean }) => (
  <tr className={`border-b border-gray-200 ${isInsideGroup ? 'bg-gray-50' : 'bg-white'}`}>
    <td className="p-4">
      <div className="flex items-center">
        <button type="button" onClick={() => onImageClick(request.image_url || 'https://via.placeholder.com/100')}>
          <Image
            src={request.image_url || 'https://via.placeholder.com/100'}
            alt={request.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-md object-cover bg-gray-100 mr-4"
          />
        </button>
        <div>
          <div className="flex items-center gap-2">
            {!isInsideGroup && (
              <span title="Requête Libre">
                <FileText className="h-4 w-4 text-gray-400" />
              </span>
            )}
            <p className="font-semibold">{request.name}</p>
          </div>
          <p className="text-xs text-gray-500">Activité le: {new Date(request.last_modified).toLocaleDateString()}</p>
        </div>
      </div>
    </td>
    <td className="p-4 text-sm text-gray-600">{request.profiles?.email || 'Client inconnu'}</td>
    <td className="p-4">{request.quantity}</td>
    <td className="p-4 text-sm text-gray-600 max-w-xs whitespace-pre-wrap">{request.specification || '-'}</td>
    <td className="p-4">
      <div className="flex items-center space-x-2">
        <button onClick={onAddOfferClick} className="bg-black text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800">
          Ajouter Offre
        </button>
        <button
          onClick={onViewOffers}
          disabled={!request.offers || request.offers.length === 0}
          className="bg-white border border-gray-300 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {request.offers?.length || 0} Offre(s)
        </button>
      </div>
    </td>
  </tr>
);

// --- COMPOSANT PRINCIPAL ---

export default function AgentDashboardPage() {
  const [allItems, setAllItems] = useState<(Request | GroupWithDetails)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isOffersListModalOpen, setIsOffersListModalOpen] = useState(false);
  const [selectedRequestForOffers, setSelectedRequestForOffers] = useState<Request | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const [clientFilter, setClientFilter] = useState<string>('Tous');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    // On ne met pas setLoading(true) ici pour un rechargement plus fluide
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const response = await fetch('/api/requests', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Réponse invalide du serveur' }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }
      const data: Request[] = await response.json();
      
      const groupsMap = new Map<string, GroupWithDetails>();
      const freeRequests: Request[] = [];

      data.forEach(req => {
        if (req.groups) {
          const groupId = req.groups.id;
          if (!groupsMap.has(groupId)) {
            groupsMap.set(groupId, { ...req.groups, requests: [], profiles: req.profiles });
          }
          groupsMap.get(groupId)!.requests.push(req);
        } else {
          freeRequests.push(req);
        }
      });

      const combinedItems = [...Array.from(groupsMap.values()), ...freeRequests];
      combinedItems.sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());
      
      setAllItems(combinedItems);

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Impossible de charger les données.';
        setError(message);
        console.error(err);
      } finally {
      setLoading(false); // On met setLoading(false) ici dans tous les cas
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenOfferModal = (request: Request) => {
    setSelectedRequest(request);
    setIsOfferModalOpen(true);
  };

  const handleViewOffers = (request: Request) => {
    setSelectedRequestForOffers(request);
    setIsOffersListModalOpen(true);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroupIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) { newSet.delete(groupId); } else { newSet.add(groupId); }
      return newSet;
    });
  };

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      if (clientFilter === 'Tous') return true;
      if ('requests' in item) {
        return item.profiles?.id === clientFilter;
      }
      return item.profiles?.id === clientFilter;
    });
  }, [allItems, clientFilter]);
  
  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    allItems.forEach(item => {
      if (item.profiles) {
        clients.set(item.profiles.id, item.profiles.email);
      }
    });
    return Array.from(clients.entries());
  }, [allItems]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p>Chargement des requêtes...</p></div>;
  }

  return (
    <>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord Agent</h1>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 flex items-center space-x-4">
             <div>
                <label className="text-sm font-medium mr-2">Client:</label>
                <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="p-2 border rounded-md bg-white">
                    <option value="Tous">Tous les clients</option>
                    {uniqueClients.map(([id, email]) => <option key={id} value={id}>{email}</option>)}
                </select>
            </div>
        </div>

        {error && <p className="text-red-500 p-4 bg-red-100 rounded-md">{error}</p>}
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-sm">Produit / Groupe</th>
                <th className="p-4 font-semibold text-sm">Client</th>
                <th className="p-4 font-semibold text-sm">Quantité</th>
                <th className="p-4 font-semibold text-sm">Spécification du Client</th>
                <th className="p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isGroup = 'requests' in item;
                
                return (
                  isGroup ? (
                    <GroupRow
                      key={item.id}
                      group={item}
                      isExpanded={expandedGroupIds.has(item.id)}
                      onToggle={() => toggleGroupExpansion(item.id)}
                    >
                      {item.requests.map(request => (
                         <RequestRow
                          key={request.id}
                          request={request}
                          onAddOfferClick={() => handleOpenOfferModal(request)}
                          onViewOffers={() => handleViewOffers(request)}
                          onImageClick={setPreviewImageUrl}
                          isInsideGroup={true}
                        />
                      ))}
                    </GroupRow>
                  ) : (
                    <RequestRow
                      key={item.id}
                      request={item}
                      onAddOfferClick={() => handleOpenOfferModal(item)}
                      onViewOffers={() => handleViewOffers(item)}
                      onImageClick={setPreviewImageUrl}
                    />
                  )
                );
              })}
            </tbody>
          </table>
          {filteredItems.length === 0 && !loading && !error && (
            <p className="p-6 text-center text-gray-500">Aucune requête ne correspond à vos filtres.</p>
          )}
        </div>
      </div>
      <AddOfferModal 
        open={isOfferModalOpen}
        onOpenChange={setIsOfferModalOpen}
        request={selectedRequest}
        onOfferAdded={fetchData}
      />
      <ImagePreviewModal
        open={!!previewImageUrl}
        onOpenChange={() => setPreviewImageUrl(null)}
        imageUrl={previewImageUrl}
      />
      <OffersModal
        open={isOffersListModalOpen}
        onOpenChange={setIsOffersListModalOpen}
        request={selectedRequestForOffers}
        onOfferUpdate={fetchData} 
      />
    </>
  );
}
