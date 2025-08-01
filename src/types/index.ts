export interface Request {
    id: string;
    name: string;
    quantity: number;
    imageUrl: string;
    lastModified: string;
    specification?: string | null; // Champ optionnel
  }
  
  export interface RequestGroup {
    id: string;
    name: string;
    requests: Request[];
  }