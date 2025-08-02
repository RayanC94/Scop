export interface Request {
  id: string;
  name: string;
  quantity: number;
  image_url: string;
  last_modified: string; // Nous allons remplacer ça par position
  specification?: string | null;
  position?: number | null; // Ajout de la position
}

export interface RequestGroup {
  id: string;
  name: string;
  requests: Request[];
  position?: number | null; // Ajout de la position
  last_modified: string; // On garde pour le groupe
}

export interface Company {
  id: string;
  created_at: string;
  name: string;
  address: string | null;
  vat_number: string | null;
  country: string | null;
}