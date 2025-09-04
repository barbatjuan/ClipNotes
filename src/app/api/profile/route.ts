import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Actualizar información del perfil del usuario
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Datos recibidos en /api/profile:', body); // Debug
    const { full_name, email, language, default_summary_style } = body;
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const user = userData.user;
    console.log('Usuario actual:', { id: user.id, email: user.email, metadata: user.user_metadata }); // Debug

    // Nota: No actualizamos auth metadata desde el servidor por limitaciones de permisos
    // Solo manejamos cambios de email si es diferente
    if (email && email !== user.email) {
      console.log('Email change requested but not implemented in server-side');
      // Por ahora, no actualizar email desde server-side
      // return NextResponse.json({ 
      //   error: 'Cambio de email debe hacerse desde el dashboard del usuario' 
      // }, { status: 400 });
    }

    // Actualizar preferencias en la tabla profiles
    if (language !== undefined || default_summary_style !== undefined) {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (language !== undefined) updateData.language = language;
      if (default_summary_style !== undefined) updateData.default_summary_style = default_summary_style;
      
      console.log('Actualizando profile con:', updateData, 'para user_id:', user.id); // Debug
      
      // Primero verificar si existe el perfil
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
      
      if (!existingProfile) {
        // Crear perfil si no existe
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            plan_tier: 'free',
            minutes_processed_current_month: 0,
            monthly_minutes_limit: 10,
            language: language || 'es',
            default_summary_style: default_summary_style || 'ejecutivo',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (insertError) {
          console.error('Error creando perfil:', insertError); // Debug
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      } else {
        // Actualizar perfil existente
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id);
        
        if (profileError) {
          console.error('Error actualizando perfil:', profileError); // Debug
          return NextResponse.json({ error: profileError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: email && email !== user.email 
        ? 'Perfil actualizado. Revisa tu correo para verificar la nueva dirección.'
        : 'Perfil actualizado correctamente.'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error inesperado' }, { status: 500 });
  }
}

// Obtener información del perfil del usuario
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const user = userData.user;

    // Obtener perfil completo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        ...profile
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error inesperado' }, { status: 500 });
  }
}
