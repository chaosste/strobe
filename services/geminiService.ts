
import { GoogleGenAI, Type } from "@google/genai";
import { StrobePattern } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateAIPattern = async (prompt: string): Promise<StrobePattern> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a strobe light pattern based on this theme: "${prompt}". 
               Provide a name, a list of 2-4 hex colors, a frequency multiplier (between 0.5 and 5.0), 
               and a short description of the vibe.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          colors: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Hex color codes"
          },
          frequencyMultiplier: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ["name", "colors", "frequencyMultiplier", "description"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data as StrobePattern;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {
      name: "Fallback Pulse",
      colors: ["#ffffff", "#000000"],
      frequencyMultiplier: 1.0,
      description: "A standard white strobe pulse."
    };
  }
};
