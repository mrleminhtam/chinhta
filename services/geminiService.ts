
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AIModelType, AIMode } from "../types.ts";

const getSystemInstruction = (mode: AIMode) => {
  const base = "Bạn là chuyên gia ngôn ngữ Việt Nam xuất sắc. Nhiệm vụ của bạn là rà soát văn bản tiếng Việt và trả về kết quả dưới dạng JSON chính xác.";
  
  switch (mode) {
    case AIMode.ACADEMIC:
      return `${base} Tập trung vào tính trang trọng, cấu trúc câu phức tạp và từ vựng học thuật chuẩn xác.`;
    case AIMode.CREATIVE:
      return `${base} Tập trung vào sự mượt mà, giàu hình ảnh và cách diễn đạt tự nhiên, giàu tính văn chương.`;
    case AIMode.PROFESSIONAL:
      return `${base} Tập trung vào sự súc tích, chuyên nghiệp và lịch thiệp trong môi trường công sở.`;
    default:
      return `${base} Kiểm tra toàn diện lỗi chính tả, ngữ pháp, dấu câu và sự logic trong diễn đạt.`;
  }
};

export const analyzeText = async (
  text: string, 
  apiKeyInput?: string | null,
  model: AIModelType = 'gemini-3-flash-preview',
  mode: AIMode = AIMode.STANDARD
): Promise<AnalysisResult> => {
  if (!text.trim()) throw new Error("Vui lòng cung cấp văn bản để phân tích.");

  const apiKey = apiKeyInput || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình API Key. Vui lòng nhấn vào biểu tượng bánh răng để thiết lập.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Phân tích văn bản này: "${text}"`,
      config: {
        systemInstruction: getSystemInstruction(mode),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            correctedText: { type: Type.STRING },
            overallFeedback: { type: Type.STRING },
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  replacement: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["original", "replacement", "reason", "type"]
              }
            }
          },
          required: ["originalText", "correctedText", "errors", "overallFeedback"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI không trả về kết quả.");
    }

    try {
      const parsed = JSON.parse(resultText);
      return parsed as AnalysisResult;
    } catch (parseError) {
      console.error("JSON Parse Error:", resultText);
      throw new Error("Lỗi định dạng dữ liệu từ AI. Vui lòng thử lại.");
    }
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes("API key not valid") || error.status === 401 || error.status === 403) {
      throw new Error("API Key của bạn không hợp lệ hoặc đã hết hạn.");
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi kết nối với máy chủ AI.");
  }
};
