import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ParsedBill {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string
  note?: string;
  rawText?: string;
}

export const parseBillFromImage = async (base64Image: string, mimeType: string): Promise<ParsedBill> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `你是一个专业的财务助手。请分析这张支付截图（微信、支付宝或银行卡支付成功页面），提取以下信息并以 JSON 格式返回：
            - title: 商户名称或交易摘要
            - amount: 金额（数字）
            - type: 'expense' (支出) 或 'income' (收入)
            - category: 建议分类（餐饮, 购物, 交通, 医疗, 娱乐, 工资, 旅行, 其他 之一）
            - date: 交易日期时间（ISO 8601 格式，如果截图中没有年份，请默认使用 2026 年）
            - note: 备注（如果有）
            
            请确保返回的是纯 JSON 字符串。`,
          },
          {
            inlineData: {
              data: base64Image.split(",")[1] || base64Image,
              mimeType: mimeType,
            },
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
          note: { type: Type.STRING },
        },
        required: ["title", "amount", "type", "category", "date"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("无法识别图片内容");
  
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    rawText: "识别自支付截图",
  };
};

export const parseBillFromText = async (rawText: string): Promise<ParsedBill> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你是一个专业的财务助手。请分析以下文本内容（可能是分享的支付信息或通知），提取账单信息并以 JSON 格式返回：
    文本内容: "${rawText}"
    
    提取字段：
    - title: 商户名称或交易摘要
    - amount: 金额（数字）
    - type: 'expense' (支出) 或 'income' (收入)
    - category: 建议分类（餐饮, 购物, 交通, 医疗, 娱乐, 工资, 旅行, 其他 之一）
    - date: 交易日期时间（ISO 8601 格式，如果文本中没有年份，请默认使用 2026 年）
    - note: 备注（如果有）`,
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
          note: { type: Type.STRING },
        },
        required: ["title", "amount", "type", "category", "date"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("无法识别文本内容");
  
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    rawText: rawText,
  };
};
