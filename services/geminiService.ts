import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";
import { TEXT_ANALYSIS_MODEL, IMAGE_GENERATION_MODEL } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes text or image input to generate structure, comic script, and vocab.
 */
export const analyzeContent = async (
  textInput: string,
  imageInput?: string, // base64 string
  mimeType: string = 'image/png',
  vocabCriteria: string = ''
): Promise<AnalysisResult> => {
  
  const vocabPrompt = vocabCriteria 
    ? `Select vocabulary based on this criteria: "${vocabCriteria}".` 
    : "Select difficult or key words suitable for learners.";

  const prompt = `
    You are an expert English teacher and manga creator. 
    Analyze the provided content (text or image of a textbook). 
    
    Your task is to:
    1. Summarize the key concept.
    2. Create a script for a 4-panel educational manga/comic that explains the concept or tells the story. 
       - The 'visualPrompt' must be descriptive enough for an AI image generator (describe characters, setting, style).
       - The 'caption' is the narrative box.
       - The 'characterDialogue' is what characters say.
    3. Extract the logical structure of the concept for visualization (nodes and links).
    4. Extract vocabulary words. ${vocabPrompt}
       - Provide a definition and an example sentence.
       - Provide a 'visualPrompt' to generate an image that represents the word or the example sentence visually.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      comicScript: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            panelId: { type: Type.INTEGER },
            visualPrompt: { type: Type.STRING, description: "Detailed visual description for an image generator." },
            caption: { type: Type.STRING },
            characterDialogue: { type: Type.STRING },
          },
          required: ["panelId", "visualPrompt", "caption", "characterDialogue"],
        }
      },
      logicGraph: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                group: { type: Type.INTEGER }
              },
              required: ["id", "label", "group"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relationship: { type: Type.STRING }
              },
              required: ["source", "target", "relationship"]
            }
          }
        },
        required: ["nodes", "links"]
      },
      vocabulary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING },
            visualPrompt: { type: Type.STRING, description: "Visual description of the word for an image generator." }
          },
          required: ["word", "definition", "example", "visualPrompt"]
        }
      }
    },
    required: ["summary", "comicScript", "logicGraph", "vocabulary"]
  };

  const parts: any[] = [{ text: prompt }];
  
  if (imageInput) {
    parts.push({
      inlineData: {
        data: imageInput,
        mimeType: mimeType
      }
    });
  }
  
  if (textInput) {
    parts.push({ text: `Source Text: ${textInput}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: TEXT_ANALYSIS_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates an image for a comic panel or vocab card.
 */
export const generateImage = async (visualPrompt: string): Promise<string> => {
  const finalPrompt = `Manga style illustration, black and white ink style or soft colored anime style, educational context. ${visualPrompt}`;
  
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_GENERATION_MODEL,
      contents: {
        parts: [{ text: finalPrompt }]
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data returned");

  } catch (error) {
    console.error("Image Gen Error:", error);
    return `https://picsum.photos/400/300?blur=2&text=Image+Gen+Failed`; 
  }
};