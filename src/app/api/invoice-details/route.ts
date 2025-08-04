// src/app/api/invoice-details/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Les variables d'environnement Supabase ne sont pas définies.");
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { request_ids } = await request.json();

    if (!request_ids || !Array.isArray(request_ids)) {
      return NextResponse.json({ error: 'request_ids est manquant ou invalide' }, { status: 400 });
    }

    // Cette requête s'exécute avec les droits admin et contourne toutes les RLS
    const { data, error } = await supabaseAdmin
      .from('requests')
      .select('*, offers(*)')
      .in('id', request_ids);

    if (error) {
      console.error('Erreur Supabase Admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Une erreur interne est survenue.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }