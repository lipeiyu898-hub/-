import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // API Routes
  
  // 1. Transcribe audio
  app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      const base64Audio = req.file.buffer.toString('base64');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: req.file.mimetype || "audio/webm",
                  data: base64Audio,
                },
              },
              {
                text: "请将这段语音转录为文字。只需要返回转录后的文本内容，不要有任何多余的解释。如果语音内容为空或无法识别，请返回空字符串。",
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      res.json({ text });
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Parse bill text
  app.post('/api/parse-bill', async (req, res) => {
    try {
      const { text, categories } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'No text provided' });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: `你是一个专业的财务记账助手。请从以下文本中提取交易信息：
                "${text}"
                
                必须严格遵守以下规则：
                1. 必须返回 JSON 格式。
                2. type 字段必须且只能是 "expense" (支出) 或 "income" (收入)。
                3. amount 字段必须是纯数字（number 类型）。
                4. category 字段必须从以下列表中选择一个最匹配的 ID: [${categories.map((c: any) => c.id).join(', ')}]。
                5. note 字段是备注（如“买香蕉”、“午餐”、“发工资”）。
                6. merchant 字段是商户名称（如果有，没有则为空字符串）。
                7. time 字段是交易时间（如“刚刚”、“昨天”、“今天下午”，没有则为空字符串）。
                8. 严禁脑补！如果文本说“中午”，time 必须是“中午”，不要脑补成“晚上”或“下午”。
                9. 如果无法确定分类，请使用 "other"。`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["expense", "income"] },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              note: { type: Type.STRING },
              merchant: { type: Type.STRING },
              time: { type: Type.STRING },
            },
            required: ["type", "amount", "category", "note"]
          }
        },
      });

      const billData = JSON.parse(response.text || '{}');
      res.json(billData);
    } catch (error: any) {
      console.error('Parsing error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Recognize receipt from image
  app.post('/api/recognize-receipt', async (req, res) => {
    try {
      const { image, categories } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: `Extract transaction details from this receipt/screenshot. 
                Return JSON with fields: 
                - title: string (merchant name or item)
                - amount: number
                - type: "expense" or "income"
                - category: one of [${categories.map((c: any) => c.id).join(', ')}]
                - date: string (ISO format if possible, otherwise just the date)
                
                CRITICAL CATEGORY RULES:
                - Only select a specific category if there is CLEAR evidence.
                - If you are unsure, you MUST choose "other".`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["expense", "income"] },
              category: { type: Type.STRING },
              date: { type: Type.STRING },
            },
            required: ["title", "amount", "type", "category"]
          }
        },
      });

      const receiptData = JSON.parse(response.text || '{}');
      res.json(receiptData);
    } catch (error: any) {
      console.error('Receipt recognition error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
