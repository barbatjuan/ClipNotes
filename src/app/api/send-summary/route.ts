import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { to, subject, title, summary, link } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Falta RESEND_API_KEY' }, { status: 500 });
    }
    if (!to) {
      return NextResponse.json({ error: 'Falta destinatario' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const brandColor = '#4F46E5';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clipnotes.app';
    const html = `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0f172a; background:#f6f8fb; padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(2,6,23,.05);">
          <tr>
            <td style="padding:20px 24px; background:linear-gradient(135deg, ${brandColor}, #6D28D9); color:#fff;">
              <div style="font-weight:800; font-size:18px; letter-spacing:.2px;">ClipNotes</div>
              <div style="opacity:.9; font-size:12px; margin-top:2px;">De video a notas en segundos</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 12px;">
              <h1 style="margin:0 0 6px; font-size:20px; color:#0f172a;">${title || 'Resumen procesado'}</h1>
              <p style="margin:0; color:#475569; font-size:14px;">Aquí tienes el resumen generado por ClipNotes.</p>
              ${link ? `
                <div style="margin-top:14px;">
                  <a href="${link}" target="_blank" rel="noreferrer" style="display:inline-block; background:${brandColor}; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600; font-size:14px;">Abrir enlace original</a>
                </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 24px;">
              <div style="border:1px solid #e2e8f0; background:#f8fafc; border-radius:12px; padding:14px;">
                <div style="font-size:13px; color:#0f172a; font-weight:700; margin-bottom:6px;">Resumen</div>
                <div style="white-space:pre-wrap; font-size:14px; color:#0f172a;">${summary || 'Sin resumen'}</div>
              </div>
              <div style="margin-top:16px; font-size:12px; color:#64748b;">
                Enviado con <strong>ClipNotes</strong>. Accede a tus resúmenes en <a href="${appUrl}" target="_blank" rel="noreferrer" style="color:${brandColor}; text-decoration:underline;">${appUrl.replace('https://','').replace('http://','')}</a>.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px; background:#0b1220; color:#cbd5e1; font-size:12px;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
                <span>© ${new Date().getFullYear()} ClipNotes</span>
                <a href="${appUrl}" target="_blank" rel="noreferrer" style="color:#cbd5e1; text-decoration:underline;">Ir a ClipNotes</a>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Ensure a valid 'from' format: "Name <email>". If invalid, use onboarding@resend.dev
    const envFrom = process.env.RESEND_FROM;
    const from = envFrom && /<[^>]+@[^>]+>/.test(envFrom)
      ? envFrom
      : 'ClipNotes <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from,
      to,
      subject: subject || 'ClipNotes - Resumen',
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'No se pudo enviar el correo', code: 'RESEND_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 });
  }
}
