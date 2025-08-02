'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, Truck, Anchor, Package, Archive } from 'lucide-react';

// Types pour les données de la page
type OrderEvent = {
  id: number;
  created_at: string;
  status: 'Production' | 'Expédition' | 'Transit' | 'Livrée' | 'Archivée';
  description: string;
  estimated_duration_days: number;
};

type Order = {
  id: string;
  order_number: string;
  status: 'Production' | 'Expédition' | 'Transit' | 'Livrée' | 'Archivée';
  estimated_delivery_date: string;
  order_events: OrderEvent[];
};

// Icônes pour chaque statut
const statusIcons = {
  Production: <Package className="h-6 w-6 text-white" />,
  Expédition: <Truck className="h-6 w-6 text-white" />,
  Transit: <Anchor className="h-6 w-6 text-white" />,
  Livrée: <CheckCircle className="h-6 w-6 text-white" />,
  Archivée: <Archive className="h-6 w-6 text-white" />,
};

// Couleurs pour chaque statut
const statusColors = {
  Production: 'bg-blue-500',
  Expédition: 'bg-orange-500',
  Transit: 'bg-indigo-500',
  Livrée: 'bg-green-500',
  Archivée: 'bg-gray-500',
};

// Calcule les jours restants pour une étape
const getDaysRemaining = (event: OrderEvent) => {
    const startDate = new Date(event.created_at);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + event.estimated_duration_days);
    const today = new Date();
    const remainingTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
};

const OrderTimeline = ({ order }: { order: Order }) => {
  const currentStatusIndex = order.order_events.findIndex(event => event.status === order.status);

  return (
    <div className="p-6">
      <h3 className="font-bold mb-4">Chronologie de la commande {order.order_number}</h3>
      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200" />
        
        {order.order_events.map((event, index) => {
          const isCompleted = index < currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <div key={event.id} className="flex items-start mb-8">
              <div className={`z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted || isCurrent ? statusColors[event.status] : 'bg-gray-300'
              }`}>
                {statusIcons[event.status]}
              </div>
              <div className="ml-4">
                <p className={`font-bold ${isCurrent ? 'text-black' : 'text-gray-600'}`}>{event.status}</p>
                <p className="text-sm text-gray-500">{event.description}</p>
                {isCurrent && (
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                        Jours restants estimé : {getDaysRemaining(event)}
                    </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default function TrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_events(*)')
      .in('status', ['Production', 'Expédition', 'Transit', 'Livrée'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement du suivi...</div>;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Suivi de Commande</h1>
        
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => toggleOrderDetails(order.id)}>
                        <div>
                            <p className="font-bold text-lg">{order.order_number}</p>
                            <p className="text-sm text-gray-500">Livraison estimée le {new Date(order.estimated_delivery_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-semibold">Statut actuel</p>
                           <p className={`font-bold ${statusColors[order.status].replace('bg-', 'text-')}`}>{order.status}</p>
                        </div>
                    </div>
                    {expandedOrderId === order.id && <OrderTimeline order={order} />}
                </div>
            ))}
        </div>

        {orders.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-500">Aucune commande en cours de suivi.</p>
            </div>
        )}
      </div>
    </div>
  );
}
