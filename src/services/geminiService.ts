import {GoogleGenAI, Type, Modality} from "@google/genai";

const HARDCODED_API_KEY = "AIzaSyBS9c2Z65SOrin6GXDoz6CHm0NmD7yUQdY";
let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: HARDCODED_API_KEY });
  }
  return aiInstance;
};

export const isApiKeyMissing = () => {
  return false; // Key is hardcoded
};

export const generateStudyMaterial = async (prompt: string, fileData?: { data: string, mimeType: string }) => {
  const ai = getAi();
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: fileData ? [
      {
        parts: [
          { inlineData: fileData },
          { text: prompt }
        ]
      }
    ] : prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          presentation: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "content"]
            }
          }
        },
        required: ["summary", "flashcards", "presentation"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
};

export const generateDiagram = async (description: string) => {
  const ai = getAi();
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: `Generate a clear educational diagram or illustration based on this topic: ${description}. Make it look professional and academic.`,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  const response = await model;
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateImage = async (prompt: string) => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `An educational illustration of: ${prompt}. High quality, clear, professional.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateSpeech = async (text: string) => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this clearly and educationally: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/mpeg;base64,${base64Audio}`;
  }
  return null;
};

export const chatWithGemini = async (messages: { role: 'user' | 'model', text: string }[]) => {
  const ai = getAi();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are NoteCraft AI, a helpful educational assistant. Help students understand complex topics, create study plans, and explain concepts clearly.",
    },
  });

  // Reconstruct history
  const history = messages.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const lastMessage = messages[messages.length - 1].text;
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
};
