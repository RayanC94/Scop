'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Download, Plus } from 'lucide-react';

// On définit un type pour nos factures
type Invoice = {
  id: string;
  invoice_number: string;
  status: 'En attente de paiement' | 'Acompte versé' | 'Payée';
  total_amount: number;
  due_date: string;
};

// Un petit composant pour afficher le statut avec une couleur
const StatusBadge = ({ status }: { status: Invoice['status'] }) => {
  const colorClasses = {
    'Payée': 'bg-green-100 text-green-800',
    'Acompte versé': 'bg-blue-100 text-blue-800',
    'En attente de paiement': 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[status]}`}>
      {status}
    </span>
  );
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des factures:', error);
    } else {
      setInvoices(data as Invoice[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  if (loading) {
    return <div className="p-6 text-center">Chargement des factures...</div>;
  }

  return (
    // Conteneur principal pour la mise en page
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Factures</h1>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-sm">Numéro</th>
                <th className="p-4 font-semibold text-sm">Statut</th>
                <th className="p-4 font-semibold text-sm">Montant</th>
                <th className="p-4 font-semibold text-sm">Échéance</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{invoice.invoice_number}</td>
                  <td className="p-4"><StatusBadge status={invoice.status} /></td>
                  <td className="p-4">{invoice.total_amount.toFixed(2)} €</td>
                  <td className="p-4">{new Date(invoice.due_date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-gray-500 hover:text-black rounded-md hover:bg-gray-100">
                      <Download className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
              <p className="p-6 text-center text-gray-500">Aucune facture trouvée.</p>
          )}
        </div>
      </div>
    </div>
  );
}