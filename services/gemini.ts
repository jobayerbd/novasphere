
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

// Fix: Always use direct process.env.API_KEY and named parameter for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, category: string, features: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a compelling and professional e-commerce product description for a product named "${name}" in the "${category}" category. Key features: ${features}. Keep it under 150 words.`,
    });
    // Fix: Use response.text property directly
    return response.text || "Failed to generate description.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content. Please try again.";
  }
};

export const createSupportChat = (): Chat => {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Nova, a helpful AI shopping assistant for NovaSphere, a premium e-commerce store. You are polite, professional, and knowledgeable about high-end electronics, fashion, and home goods. Help customers find products, answer questions about shipping (standard 3-5 days), and be charming.",
    },
  });
};
