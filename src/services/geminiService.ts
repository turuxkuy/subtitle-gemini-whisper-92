
import { SubtitleEntry } from "@/types/subtitle";

// The Gemini API key
const GEMINI_API_KEY = "AIzaSyA8YmwOrBK7Yg1E_NMg-_T2TZf7J9h8qOM";

// Available models
export const geminiModels = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Cepat dan hemat", provider: "gemini" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Kualitas tinggi", provider: "gemini" },
];

export async function translateSubtitles(
  subtitles: SubtitleEntry[],
  sourceLanguage: string,
  targetLanguage: string,
  model: string = "gemini-1.5-flash"
): Promise<SubtitleEntry[]> {
  try {
    // Ensure subtitles array is not empty
    if (!subtitles || subtitles.length === 0) {
      throw new Error("No subtitles provided for translation");
    }

    // Get language labels for better prompting
    const languages: Record<string, string> = {
      "id": "Bahasa Indonesia",
      "en": "English",
      "ja": "Japanese",
      "ko": "Korean",
      "zh": "Chinese Simplified",
      "zh-TW": "Chinese Traditional",
      "fr": "French",
      "de": "German",
      "es": "Spanish",
      "pt": "Portuguese",
      "ru": "Russian",
      "ar": "Arabic",
      "hi": "Hindi",
      "bn": "Bengali",
      "it": "Italian",
    };
    
    const sourceLangName = languages[sourceLanguage] || sourceLanguage;
    const targetLangName = languages[targetLanguage] || targetLanguage;

    const subtitleTexts = subtitles.map(sub => sub.text);
    
    // Find the selected model
    const selectedModelInfo = geminiModels.find(m => m.id === model);
    
    // Default to gemini-1.5-flash if model not found
    if (!selectedModelInfo) {
      console.warn(`Model ${model} not found, falling back to gemini-1.5-flash`);
      return translateWithGemini(
        subtitles, 
        subtitleTexts, 
        sourceLangName, 
        targetLangName, 
        "gemini-1.5-flash"
      );
    }
    
    // Use Gemini for translation
    return translateWithGemini(
      subtitles, 
      subtitleTexts, 
      sourceLangName, 
      targetLangName, 
      selectedModelInfo.id
    );
  } catch (error) {
    console.error("Translation error:", error);
    // If API call fails, return mock translated subtitles (as fallback)
    const languageMap: Record<string, string> = {
      "id": "[Terjemahan Bahasa Indonesia] ",
      "en": "[English Translation] ",
      "fr": "[Traduction Française] ",
      "de": "[Deutsche Übersetzung] ",
      "es": "[Traducción Española] ",
      "pt": "[Tradução Portuguesa] ",
      "ru": "[Русский перевод] ",
      "ja": "[日本語翻訳] ",
      "ko": "[한국어 번역] ",
      "zh": "[简体中文翻译] ",
      "zh-TW": "[繁體中文翻譯] ",
      "ar": "[ترجمة عربية] ",
      "hi": "[हिंदी अनुवाद] ",
      "bn": "[বাংলা অনুবাদ] ",
      "it": "[Traduzione Italiana] ",
    };

    return subtitles.map(subtitle => ({
      ...subtitle,
      text: `${languageMap[targetLanguage] || ''}${subtitle.text} (API Error: ${(error as Error).message})`
    }));
  }
}

async function translateWithGemini(
  subtitles: SubtitleEntry[],
  subtitleTexts: string[],
  sourceLangName: string,
  targetLangName: string,
  modelId: string
): Promise<SubtitleEntry[]> {
  console.log("Using Gemini API with model:", modelId);
  
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelId + ":generateContent";
  
  // Enhanced prompt with clear instructions and numbered subtitles for better mapping
  const prompt = `Translate the following numbered subtitles from ${sourceLangName} to ${targetLangName}.
Your translation MUST:
1. Maintain the original meaning and context
2. Use natural expressions in ${targetLangName}
3. Keep proper names unchanged
4. Preserve ALL formatting and emotion
5. Be concise and clear
6. Maintain ALL punctuation marks (!, ?, ., ,) in the translated text
7. Always include the subtitle number before each translation (e.g., "1:", "2:", etc.)
8. Translate ALL subtitles completely without omissions

IMPORTANT: Keep the same NUMBER OF SUBTITLES and maintain the EXACT SAME NUMBERING sequence!

Here are the subtitles to translate:

${subtitleTexts.map((text, index) => `${index + 1}: ${text}`).join('\n\n')}`;

  console.log("Sending request to Gemini API");
  console.log("Number of subtitles:", subtitles.length);

  // Make request to Gemini API
  const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,  // Lower temperature for more consistent results
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Gemini API error:", errorData);
    throw new Error(`Gemini API responded with status ${response.status}: ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Unexpected Gemini API response structure");
  }
  
  // Extract translated text from the response
  const translatedText = data.candidates[0].content.parts[0].text;
  
  // Process the translated text to extract numbered translations
  // This regex looks for patterns like "1:", "2:", etc. followed by text
  const translationRegex = /(\d+)\s*:\s*([\s\S]+?)(?=\n\s*\d+\s*:|$)/g;
  const translationMatches = [...translatedText.matchAll(translationRegex)];
  
  console.log(`Extracted ${translationMatches.length} numbered translations`);
  
  // Create a map of subtitle number to translated text
  const translationMap = new Map<number, string>();
  for (const match of translationMatches) {
    const number = parseInt(match[1]);
    const text = match[2].trim();
    translationMap.set(number, text);
  }
  
  // Create translated subtitles with proper mapping
  return subtitles.map((subtitle, index) => {
    const number = index + 1; // 1-based indexing as in the prompt
    const translatedText = translationMap.get(number);
    
    if (translatedText) {
      return {
        ...subtitle,
        text: translatedText
      };
    }
    
    // Fallback if no translation found for this number
    console.warn(`No translation found for subtitle ${number}, using original`);
    return subtitle;
  });
}
