
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Custom stylized logger for the SvelTech Lattice
 */
const latticeLog = (module: string, message: string, data?: any, isError: boolean = false) => {
  const color = isError ? '#ff4b4b' : '#4F46E5';
  console.log(
    `%c[Lattice ${module}]%c ${message}`,
    `color: white; background: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: bold;`,
    `color: ${color}; font-weight: medium;`,
    data || ''
  );
};

// Always use process.env.API_KEY directly as per Google GenAI coding guidelines
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Unsplash configuration
 */
const UNSPLASH_ACCESS_KEY = "dxevOJ3cRFW0WZ_XRCE059OV3bw_NcZI4IkWeNB5QyU";
const DEFAULT_AESTHETIC = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";

/**
 * Helper to strip poetic fluff from Gemini generated queries
 */
const simplifyQuery = (q: string): string => {
  return q.replace(/a photo of|an image of|high resolution|showing|featuring|with|in the style of/gi, '').trim();
};

/**
 * Enhanced fetch for high-resolution images from Unsplash.
 * Includes query back-off: if a specific query fails, it tries a broader one.
 */
export const fetchAestheticImage = async (query: string, attempt: number = 0): Promise<string> => {
  const cleanQuery = simplifyQuery(query);
  const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=portrait`;
  
  try {
    const response = await fetch(endpoint);
    
    // Telemetry: Log rate limits to pinpoint 429 errors
    const rateLimit = response.headers.get('X-Ratelimit-Remaining');
    if (rateLimit) latticeLog('Telemetry', `Unsplash Rate Limit Remaining: ${rateLimit}`);

    if (!response.ok) {
      const status = response.status;
      let errorMsg = `HTTP Error ${status}`;
      if (status === 401) errorMsg = "Unsplash API Key Invalid.";
      if (status === 403) errorMsg = "Unsplash Access Forbidden/Key Scope Error.";
      if (status === 429) errorMsg = "Unsplash Rate Limit Hit (50/hr).";
      
      latticeLog('Unsplash', errorMsg, { query: cleanQuery, status }, true);
      return DEFAULT_AESTHETIC;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      latticeLog('Unsplash', `No results for: "${cleanQuery}" (Attempt ${attempt})`, null, false);
      
      // Query Back-off Logic
      if (attempt === 0) {
        // Try trimming the query to the first 3 words (often Gemini is too specific)
        const shorter = cleanQuery.split(' ').slice(0, 3).join(' ');
        if (shorter !== cleanQuery) return fetchAestheticImage(shorter, 1);
      }
      
      if (attempt === 1) {
        // Final fallback to generic high-fashion
        return fetchAestheticImage("high fashion editorial", 2);
      }

      return DEFAULT_AESTHETIC;
    }

    const imageUrl = data.results[0].urls.regular;
    latticeLog('Unsplash', `Success for "${cleanQuery}"`, { imageUrl });
    return imageUrl;

  } catch (e: any) {
    latticeLog('Unsplash', `Fetch Exception: ${e.message}`, { query }, true);
    return DEFAULT_AESTHETIC;
  }
};

/**
 * High-Precision Garment Analysis
 */
export const analyzeClothingImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: 'Determine category and 10 tags. Return JSON.' }
        ]
      },
      config: {
        systemInstruction: 'You are a garment analyzer. JSON output only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['category', 'tags']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    latticeLog('Gemini', 'Analysis Error', e, true);
    return { category: 'other', tags: ['fashion'] };
  }
};

export const generateDailyStyleReport = async (profile: any, closetItems: any[]) => {
  const closetSummary = closetItems.map(i => `${i.category}`).join(', ');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Report for ${profile.name}. Preferences: ${profile.preferences?.join(', ')}. Items: ${closetSummary}.`,
      config: {
        systemInstruction: 'Provide 3 style slides. For "image_query", provide 2-3 broad keywords (e.g. "minimalist aesthetic") suitable for Unsplash.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              image_query: { type: Type.STRING }
            },
            required: ['title', 'description', 'image_query']
          }
        }
      }
    });
    
    const rawSlides = JSON.parse(response.text || '[]');
    return await Promise.all(rawSlides.map(async (s: any) => ({
      ...s,
      image: await fetchAestheticImage(s.image_query + " style")
    })));
  } catch (e) {
    latticeLog('Gemini', 'Report Error', e, true);
    return [{ title: "Lattice Syncing", description: "Updating style DNA...", image: DEFAULT_AESTHETIC }];
  }
};

