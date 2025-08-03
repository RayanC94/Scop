// src/types/index.ts

export interface Request {
  id: string;
  name: string;
  quantity: number;
  image_url: string;
  last_modified: string;
  specification?: string | null;
  position?: number | null;
  // Ajout pour lier la requête à un profil client
  profiles?: {
    id: string;
    email: string;
  } | null;
}

export interface RequestGroup {
  id: string;
  name: string;
  requests: Request[];
  position?: number | null;
  last_modified: string;
  // Ajout pour lier le groupe à un profil client
  profiles?: {
    id: string;
    email: string;
  } | null;
}

export interface Company {
  id: string;
  created_at: string;
  name: string;
  address: string | null;
  vat_number: string | null;
  country: string | null;
}

// NOUVEAU : Interface pour les offres des fournisseurs
export interface Offer {
  id: string;
  created_at: string;
  request_id: string;
  supplier_name: string;
  product_specs: string;
  packaging_type: string;
  unit_price_rmb: number;
  unit_weight: number;
  unit_volume: number;
  quality_details: string;
  remarks: string | null;
  photo_url: string | null;
  is_visible_to_client: boolean;
}
