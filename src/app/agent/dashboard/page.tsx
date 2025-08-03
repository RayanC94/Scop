'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Request, RequestGroup as RequestGroupType, Offer } from '@/types';
import { ChevronDown, User, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import AddOfferModal from '../_components/AddOfferModal';

// Ajout des offres aux types de données
type RequestWithOffers = Request & { offers: Offer[] };
type RequestGroupWithOffers = Omit<RequestGroupType, 'requests'> & { requests: RequestWithOffers[] };
type ClientData = {
  client: { id: string; email: string };
  requests: RequestWithOffers[];
  groups: RequestGroupWithOffers[];
};

export default function AgentDashboardPage() {
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openClientIds, setOpenClientIds] = useState<Set<string>>(new Set());
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    // ... (le reste de la fonction fetchData reste identique pour le moment)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('requests')
      .select('*, groups(*), profiles(id, email), offers(*)') // On charge les offres en même temps
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur de chargement:', error);
      setLoading(false);
      return;
    }

    const organizedData: { [key: string]: ClientData } = {};
    
    data.forEach((d: any) => {
      const client = d.profiles;
      if (!client) return;

      if (!organizedData[client.id]) {
        organizedData[client.id] = {
          client: { id: client.id, email: client.email },
          requests: [],
          groups: [],
        };
      }
      
      const requestWithOffers = d as RequestWithOffers;

      if (d.groups) {
        const group = organizedData[client.id].groups.find(g => g.id === d.groups.id);
        if (group) {
          group.requests.push(requestWithOffers);
        } else {
          organizedData[client.id].groups.push({
            ...d.groups,
            requests: [requestWithOffers],
          });
        }
      } else {
        organizedData[client.id].requests.push(requestWithOffers);
      }
    });

    setClientData(Object.values(organizedData));
    if (Object.keys(organizedData).length > 0) {
      setOpenClientIds(new Set([Object.keys(organizedData)[0]]));
    }

    setLoading(false);
  }, [router]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleOpenOfferModal = (request: Request) => {
    setSelectedRequest(request);
    setIsOfferModalOpen(true);
  };

  const toggleClient = (clientId: string) => {
    setOpenClientIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p>Chargement des requêtes...</p></div>;
  }

  return (
    <>
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Agent</h1>
        
        <div className="space-y-4">
          {clientData.map(({ client, requests, groups }) => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <button 
                onClick={() => toggleClient(client.id)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="font-bold text-lg">{client.email}</span>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${openClientIds.has(client.id) ? 'rotate-180' : ''}`} />
              </button>

              {openClientIds.has(client.id) && (
                <div className="p-4 space-y-4">
                  {groups.map(group => (
                    <div key={group.id} className="border rounded-md p-3 bg-gray-50/50">
                      <h3 className="font-semibold mb-2 text-gray-800">{group.name}</h3>
                      {group.requests.map(req => (
                        <RequestCardAgent key={req.id} request={req} onAddOffer={handleOpenOfferModal} />
                      ))}
                    </div>
                  ))}
                  {requests.map(req => (
                    <RequestCardAgent key={req.id} request={req} onAddOffer={handleOpenOfferModal} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {clientData.length === 0 && !loading && (
            <p className="p-6 text-center text-gray-500">Aucune requête de client trouvée.</p>
          )}
        </div>
      </div>
      <AddOfferModal 
        open={isOfferModalOpen}
        onOpenChange={setIsOfferModalOpen}
        request={selectedRequest}
        onOfferAdded={fetchData}
      />
    </>
  );
}

// Composant pour afficher une carte de requête et ses offres
function RequestCardAgent({ request, onAddOffer }: { request: RequestWithOffers, onAddOffer: (req: Request) => void }) {
  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm mb-4">
      <div className="flex items-start gap-4">
        <Image
          src={request.image_url || 'https://via.placeholder.com/100'}
          alt={request.name}
          width={80}
          height={80}
          className="w-20 h-20 rounded-md object-cover bg-gray-100"
        />
        <div className="flex-1">
          <p className="font-bold text-lg">{request.name}</p>
          <p className="text-sm text-gray-600">Quantité : {request.quantity}</p>
          {request.specification && <p className="text-xs text-gray-500 mt-1">Spéc. : {request.specification}</p>}
        </div>
        <button 
          onClick={() => onAddOffer(request)}
          className="bg-black text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800"
        >
          Ajouter Offre
        </button>
      </div>
      {/* Section pour afficher les offres */}
      {request.offers && request.offers.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Offres Fournisseurs ({request.offers.length})</h4>
          <div className="space-y-2">
            {request.offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher une carte d'offre
function OfferCard({ offer }: { offer: Offer }) {
  return (
    <div className="bg-gray-50 p-3 rounded-md border flex justify-between items-center">
      <div>
        <p className="font-semibold">{offer.supplier_name}</p>
        <p className="text-sm text-gray-700">Prix : <span className="font-mono">{offer.unit_price_rmb.toFixed(2)} RMB</span></p>
      </div>
      <div className="flex items-center gap-2">
        <button className={`p-1 rounded-full ${offer.is_visible_to_client ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {offer.is_visible_to_client ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button className="p-1 text-gray-500 hover:text-black"><Edit className="h-4 w-4" /></button>
        <button className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
