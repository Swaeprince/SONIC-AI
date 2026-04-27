import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateLyrics(params: {
  topic: string;
  genre: string;
  voiceStyle: string;
  structure: string[];
}) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate professional, radio-ready lyrics for a ${params.genre} song.
    Topic: ${params.topic}
    Artist Style: ${params.voiceStyle}
    Song Structure: ${params.structure.join(' -> ')}
    
    Make the lyrics authentic to the artist's vocabulary and flow.
    If it's King Von or Lil Durk, make it raw and storytelling.
    If it's Drake, make it clever with wordplay and melodic structure.
    If it's Tyla or Shensea, include rhythmic elements.
    If it's Billie Eilish, make it poetic and atmospheric.
    
    Format the response as JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                lines: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          suggestedTempo: { type: Type.NUMBER },
          mood: { type: Type.STRING }
        },
        required: ["title", "lyrics"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeBeat(audioBase64: string) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: "Analyze this instrumental beat. Identify the genre, tempo (BPM), mood, and key. Provide a creative description." },
      { inlineData: { data: audioBase64, mimeType: "audio/wav" } }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          genre: { type: Type.STRING },
          bpm: { type: Type.NUMBER },
          key: { type: Type.STRING },
          mood: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
