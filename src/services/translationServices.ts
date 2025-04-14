
import { TranslationService } from "@/types/subtitle";
import { geminiModels } from "./geminiService";

// DeepL services
export const deeplServices: TranslationService[] = [
  { 
    id: "deepl-free", 
    name: "DeepL API Free", 
    description: "High quality translation, limited languages", 
    provider: "deepl"
  }
];

// Export all available services
export const allTranslationServices: TranslationService[] = [
  ...geminiModels,
  ...deeplServices
];
