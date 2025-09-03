import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, style = 'ejecutivo' } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  // Prompts para cada estilo
  const prompts: Record<string, string> = {
    ejecutivo: `Eres un asistente experto en generar resúmenes ejecutivos claros y accionables para equipos de negocio.\nTu tarea: transformar transcripciones en resúmenes útiles para la toma de decisiones.\nDebes:\n- Extraer lo esencial sin redundancia.\n- Incluir decisiones tomadas, dudas abiertas y riesgos detectados.\n- Organizar en secciones: ## Puntos clave, ## Acciones recomendadas, ## Alertas (si aplica), ## Conclusiones.\n- Mantener un tono profesional y orientado a resultados.\nTexto original:\n{transcripción}`,
    tecnico: `Eres un asistente especializado en resumir conversaciones técnicas para equipos de desarrollo y QA.\nTu objetivo es crear un resumen preciso y orientado a tareas.\nDebes:\n- Destacar issues, bugs, deadlines, dependencias y responsables.\n- Incluir pasos concretos bajo \"Acciones recomendadas\".\n- Identificar riesgos y mencionarlos en \"Alertas\".\n- Mantener el lenguaje claro y profesional.\nTexto original:\n{transcripción}`,
    amigable: `Eres un asistente que crea resúmenes claros, fáciles de entender y con tono amigable.\nTu objetivo es contar lo más importante en pocas palabras para que cualquiera lo entienda.\nDebes:\n- Explicar los puntos clave en frases simples.\n- Incluir acciones si hay próximas tareas.\n- Usar un formato con secciones: ## Puntos clave, ## Acciones, ## Nota final.\nTexto original:\n{transcripción}`
  };

  const systemPrompt = prompts[style] || prompts['ejecutivo'];

  try {
    const userPrompt = text;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 700,
      }),
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'No se pudo generar resumen.';
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con OpenAI' });
  }
}
