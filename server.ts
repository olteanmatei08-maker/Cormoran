import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Chat endpoint for Patrula Cormoran AI Sfetnic
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY lipsește din variabilele de mediu.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const selectedModel = model || 'models/gemini-3.8-flash';

    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return res.json({ reply: response.text || '' });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${selectedModel} failed, trying gemini-2.5-flash fallback:`, primaryErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return res.json({ reply: fallbackResponse.text || '' });
    }
  } catch (err: any) {
    console.error('Gemini server error:', err);
    return res.status(500).json({ error: err?.message || 'A apărut o eroare la procesarea cererii către asistent.' });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server Cormo pornit pe http://0.0.0.0:${port}`);
});
