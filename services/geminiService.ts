import { GoogleGenAI, Type } from "@google/genai";
import { SignDefinition, RecognitionResult, GeneratedContent } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Verifies if the user's hand gesture matches the target Chinese Sign Language sign.
 */
export const verifyGesture = async (
  base64Image: string,
  targetSign: SignDefinition
): Promise<RecognitionResult> => {
  const ai = getClient();
  
  // Clean base64 string if it contains header
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const prompt = `
    You are a strict but helpful Chinese Sign Language teacher.
    The user is trying to perform the sign for "${targetSign.name}" (${targetSign.chineseName}).
    Instruction: "${targetSign.instruction}".
    
    Analyze the image. Does the hand gesture roughly match the description of the sign?
    Ignore background clutter. Focus on the hands.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN, description: "True if the gesture looks correct based on the instruction." },
            feedback: { type: Type.STRING, description: "A brief, encouraging sentence about what they did right or wrong." },
          },
          required: ["match", "feedback"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as RecognitionResult;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gesture Verification Error:", error);
    return { match: false, feedback: "Could not verify gesture. Please try again." };
  }
};

/**
 * Generates a poetic story and a Gorogoa-style image based on collected signs.
 */
export const generateArtisticResult = async (
  collectedSigns: SignDefinition[]
): Promise<GeneratedContent> => {
  const ai = getClient();
  const signNames = collectedSigns.map(s => `${s.name} (${s.chineseName})`).join(", ");

  // 1. Generate the narrative
  const textPrompt = `
    We are creating an interactive art piece called "Hand-to-Heart".
    The user has performed these Chinese Sign Language gestures: ${signNames}.
    
    Write a short, surreal, and emotional poem or micro-story (max 50 words) that weaves these concepts together.
    The theme is "The Language of Emotion". The tone should be mysterious, gentle, and philosophical, like the game 'Gorogoa'.
  `;

  let story = "";
  try {
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: textPrompt,
    });
    story = textResponse.text || "A silent language spoken by the heart.";
  } catch (e) {
    console.error("Text Gen Error", e);
    story = "The hands speak what the voice cannot.";
  }

  // 2. Generate the visual
  const imagePrompt = `
    A surreal, hand-drawn illustration in the specific artistic style of the video game "Gorogoa".
    
    Key Visual Elements:
    - Flat, illustrative perspective.
    - Intricate, decorative borders or framing like a window or a card.
    - Muted, vintage color palette (sepia, soft blues, terracotta, sage green).
    - Surreal imagery combining these concepts: ${signNames}.
    - Specific Scene Description: ${story}
    
    The image should look like a panel from a puzzle game. High detail, ink and watercolor texture.
  `;

  let imageUrl = "";
  try {
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Using standard allowed model for image generation
      contents: {
        parts: [{ text: imagePrompt }]
      },
    });

    // Extract image
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (e) {
    console.error("Image Gen Error", e);
    // Fallback or empty will be handled by UI
  }

  return { story, imageUrl };
};
