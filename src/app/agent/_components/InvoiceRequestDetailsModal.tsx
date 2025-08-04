'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Offer, Request } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';

// Types (inchangés)
type InvoiceRequest = {
  id: string;
  total_price: number;
  request_ids: string[];
  client_email: string | null;
  company_name: string | null;
};
type AgentCompany = { id: string; company_name: string | null; email: string | null };
type RequestWithOfferDetails = Request & { offer: Offer };

interface InvoiceRequestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InvoiceRequest | null;
  onInvoiceGenerated: (agentCompanyId: string) => void;
}

export default function InvoiceRequestDetailsModal({ open, onOpenChange, request, onInvoiceGenerated }: InvoiceRequestDetailsModalProps) {
  const [details, setDetails] = useState<RequestWithOfferDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentCompanies, setAgentCompanies] = useState<AgentCompany[]>([]);
  const [selectedAgentCompany, setSelectedAgentCompany] = useState<string>('');

  useEffect(() => {
    if (open && request) {
      const fetchAllData = async () => {
        setLoading(true);
        
        // Correction : On récupère les compagnies de l'agent directement avec Supabase
        const { data: companiesData } = await supabase.from('agent_companies').select('id, company_name, email');
        if (companiesData) {
            setAgentCompanies(companiesData);
            if (companiesData.length === 1) {
                setSelectedAgentCompany(companiesData[0].id);
            }
        }

        // Appel à notre route API sécurisée
        try {
          const response = await fetch('/api/invoice-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_ids: request.request_ids }),
          });

          if (!response.ok) {
            throw new Error('La réponse du serveur n\'est pas OK');
          }

          // Correction : On utilise response.json() pour extraire les données
          const data = await response.json();
          
          const detailedItems = data.map((req: any) => {
            const visibleOffer = req.offers.find((o: Offer) => o.is_visible_to_client);
            return visibleOffer ? { ...req, offer: visibleOffer } : null;
          }).filter(Boolean) as RequestWithOfferDetails[];
          setDetails(detailedItems);

        } catch (error) {
          console.error("Erreur lors de la récupération des détails via l'API:", error);
          setDetails([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    }
  }, [open, request]);

  if (!request) return null;

  // Le JSX reste identique
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[90vh] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 flex flex-col">
          <Dialog.Title className="text-xl font-bold mb-2 text-gray-900">Détail de la demande de facture</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Client: {request.client_email} ({request.company_name || 'Nom propre'})
          </Dialog.Description>
          
          <div className="flex-1 overflow-y-auto -mx-6 px-6 border-t border-b">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <table className="w-full text-left my-4">
                <thead>
                  <tr className="text-sm">
                    <th className="p-2 font-semibold">Produit</th>
                    <th className="p-2 font-semibold">Quantité</th>
                    <th className="p-2 font-semibold text-right">Prix Unitaire</th>
                    <th className="p-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map(item => {
                    const unitPrice = item.offer.unit_price_rmb / item.offer.exchange_rate;
                    const totalPrice = unitPrice * item.quantity;
                    return (
                      <tr key={item.id} className="text-sm border-b last:border-b-0">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">{unitPrice.toFixed(2)} {item.offer.client_currency}</td>
                        <td className="p-2 text-right font-mono font-semibold">{totalPrice.toFixed(2)} {item.offer.client_currency}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="agent-company" className="text-sm font-medium">Facturer avec la compagnie :</label>
            <select
                id="agent-company"
                value={selectedAgentCompany}
                onChange={(e) => setSelectedAgentCompany(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white"
                disabled={loading || agentCompanies.length === 0}
            >
                {agentCompanies.length !== 1 && <option value="">-- Choisir une compagnie --</option>}
                {agentCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name || c.email}</option>
                ))}
            </select>
          </div>

          <div className="flex justify-between items-center pt-6 mt-4 border-t">
            <div>
              <span className="text-sm text-gray-600">Total Général</span>
              <p className="text-2xl font-bold">{request.total_price.toFixed(2)} EUR</p>
            </div>
            <button
                onClick={() => onInvoiceGenerated(selectedAgentCompany)}
                disabled={!selectedAgentCompany || loading}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              Générer la Facture
            </button>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}