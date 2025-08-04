'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, CheckCircle, Clock, FileSpreadsheet, Download } from 'lucide-react';
import InvoiceRequestDetailsModal from '../_components/InvoiceRequestDetailsModal';

// ... (Types et StatusBadge restent inchangés) ...
type InvoiceRequest = {
  id: string;
  created_at: string;
  status: 'pending' | 'processed';
  total_price: number;
  format: 'pdf' | 'excel';
  request_ids: string[];
  user_id: string; 
  company_id: string | null;
  client_email: string | null;
  company_name: string | null;
};

const StatusBadge = ({ status }: { status: InvoiceRequest['status'] }) => {
  const isPending = status === 'pending';
  const colorClasses = isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
  const Icon = isPending ? Clock : CheckCircle;
  return (
    <span className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
      <Icon className="h-3 w-3" />
      {isPending ? 'En attente' : 'Traitée'}
    </span>
  );
};


export default function AgentInvoicesPage() {
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InvoiceRequest | null>(null);

  const fetchInvoiceRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_agent_invoice_requests');
    if (error) console.error('Erreur RPC:', error);
    else setRequests(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoiceRequests();
  }, [fetchInvoiceRequests]);

  const handleOpenDetails = (request: InvoiceRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  // La fonction accepte maintenant l'ID de la compagnie de l'agent
  const handleGenerateInvoice = async (agentCompanyId: string) => {
    if (!selectedRequest || !agentCompanyId) return;

    const { data: { user: agentUser } } = await supabase.auth.getUser();
    if (!agentUser) {
      alert("Erreur: Agent non identifié.");
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newInvoice = {
      request_id: selectedRequest.id,
      agent_id: agentUser.id,
      client_id: selectedRequest.user_id,
      company_id: selectedRequest.company_id,
      agent_company_id: agentCompanyId, // On sauvegarde la compagnie choisie
      invoice_number: `INV-${Date.now()}`,
      total_amount: selectedRequest.total_price,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'En attente de paiement',
    };

    const { error: insertError } = await supabase.from('invoices').insert(newInvoice);
    if (insertError) {
      alert(`Erreur lors de la création de la facture: ${insertError.message}`);
      return;
    }

    const { error: updateError } = await supabase
      .from('invoice_requests')
      .update({ status: 'processed' })
      .eq('id', selectedRequest.id);
    
    if (updateError) {
      alert(`Erreur lors de la mise à jour: ${updateError.message}`);
      return;
    }

    setRequests(current => current.map(req => req.id === selectedRequest.id ? { ...req, status: 'processed' } : req));
    setIsDetailsModalOpen(false);
  };

  const handleDownloadInvoice = (request: InvoiceRequest) => {
    alert(`Téléchargement de la facture pour ${request.client_email} au format ${request.format.toUpperCase()}.`);
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement...</div>;
  }

  return (
    <>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Factures</h1>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-sm">Client</th>
                  <th className="p-4 font-semibold text-sm">Facturer à</th>
                  <th className="p-4 font-semibold text-sm">Montant Total</th>
                  <th className="p-4 font-semibold text-sm">Date de demande</th>
                  <th className="p-4 font-semibold text-sm">Format</th>
                  <th className="p-4 font-semibold text-sm">Statut</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 font-medium">{req.client_email || 'N/A'}</td>
                    <td className="p-4">{req.company_name || 'Nom propre'}</td>
                    <td className="p-4 font-mono font-bold">{req.total_price.toFixed(2)} EUR</td>
                    <td className="p-4">{new Date(req.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        {req.format === 'pdf' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                        {req.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4"><StatusBadge status={req.status} /></td>
                    <td className="p-4 text-right">
                      {req.status === 'pending' ? (
                        <button onClick={() => handleOpenDetails(req)} className="bg-black text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800">
                          Vérifier et Gérer
                        </button>
                      ) : (
                        <button onClick={() => handleDownloadInvoice(req)} className="bg-white border text-gray-700 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 flex items-center ml-auto">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
                <p className="p-6 text-center text-gray-500">Aucune demande de facture.</p>
            )}
          </div>
        </div>
      </div>
      
      <InvoiceRequestDetailsModal 
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        request={selectedRequest}
        onInvoiceGenerated={handleGenerateInvoice}
      />
    </>
  );
}