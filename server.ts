import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import OpenAI from 'openai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Multer setup for audio uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // OpenAI client for DashScope (Qwen)
  const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Transcribe Audio using Alibaba Cloud DashScope ASR (Qwen-Audio-Turbo)
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }

      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "DASHSCOPE_API_KEY is not configured" });
      }

      const audioBase64 = req.file.buffer.toString("base64");
      
      // Using Qwen-Audio-Turbo via DashScope API
      const response = await axios.post(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        {
          model: "qwen-audio-turbo",
          input: {
            messages: [
              {
                role: "user",
                content: [
                  { audio: `data:audio/wav;base64,${audioBase64}` },
                  { text: "请将这段语音转写为文字，只返回转写结果，不要有任何多余的解释。" }
                ]
              }
            ]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          }
        }
      );

      const transcript = response.data?.output?.choices?.[0]?.message?.content?.[0]?.text || "";
      
      res.json({ text: transcript.trim() });
    } catch (error: any) {
      console.error("Transcription error:", error.response?.data || error.message);
      res.status(500).json({ error: "Transcription failed", details: error.message });
    }
  });

  // 2. Parse Bill using Rule-based + Qwen Fallback
  app.post("/api/parse-bill", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      // --- Rule-based Extraction (Cheap & Fast) ---
      let amount: number | null = null;
      let type: "expense" | "income" = "expense";
      let category = "其他";
      let note = text;
      let merchant = "";
      let time = new Date().toISOString();

      // Simple regex for amount (e.g., "3块", "20.5元", "花了100")
      const amountMatch = text.match(/(\d+(\.\d+)?)\s*(块|元|钱)/) || text.match(/(花了|收入|支出|共计)\s*(\d+(\.\d+)?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1] || amountMatch[2]);
      }

      // Simple keywords for type
      if (text.includes("收入") || text.includes("工资") || text.includes("赚了") || text.includes("领了")) {
        type = "income";
      }

      // If amount is still null or we want better accuracy, use LLM fallback
      // We use qwen-plus which is cheap and reliable
      const completion = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
          {
            role: "system",
            content: `你是一个记账助手。请从用户的描述中提取记账信息。
            必须返回 JSON 格式，包含以下字段：
            - type: "expense" (支出) 或 "income" (收入)
            - amount: 数字
            - category: 类别（如：餐饮、交通、购物、工资、理财等）
            - note: 备注
            - merchant: 商家名称（如果没有则为空字符串）
            - time: ISO 8601 格式的时间字符串（如果没有提到具体时间，使用当前时间）
            
            当前时间: ${new Date().toLocaleString()}
            
            只返回 JSON，不要有任何解释。`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      
      // Merge or override
      if (result.amount) amount = result.amount;
      if (result.type) type = result.type;
      if (result.category) category = result.category;
      if (result.note) note = result.note;
      if (result.merchant !== undefined) merchant = result.merchant;
      if (result.time) time = result.time;

      res.json({
        type,
        amount: amount || 0,
        category,
        note,
        merchant,
        time
      });
    } catch (error: any) {
      console.error("Parsing error:", error.message);
      res.status(500).json({ error: "Parsing failed", details: error.message });
    }
  });

  // 3. Recognize Receipt using Alibaba Cloud DashScope Qwen-VL
  app.post("/api/recognize-receipt", async (req, res) => {
    try {
      const { image } = req.body; // base64 image data
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "DASHSCOPE_API_KEY is not configured" });
      }

      // Using Qwen-VL-Plus via DashScope API
      const response = await axios.post(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        {
          model: "qwen-vl-plus",
          input: {
            messages: [
              {
                role: "user",
                content: [
                  { image: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}` },
                  { text: "请提取这张截图或收据中的交易信息。必须返回 JSON 格式，包含以下字段：type (expense/income), amount (数字), category (类别), note (备注), merchant (商户名称), time (时间)。只返回 JSON，不要有任何解释。" }
                ]
              }
            ]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          }
        }
      );

      const content = response.data?.output?.choices?.[0]?.message?.content?.[0]?.text || "";
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      res.json(result);
    } catch (error: any) {
      console.error("Image recognition error:", error.response?.data || error.message);
      res.status(500).json({ error: "Image recognition failed", details: error.message });
    }
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
