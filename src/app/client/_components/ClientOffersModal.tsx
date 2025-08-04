'use client';

import { Request } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ClientOffersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
}

export default function ClientOffersModal({ open, onOpenChange, request }: ClientOffersModalProps) {
  if (!request || !request.offers) return null;

  // On s'assure de n'afficher que les offres visibles
  const visibleOffers = request.offers.filter(offer => offer.is_visible_to_client);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/40 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 max-h-[90vh] w-[90vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 flex flex-col">
          <Dialog.Title className="text-xl font-bold mb-4 text-gray-900">
            Offres disponibles pour &quot;{request.name}&quot;
          </Dialog.Title>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-sm text-gray-600 border-b">
                  <th className="p-4 font-semibold">Photo client</th>
                  <th className="p-4 font-semibold">Photo fournisseur</th>
                  <th className="p-4 font-semibold">Spécifications du produit fournisseur</th>
                  <th className="p-4 font-semibold">Emballage</th>
                  <th className="p-4 font-semibold">Prix unitaire</th>
                  <th className="p-4 font-semibold">Devise client</th>
                  <th className="p-4 font-semibold">Dimensions du produit</th>
                  <th className="p-4 font-semibold">Remarques</th>
                  <th className="p-4 font-semibold">Prix total</th>
                </tr>
              </thead>
              <tbody>
                {visibleOffers.map(offer => {
                  const placeholder = 'https://via.placeholder.com/100';
                  const clientImage = request.image_url || placeholder;
                  const supplierImage = offer.photo_url || placeholder;
                  const unitPrice = offer.unit_price_rmb / offer.exchange_rate;
                  const totalPrice = unitPrice * request.quantity;

                  return (
                    <tr key={offer.id} className="border-b last:border-b-0">
                      <td className="p-4">
                        <Image
                          src={clientImage}
                          alt={request.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-md object-cover bg-gray-100"
                        />
                      </td>
                      <td className="p-4">
                        <Image
                          src={supplierImage}
                          alt={offer.supplier_name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-md object-cover bg-gray-100"
                        />
                      </td>
                      <td className="p-4 text-sm">{offer.product_specs}</td>
                      <td className="p-4 text-sm">{offer.packaging_type}</td>
                      <td className="p-4 text-sm font-mono">{unitPrice.toFixed(2)}</td>
                      <td className="p-4 text-sm">{offer.client_currency}</td>
                      <td className="p-4 text-sm">{offer.size || '-'}</td>
                      <td className="p-4 text-sm">{offer.remarks || '-'}</td>
                      <td className="p-4 text-sm font-mono">{totalPrice.toFixed(2)} {offer.client_currency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleOffers.length === 0 && (
                <p className="p-6 text-center text-gray-500">Aucune offre n&apos;est actuellement disponible pour cette requête.</p>
            )}
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}