
import { TranslationService } from "@/types/subtitle";
import { geminiModels } from "./geminiService";

// DeepL services
export const deeplServices: TranslationService[] = [
  { 
    id: "deepl-free", 
    name: "DeepL API Free", 
    description: "High quality translation, limited languages", 
    provider: "deepl" // This is now explicitly typed as "deepl", which is a valid TranslationServiceType
  }
];

// Export all available services
export const allTranslationServices: TranslationService[] = [
  ...geminiModels,
  ...deeplServices
];
