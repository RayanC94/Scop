'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, Clipboard } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
}

export default function ImagePreviewModal({ open, onOpenChange, imageUrl }: ImagePreviewModalProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading'>('idle');

  if (!imageUrl) return null;

  const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);

  // Fonction pour copier l'image en la convertissant en PNG
  const handleCopyImage = async () => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      alert("La copie d'image n'est pas supportée par votre navigateur.");
      return;
    }
    setCopyStatus('idle');
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous'; // Important pour les images cross-domain
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
              setCopyStatus('success');
            } else {
              throw new Error('Canvas toBlob returned null');
            }
          }, 'image/png');
        } else {
           throw new Error('Could not get canvas context');
        }
      };
      img.onerror = () => {
        throw new Error('Image could not be loaded for copying');
      }
    } catch (error) {
      console.error("Erreur lors de la copie de l'image :", error);
      setCopyStatus('error');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Fonction pour forcer le téléchargement
  const handleDownload = async () => {
    setDownloadStatus('loading');
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image :", error);
    } finally {
      setDownloadStatus('idle');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/70 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-[90vw] max-w-4xl max-h-[90vh] flex flex-col -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg focus:outline-none z-50 p-4">
          <Dialog.Title className="sr-only">Aperçu de l'image</Dialog.Title>
          
          <div className="relative flex-grow w-full min-h-[300px] md:min-h-[500px]">
             <Image
                src={imageUrl}
                alt="Aperçu de l'image"
                fill
                className="object-contain"
              />
          </div>

          <div className="flex-shrink-0 mt-4 flex items-center justify-center w-full space-x-4">
            <button 
              onClick={handleCopyImage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Clipboard className="w-4 h-4" />
              {copyStatus === 'success' ? 'Copié !' : copyStatus === 'error' ? 'Erreur' : 'Copier l\'image'}
            </button>

            <button 
              onClick={handleDownload}
              disabled={downloadStatus === 'loading'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloadStatus === 'loading' ? 'Chargement...' : 'Télécharger'}
            </button>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-3 right-3 p-1 rounded-full bg-white/50 hover:bg-white transition-colors" aria-label="Close">
              <X className="h-5 w-5 text-black" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
