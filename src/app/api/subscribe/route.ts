import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Guarda la suscripción PayPal en el perfil del usuario
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, planTier } = body;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const user = userData.user;
    if (!subscriptionId) return NextResponse.json({ error: 'Falta subscriptionId' }, { status: 400 });
    // Validar planTier
    const validTiers = ['pro', 'basic', 'free', 'owner', 'no_cost'];
    const tier = validTiers.includes(planTier) ? planTier : 'pro';
    // Actualiza el perfil del usuario con el subscriptionId y plan_tier correcto
    const { error: updateError } = await supabase.from('profiles').update({
      plan_tier: tier,
      paypal_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error inesperado' }, { status: 500 });
  }
}
