
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Globe, Sparkles } from "lucide-react";
import { allTranslationServices } from "@/services/translationServices";
import { TranslationServiceType } from "@/types/subtitle";

interface LanguageSelectorProps {
  selectedSourceLanguage: string;
  selectedTargetLanguage: string;
  selectedService: string;
  onSourceLanguageChange: (language: string) => void;
  onTargetLanguageChange: (language: string) => void;
  onServiceChange: (service: string) => void;
  onTranslate: () => void;
  isTranslating: boolean;
  disableTranslate: boolean;
}

const languages = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "zh", label: "Chinese Simplified (简体中文)" },
  { value: "zh-TW", label: "Chinese Traditional (繁體中文)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "pt", label: "Portuguese (Português)" },
  { value: "ru", label: "Russian (Русский)" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "it", label: "Italian (Italiano)" },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedSourceLanguage,
  selectedTargetLanguage,
  selectedService,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onServiceChange,
  onTranslate,
  isTranslating,
  disableTranslate,
}) => {
  // Get service provider type (gemini or deepl)
  const selectedServiceInfo = allTranslationServices.find(s => s.id === selectedService);
  const serviceProvider: TranslationServiceType = selectedServiceInfo?.provider || "gemini";
  
  // Filter languages based on service provider
  const filteredLanguages = languages.filter(lang => {
    // DeepL doesn't support Arabic, Hindi, or Bengali
    if (serviceProvider === "deepl") {
      return !["ar", "hi", "bn"].includes(lang.value);
    }
    return true;
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Bahasa Asal</label>
          <Select 
            value={selectedSourceLanguage} 
            onValueChange={onSourceLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih bahasa asal..." />
            </SelectTrigger>
            <SelectContent>
              {filteredLanguages.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Bahasa Tujuan</label>
          <Select 
            value={selectedTargetLanguage} 
            onValueChange={onTargetLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih bahasa tujuan..." />
            </SelectTrigger>
            <SelectContent>
              {filteredLanguages.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-1">
            <Sparkles size={16} className="text-yellow-500" />
            <span>Layanan Terjemahan</span>
          </label>
          <Select 
            value={selectedService} 
            onValueChange={onServiceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih layanan terjemahan..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {allTranslationServices.map((service) => (
                <SelectItem key={service.id} value={service.id} className="flex items-center justify-between pr-10">
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        className="w-full" 
        onClick={onTranslate} 
        disabled={isTranslating || disableTranslate}
      >
        {isTranslating ? "Menerjemahkan..." : "Terjemahkan Subtitle"}
      </Button>
    </div>
  );
};

export default LanguageSelector;
