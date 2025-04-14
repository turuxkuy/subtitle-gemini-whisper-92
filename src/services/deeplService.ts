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
    
    console.log(`Translating ${textsToTranslate.length} subtitles with DeepL from ${sourceLang} to ${targetLang}`);
    
    // Try with multiple CORS proxies in case one fails
    const corsProxies = [
      "https://corsproxy.io/?",
      "https://cors-anywhere.herokuapp.com/",
      "https://api.allorigins.win/raw?url="
    ];
    
    let response = null;
    let lastError = null;
    
    // First try direct API call
    try {
      console.log("Trying direct API call to DeepL...");
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
      });
      
      if (response.ok) {
        console.log("Direct API call succeeded!");
      } else {
        throw new Error(`Status: ${response.status}`);
      }
    } catch (error) {
      console.log("Direct API call failed:", error);
      lastError = error;
      
      // Try each proxy in sequence
      for (const proxy of corsProxies) {
        try {
          console.log(`Trying with CORS proxy: ${proxy}`);
          const proxyUrl = proxy + encodeURIComponent(DEEPL_API_URL);
          
          response = await fetch(proxyUrl, {
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
          
          if (response.ok) {
            console.log(`Proxy ${proxy} worked!`);
            break;
          } else {
            throw new Error(`Status: ${response.status}`);
          }
        } catch (proxyError) {
          console.log(`Proxy ${proxy} failed:`, proxyError);
          lastError = proxyError;
          // Continue to next proxy
        }
      }
    }
    
    // If all attempts failed
    if (!response || !response.ok) {
      console.error("All API attempts failed");
      throw new Error("Semua upaya koneksi ke API DeepL gagal. Silakan coba lagi nanti atau gunakan layanan Gemini.");
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
    throw error;
  }
}
