import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

// API para obtener la duración de un video usando yt-dlp sin descargarlo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    // Usar yt-dlp para obtener solo la información del video (sin descargarlo)
    const command = `python -m yt_dlp --get-duration "${url}"`;
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 15000 // 15 segundos timeout
      });
      
      const durationStr = output.toString().trim();
      
      // Convertir duración de formato HH:MM:SS o MM:SS a segundos
      const durationSeconds = parseDurationToSeconds(durationStr);
      
      return NextResponse.json({ 
        durationSeconds,
        durationFormatted: durationStr
      });
      
    } catch (execError: any) {
      console.error('Error ejecutando yt-dlp:', execError);
      return NextResponse.json({ 
        error: 'No se pudo obtener la duración del video. Verifica que la URL sea válida.' 
      }, { status: 500 });
    }

  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message || 'Error inesperado' 
    }, { status: 500 });
  }
}

// Convierte duración de formato HH:MM:SS o MM:SS a segundos
function parseDurationToSeconds(durationStr: string): number {
  const parts = durationStr.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS
    return parts[0];
  }
  
  return 0;
}
