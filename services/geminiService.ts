import { GoogleGenAI } from "@google/genai";

// Fix: Updated to initialize GoogleGenAI with process.env.API_KEY directly for each call as per guidelines
export const generatePetCareTips = async (petInfo: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請根據以下寵物資訊，提供專業的住宿照顧建議（繁體中文）：\n${petInfo}`,
      config: {
        temperature: 0.7,
      }
    });
    // Fix: Accessing .text property as per guidelines
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "無法生成照顧建議，請稍後再試。";
  }
};

// Fix: Updated to initialize GoogleGenAI with process.env.API_KEY directly for each call
export const generateWelcomeMessage = async (ownerName: string, petName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `身為寵物旅館經理，請寫一段親切、專業、充滿關懷的歡迎訊息給家長 ${ownerName}，歡迎他們的毛孩 ${petName} 入住。請使用繁體中文，語氣溫馨。`,
    });
    // Fix: Accessing .text property as per guidelines
    return response.text;
  } catch (error) {
    return "歡迎入住我們的寵物旅館！";
  }
};