export const getDetailedTrendPulse = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current viral trends. JSON with image_query.`,
      config: {
        systemInstruction: 'Keep "image_query" to broad 2-word fashion terms.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hashtag: { type: Type.STRING },
              scope: { type: Type.STRING },
              velocity: { type: Type.INTEGER },
              insight: { type: Type.STRING },
              image_query: { type: Type.STRING },
              context: { type: Type.STRING }
            },
            required: ['hashtag', 'scope', 'velocity', 'insight', 'image_query', 'context']
          }
        }
      }
    });
    
    const trends = JSON.parse(response.text || '[]');
    return await Promise.all(trends.map(async (t: any) => ({
      ...t,
      image: await fetchAestheticImage(t.image_query + " editorial")
    })));
  } catch (e) {
    return [];
  }
};

export const getLiveTrendPulse = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify a trend.`,
      config: {
        systemInstruction: 'Return JSON. image_queries should be broad (e.g. "vintage denim").',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trendName: { type: Type.STRING },
            volume: { type: Type.INTEGER },
            description: { type: Type.STRING },
            image_queries: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['trendName', 'volume', 'description', 'image_queries']
        }
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    const images = await Promise.all((data.image_queries || []).map((q: string) => fetchAestheticImage(q)));
    return { ...data, images };
  } catch (e) {
    return { trendName: "Global Fashion", volume: 90, description: "Trends are evolving.", images: [DEFAULT_AESTHETIC] };
  }
};

/**
 * Updated signature to accept 4 arguments as used in Generator.tsx
 */
export const generateOutfitSuggestion = async (
  eventDescription: string, 
  closetItems: any[], 
  userProfile: any,
  previousRecommendation?: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Stylist request: ${eventDescription}. Items: ${closetItems.length}. User Preferences: ${userProfile.preferences?.join(', ')}. ${previousRecommendation ? `Previous recommendation for context: ${previousRecommendation}` : ''}`,
      config: {
        systemInstruction: 'Provide styling advice. JSON output.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            selectedItemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            needsInternetSearch: { type: Type.BOOLEAN },
            searchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['recommendation', 'selectedItemIds', 'needsInternetSearch']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { recommendation: "Lattice error.", selectedItemIds: [], needsInternetSearch: false };
  }
};

export const getTrendingFashion = async (preferences: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `CRITICAL: Provide EXACTLY 8 high-fashion items for these preferences: ${preferences.join(', ')}. I need two full rows of 4 for a dashboard.`,
      config: {
        systemInstruction: 'You are a high-fashion curator. You must return EXACTLY 8 distinct items in the JSON array. Each item visualPrompt must be a 2-3 word broad search term like "leather jacket product" or "minimalist sunglasses".',
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          minItems: 8,
          maxItems: 8,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              store: { type: Type.STRING },
              link: { type: Type.STRING },
              matchScore: { type: Type.INTEGER },
              matchReason: { type: Type.STRING }
            },
            required: ['id', 'name', 'price', 'visualPrompt', 'store', 'link', 'matchScore', 'matchReason']
          }
        }
      }
    });
    
    const items = JSON.parse(response.text || '[]');
    // We slice to 8 just in case, but the schema/instruction now enforces it
    const targetItems = items.slice(0, 8);
    
    return await Promise.all(targetItems.map(async (item: any) => ({
      ...item,
      image: await fetchAestheticImage(item.visualPrompt + " high fashion")
    })));
  } catch (e) {
    latticeLog('Gemini', 'Trending Fetch Error', e, true);
    return [];
  }
};

/**
 * Updated signature to accept 3 arguments as used in VoiceAssistant.tsx
 */
export const processVoiceAssistantIntent = async (
  userInput: string,
  closetItems: any[] = [],
  userProfile: any = {}
) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User voice input: "${userInput}". Context: user has ${closetItems.length} items. Profile: ${userProfile.name}.`,
      config: {
        systemInstruction: 'Voice Assistant. JSON output.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['navigate', 'chat'] },
            path: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ['action', 'message']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { action: "chat", message: "System error." };
  }
};
