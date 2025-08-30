import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente que resume textos.' },
          { role: 'user', content: `Resume el siguiente texto:\n${text}` }
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'No se pudo generar resumen.';
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con OpenAI' });
  }
}
