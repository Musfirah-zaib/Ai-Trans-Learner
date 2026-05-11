import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SimplificationResult {
  concept: string;
  level1: string; // Hook: 1-sentence Roman Urdu
  level2: string; // Analogy: Like a local (Pakistani touchstones)
  level3: string; // Audio-ready script
}

export const simplifyText = async (englishText: string): Promise<SimplificationResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate and simplify the following English academic text for a Pakistani student who finds dense English difficult.
Output in JSON format with these keys: 
- "concept": The core academic concept in 1-3 words.
- "level1": A 1-sentence Roman Urdu hook/summary (e.g., "Entropy matlab kainaat mein phaili hui kharabbi...").
- "level2": A detailed explanation using a local Pakistani analogy (e.g., Cricket, markets, rickshaws, street food, public transport, family dynamics).
- "level3": A conversational script in a Hinglish/Urdu-ish mix that can be read aloud as an audio summary.

Text to simplify:
${englishText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          level1: { type: Type.STRING },
          level2: { type: Type.STRING },
          level3: { type: Type.STRING },
        },
        required: ["concept", "level1", "level2", "level3"]
      }
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text);
};

export const getTTS = async (text: string): Promise<string> => {
  // Using gemini-3.1-flash-tts-preview for the audio summaries
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Read this in a friendly, helpful mix of Urdu and English (Hinglish): ${text}` }] }],
    config: {
      responseModalities: ["AUDIO" as any],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Puck" },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio");
  return `data:audio/wav;base64,${base64Audio}`;
};

export const extractTextFromImage = async (base64Data: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        { text: "Extract all English academic text from this image. Only return the text, no conversational filler." }
      ]
    }
  });
  return response.text || "";
};
