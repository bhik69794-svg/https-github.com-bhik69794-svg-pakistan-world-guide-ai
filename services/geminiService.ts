import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Coordinates, GroundingMetadata, PoiData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are the 'Pakistan World Guide AI'. Your goal is to provide detailed, accurate information about cities, areas, streets, markets, malls, hospitals, schools, banks, tourist spots, and historical places in Pakistan.

**Guidelines:**
1.  **Language:** Answer in a mix of friendly Urdu (Roman script) and English.
2.  **Country Name:** Always refer to the country as "Pakistan" in English.
3.  **Structure:**
    *   **Summary:** A short summary.
    *   **Details:** Bullet points with details (Address, Timing, Phone, Landmarks).
    *   **Source:** Mention source at the end (e.g., Google Maps / OpenStreetMap).
4.  **Image Analysis:** If an image is provided, identify signboards/landmarks to suggest location.
5.  **Map Data Protocol (CRITICAL):**
    If the user asks about places that should be shown on a map, provide the coordinates in a HIDDEN JSON block at the very end.
    **Support MULTIPLE locations.**
    **Categories:** Assign a category to each place: "police", "hospital", "school", "food", "bank", "park", "shop", or "default".
    
    Format: 
    <<<LOC>>>[{"lat": 31.5204, "lng": 74.3587, "title": "Liberty Market", "category": "shop"}, {"lat": 31.48, "lng": 74.3, "title": "Jinnah Hospital", "category": "hospital"}]<<<LOC>>>

    *   Ensure coordinates are accurate for Pakistan.

6.  **Style:** Professional, helpful, respectful. Black & White theme compatible (keep text clean).
`;

export const sendMessageToGemini = async (
  prompt: string,
  imageBase64?: string,
  userLocation?: Coordinates
): Promise<{ text: string; groundingMetadata?: GroundingMetadata; pois?: PoiData[] }> => {
  try {
    const parts: any[] = [];

    // Add Image if present
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
    }

    // Add Text Prompt
    parts.push({ text: prompt });

    const tools: any[] = [{ googleMaps: {} }];
    
    const toolConfig: any = {};
    if (userLocation) {
        toolConfig.retrievalConfig = {
            latLng: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
            }
        };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        toolConfig: Object.keys(toolConfig).length > 0 ? toolConfig : undefined,
      },
    });

    let text = response.text || "Maloomat dastiyaab nahi hain.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;
    
    // Parse POI Data (Array)
    let pois: PoiData[] | undefined;
    const locRegex = /<<<LOC>>>(.*?)<<<LOC>>>/s;
    const match = text.match(locRegex);
    
    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
                pois = parsed;
            } else {
                // Handle legacy single object case just in case
                pois = [parsed];
            }
            // Remove the hidden tag from visible text
            text = text.replace(match[0], '').trim();
        } catch (e) {
            console.error("Failed to parse location data", e);
        }
    }

    return { text, groundingMetadata, pois };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
        text: "System error. Please try again. (" + (error instanceof Error ? error.message : String(error)) + ")",
        groundingMetadata: undefined 
    };
  }
};