// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirige immédiatement l'utilisateur vers la page de connexion
  redirect('/login');

  // On peut retourner null ou un simple loader, car la redirection se produit avant que quoi que ce soit ne s'affiche.
  return null;
}