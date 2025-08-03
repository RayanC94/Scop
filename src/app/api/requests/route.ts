import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Request, RequestGroup as RequestGroupType, Offer } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Les variables d'environnement Supabase ne sont pas définies !");
}

// Type pour la réponse de l'API
type RequestApiResponse = Request & {
  offers: Offer[];
  profiles: { id: string; email: string } | null;
  groups: RequestGroupType | null;
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Crée un client Supabase avec la clé de service pour bypasser les RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Vérifie la validité du token et le rôle de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    // CORRECTION: La bonne syntaxe est user.app_metadata
    if (userError || !user || user.app_metadata?.role !== 'agent') {
      return NextResponse.json({ error: 'Forbidden: Not an agent or invalid token' }, { status: 403 });
    }

    // Récupère les données en tant qu'administrateur
    const { data, error } = await supabase
      .from('requests')
      .select('*, groups(*), profiles(id, email), offers(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as RequestApiResponse[], { status: 200 });

  } catch (e: any) {
    console.error("Erreur inattendue dans l'API Route:", e);
    return NextResponse.json({ error: e.message || "Une erreur interne est survenue." }, { status: 500 });
  }
}
