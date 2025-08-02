'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
}

export default function ImagePreviewModal({ open, onOpenChange, imageUrl }: ImagePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/60 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-auto max-w-[90vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg focus:outline-none z-50">
          <Image
            src={imageUrl}
            alt="Aperçu de l'image"
            width={800}
            height={800}
            className="w-auto h-auto max-w-full max-h-[85vh] object-contain"
          />
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 p-1 rounded-full bg-white/50 hover:bg-white" aria-label="Close">
              <X className="h-5 w-5 text-black" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}