
export interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

export type TranslationServiceType = "gemini" | "deepl";

export interface TranslationService {
  id: string;
  name: string;
  description: string;
  provider: TranslationServiceType;
}
