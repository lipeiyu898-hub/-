import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// DashScope OpenAI Compatible Client
const getOpenAIClient = () => {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY not found in environment variables.');
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  
  // 1. Transcribe audio (ASR)
  // Using qwen3-asr-flash via DashScope Native API (as ASR is typically not in OpenAI compatible mode)
  app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'DASHSCOPE_API_KEY not configured' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      // DashScope ASR API (Recognition)
      // Note: qwen3-asr-flash is a multimodal model that can be used via Chat interface in some cases, 
      // but for pure ASR, DashScope has specific endpoints.
      // However, qwen-asr models are also available via the multimodal chat interface.
      
      // Using native DashScope ASR API for better stability
      const base64Audio = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || "audio/webm";

      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/recognition',
        {
          model: 'qwen-asr-v1',
          input: {
            audio_resource: `data:${mimeType};base64,${base64Audio}`
          },
          parameters: {
            sample_rate: 16000,
            format: mimeType.includes('webm') ? 'webm' : 'wav'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const text = response.data.output?.sentence?.[0]?.text || '';
      res.json({ text });
    } catch (error: any) {
      console.error('Transcription error details:', error.response?.data || error.message || error);
      res.status(500).json({ error: '语音识别失败，请检查 API 配置或网络' });
    }
  });

  // 2. Parse bill text
  app.post('/api/parse-bill', async (req, res) => {
    try {
      const client = getOpenAIClient();
      const { text, categories } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'No text provided' });
      }

      const response = await client.chat.completions.create({
        model: "qwen-plus",
        messages: [
          {
            role: "system",
            content: "你是一个专业的财务记账助手。请从用户提供的文本中提取交易信息，并严格返回 JSON 格式。"
          },
          {
            role: "user",
            content: `从以下文本中提取交易信息：
            "${text}"
            
            必须严格遵守以下规则：
            1. 必须返回 JSON 格式。
            2. type 字段必须且只能是 "expense" 或 "income"。
            3. amount 字段必须是纯数字（number 类型）。
            4. category 字段必须从以下列表中选择一个最匹配的 ID: [${categories.map((c: any) => c.id).join(', ')}]。
            5. note 字段是备注。
            6. merchant 字段是商户名称（没有则为空字符串）。
            7. time 字段是交易时间（没有则为空字符串）。
            8. 严禁脑补！
            9. 如果无法确定分类，请使用 "other"。`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const billData = JSON.parse(content);
      res.json(billData);
    } catch (error: any) {
      console.error('Parsing error details:', error.response?.data || error.message || error);
      res.status(500).json({ error: '文本解析失败' });
    }
  });

  // 3. Recognize receipt from image (OCR)
  app.post('/api/recognize-receipt', async (req, res) => {
    try {
      const client = getOpenAIClient();
      const { image, categories } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

      const response = await client.chat.completions.create({
        model: "qwen-vl-plus", // Switch to plus for better stability and general capability
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract transaction details from this receipt/screenshot. 
                Return ONLY a JSON object with fields: 
                - type: "expense" or "income"
                - amount: number
                - category: one of [${categories.map((c: any) => c.id).join(', ')}]
                - note: string (merchant name or item)
                - merchant: string
                - time: string
                
                CRITICAL CATEGORY RULES:
                - Only select a specific category if there is CLEAR evidence.
                - If you are unsure, you MUST choose "other".`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ] as any
          }
        ]
      });

      const content = response.choices[0]?.message?.content || '{}';
      // Clean content if it has markdown code blocks
      const jsonStr = content.replace(/```json\n?|```/g, '').trim();
      const receiptData = JSON.parse(jsonStr);
      
      // Ensure the keys match the frontend expectations if they differ
      // The user requested: type, amount, category, note, merchant, time
      // The frontend previously expected: title, amount, type, category, date
      // I will map them to ensure compatibility
      const mappedData = {
        title: receiptData.merchant || receiptData.note || '未命名账单',
        amount: Number(receiptData.amount) || 0,
        type: receiptData.type === 'income' ? 'income' : 'expense',
        category: receiptData.category || 'other',
        date: receiptData.time || new Date().toISOString()
      };

      res.json(mappedData);
    } catch (error: any) {
      console.error('Receipt recognition error details:', error.response?.data || error.message || error);
      res.status(500).json({ error: '图片识别失败' });
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
