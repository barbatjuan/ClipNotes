import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
  const { url, title } = body;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const user = userData.user;
    if (!url) return NextResponse.json({ error: 'Falta el link o archivo' }, { status: 400 });
    const { data, error } = await supabase.from('jobs').insert([
      {
        user_id: user.id,
        input_url: url,
        title: title || null,
        status: 'pending',
        audio_duration: null,
        raw_transcription: null,
        ai_summary: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ job: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error inesperado' }, { status: 500 });
  }
}
