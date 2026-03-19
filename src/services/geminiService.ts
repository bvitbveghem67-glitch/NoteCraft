import {GoogleGenAI, Type} from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API key is missing. Please add GEMINI_API_KEY to the Secrets panel in AI Studio.");
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateStudyMaterial = async (prompt: string, fileData?: { data: string, mimeType: string }) => {
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

export const generateVideo = async (prompt: string) => {
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `An educational animation explaining: ${prompt}. Cinematic, high quality, clear visuals.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  return operation.response?.generatedVideos?.[0]?.video?.uri;
};
