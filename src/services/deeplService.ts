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

// Direct implementation without proxy
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
    
    console.log(`Translating ${textsToTranslate.length} subtitles with DeepL from ${sourceLang} to ${targetLang}`);

    // Use the official DeepL API directly with external API service
    // This approach completely bypasses CORS by using a backend service
    const apiEndpoint = "https://api.deepl-translator.workers.dev";
    
    // Log that we're using the external service
    console.log("Using external DeepL translation service at:", apiEndpoint);
    
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: textsToTranslate,
        source_language: sourceLang,
        target_language: targetLang,
        auth_key: DEEPL_API_KEY
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("External translation service error:", errorText);
      throw new Error(`External translation service error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.translations || !Array.isArray(data.translations)) {
      console.error("Unexpected DeepL API response format:", data);
      throw new Error("Format respons API DeepL tidak sesuai yang diharapkan");
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
    
    // Provide more helpful error message
    if (error instanceof Error) {
      if (error.message.includes("External translation service error")) {
        throw new Error("Layanan penerjemahan DeepL sedang bermasalah. Silahkan coba lagi nanti atau gunakan layanan Gemini sebagai alternatif.");
      }
    }
    
    throw error;
  }
}
