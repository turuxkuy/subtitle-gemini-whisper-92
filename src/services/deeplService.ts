
import { SubtitleEntry } from "@/types/subtitle";

// DeepL API key - this is a publishable API key
const DEEPL_API_KEY = "d694e00f-10fe-4548-bb04-37be2c63ba9a:fx";
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

// Language code mapping from our app's codes to DeepL's codes
const languageCodeMapping: Record<string, string> = {
  "id": "ID", // Indonesian
  "en": "EN", // English
  "ja": "JA", // Japanese
  "ko": "KO", // Korean
  "zh": "ZH", // Chinese Simplified
  "zh-TW": "ZH", // Chinese (DeepL doesn't distinguish between simplified and traditional)
  "fr": "FR", // French
  "de": "DE", // German
  "es": "ES", // Spanish
  "pt": "PT", // Portuguese
  "ru": "RU", // Russian
  "it": "IT", // Italian
  // DeepL doesn't support these languages, but we'll keep them for completeness
  // "ar": "AR", // Arabic
  // "hi": "HI", // Hindi
  // "bn": "BN", // Bengali
};

export async function translateWithDeepL(
  subtitles: SubtitleEntry[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<SubtitleEntry[]> {
  try {
    // Check if both languages are supported
    const sourceLang = languageCodeMapping[sourceLanguage];
    const targetLang = languageCodeMapping[targetLanguage];
    
    if (!sourceLang || !targetLang) {
      throw new Error(`Bahasa ${!sourceLang ? sourceLanguage : targetLanguage} tidak didukung oleh DeepL`);
    }

    // Prepare texts for translation
    const textsToTranslate = subtitles.map(sub => sub.text);
    
    // API request to DeepL
    console.log(`Translating ${textsToTranslate.length} subtitles with DeepL from ${sourceLang} to ${targetLang}`);
    console.log('DeepL API URL:', DEEPL_API_URL);
    
    // Using the fetch API with a proxy workaround for CORS
    // We'll try direct fetch first, then fall back to a CORS proxy if needed
    let response;
    try {
      response = await fetch(DEEPL_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textsToTranslate,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
        mode: 'cors',
      });
    } catch (fetchError) {
      console.error("Initial fetch failed, trying with CORS proxy:", fetchError);
      
      // Try with a CORS proxy as fallback
      const corsProxyUrl = "https://corsproxy.io/?";
      response = await fetch(corsProxyUrl + encodeURIComponent(DEEPL_API_URL), {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textsToTranslate,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepL API response status: ${response.status}`);
      console.error(`DeepL API error details:`, errorText);
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.translations || !Array.isArray(data.translations)) {
      console.error("Unexpected DeepL API response format:", data);
      throw new Error("Unexpected DeepL API response format");
    }
    
    console.log(`Received ${data.translations.length} translations from DeepL`);
    
    // Create new subtitles with translated text while preserving original timing
    return subtitles.map((sub, index) => {
      if (index < data.translations.length) {
        return {
          ...sub,
          text: data.translations[index].text
        };
      }
      return sub; // Keep original if no translation found
    });
  } catch (error) {
    console.error("DeepL translation error:", error);
    throw error;
  }
}
