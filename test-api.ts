import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiKeyAlt = process.env.API_KEY;
  console.log("GEMINI_API_KEY exists:", !!apiKey);
  console.log("API_KEY exists:", !!apiKeyAlt);
  const keyToUse = apiKey || apiKeyAlt;
  if (!keyToUse) return;

  const ai = new GoogleGenAI({ apiKey: keyToUse });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log("Response:", response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
