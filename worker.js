// Actualiza el job con los resultados finales y lo marca como completado
async function updateJobResult(id, transcription, summary, progress = 100) {
  const { error, data } = await supabase.from('jobs').update({
    status: 'completed',
    raw_transcription: transcription,
    ai_summary: summary,
    progress,
    updated_at: new Date().toISOString(),
    error_message: null
  }).eq('id', id);
  if (error) {
    console.error('Error al actualizar job como completed en Supabase:', error);
  } else {
    console.log('Job actualizado como completed en Supabase:', id);
  }
}
require('dotenv').config();

// ClipNotes Worker: Procesa jobs pendientes en Supabase usando yt-dlp, Whisper y GPT-4o-mini
// Requisitos: node-fetch, @supabase/supabase-js, openai, child_process, fs, path
// Instala dependencias: npm install node-fetch @supabase/supabase-js openai
// yt-dlp debe estar instalado en el sistema y en el PATH

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


// Configuración y clientes
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TU_SUPABASE_URL';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY';
const OPENAI_KEY = process.env.OPENAI_API_KEY || 'TU_OPENAI_KEY';


console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY:', SUPABASE_KEY ? SUPABASE_KEY.slice(0, 8) + '...' : 'undefined');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

async function getPendingJob() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  console.log('getPendingJob result:', data);
  return data;
}

async function updateJob(id, fields) {
  await supabase.from('jobs').update(fields).eq('id', id);
}

function downloadAudioWithYtDlp(url, jobId) {
  // Usar una carpeta única por job dentro de ./tmp
  const jobDir = path.join('tmp', jobId);
  if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
  const outPath = path.join(jobDir, `audio_${Date.now()}.mp3`);
  try {
    // Mostrar salida de error de yt-dlp para debug
    execSync(`python -m yt_dlp -x --audio-format mp3 -o "${outPath}" "${url}"`, { stdio: 'inherit' });
    if (!fs.existsSync(outPath)) throw new Error('No se pudo descargar el audio');
    return outPath;
  } catch (e) {
    throw new Error('Error al descargar audio con yt-dlp: ' + e.message);
  }
}

async function transcribeAudio(filePath) {
  const file = fs.createReadStream(filePath);
  const resp = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'text',
    language: 'es',
  });
  return resp.text || resp;
}

async function summarizeText(text) {
  const prompt = `Resume el siguiente texto en español, extrae los puntos clave y genera una lista de acciones si corresponde.\n\nTexto:\n${text}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Eres un asistente experto en resumir reuniones y videos.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 800,
    temperature: 0.4,
  });
  return resp.choices[0].message.content.trim();
}

async function processJob() {
  const job = await getPendingJob();
  if (!job) {
    console.log('No hay jobs pendientes.');
    return;
  }
  try {
    // Marcar job como en procesamiento para evitar duplicados
    await updateJob(job.id, { status: 'processing', updated_at: new Date().toISOString() });
    console.log('Procesando job:', job.id);
    // Descargar audio
    try {
      await updateJob(job.id, { progress: 10, updated_at: new Date().toISOString() });
      console.log('Descargando audio...');
      var audioPath = await downloadAudioWithYtDlp(job.input_url, job.id);
      await updateJob(job.id, { progress: 30, updated_at: new Date().toISOString() });
      console.log('Audio descargado:', audioPath);
    } catch (e) {
      console.error('Error al descargar audio:', e);
      throw e;
    }
    // Transcribir audio
    let transcription;
    try {
      console.log('Transcribiendo audio...');
      transcription = await transcribeAudio(audioPath);
      await updateJob(job.id, { progress: 60, updated_at: new Date().toISOString() });
      console.log('Transcripción completada.');
    } catch (e) {
      console.error('Error en transcripción:', e);
      throw e;
    }
    // Resumir transcripción
    let summary;
    try {
      console.log('Resumiendo transcripción...');
      summary = await summarizeText(transcription);
      await updateJob(job.id, { progress: 90, updated_at: new Date().toISOString() });
      console.log('Resumen completado.');
    } catch (e) {
      console.error('Error en resumen:', e);
      throw e;
    }
    // Guardar resultados en Supabase
    try {
      console.log('Guardando resultados en Supabase...');
      await updateJobResult(job.id, transcription, summary, 100);
      console.log('Job completado:', job.id);
    } catch (e) {
      console.error('Error guardando resultados:', e);
      throw e;
    }
  } catch (error) {
    console.error('Error procesando job:', job.id, error);
    // Marcar job como error en Supabase
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'error', error_message: error.message || String(error), updated_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) {
        console.error('Error actualizando job con estado error:', updateError);
      } else {
        console.log('Job marcado como error:', job.id);
      }
    } catch (e) {
      console.error('Error inesperado al marcar job como error:', e);
    }
  }
}
// Loop infinito cada 10 segundos
setInterval(processJob, 10000);
processJob();
