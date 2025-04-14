
import { useState } from "react";
import { Upload, Languages, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploader from "@/components/FileUploader";
import LanguageSelector from "@/components/LanguageSelector";
import TranslationResult from "@/components/TranslationResult";
import { SubtitleEntry, TranslationServiceType } from "@/types/subtitle";
import { parseSRT, createSRTContent } from "@/utils/srtParser";
import { translateSubtitles } from "@/services/geminiService";
import { translateWithDeepL } from "@/services/deeplService";
import { allTranslationServices } from "@/services/translationServices";
import { toast } from "sonner";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("id");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [selectedService, setSelectedService] = useState(allTranslationServices[0].id);
  const [originalSubtitles, setOriginalSubtitles] = useState<SubtitleEntry[]>([]);
  const [translatedSubtitles, setTranslatedSubtitles] = useState<SubtitleEntry[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      if (!uploadedFile) {
        setFile(null);
        setOriginalSubtitles([]);
        setTranslatedSubtitles([]);
        return;
      }
      
      setFile(uploadedFile);
      setTranslatedSubtitles([]);
      
      const content = await uploadedFile.text();
      const subtitles = parseSRT(content);
      
      if (subtitles.length === 0) {
        toast.error("File SRT tidak valid atau kosong");
        return;
      }
      
      setOriginalSubtitles(subtitles);
      toast.success(`Berhasil memuat ${subtitles.length} baris subtitle`);
      
    } catch (error) {
      toast.error("Gagal mengurai file SRT. Silakan periksa format file.");
      console.error("SRT parsing error:", error);
    }
  };

  const handleTranslate = async () => {
    if (originalSubtitles.length === 0) {
      toast.error("Silakan unggah file SRT yang valid terlebih dahulu");
      return;
    }

    setIsTranslating(true);

    try {
      // Get the service provider type
      const serviceInfo = allTranslationServices.find(s => s.id === selectedService);
      if (!serviceInfo) {
        throw new Error("Layanan terjemahan tidak valid");
      }
      
      let translated: SubtitleEntry[];
      
      // Choose the appropriate translation service
      if (serviceInfo.provider === "deepl") {
        console.log(`Menerjemahkan dengan DeepL dari ${sourceLanguage} ke ${targetLanguage}`);
        
        try {
          translated = await translateWithDeepL(originalSubtitles, sourceLanguage, targetLanguage);
        } catch (error) {
          console.error("DeepL translation specific error:", error);
          toast.error(`DeepL API Error: ${(error as Error).message}`);
          // Show more detailed error for DeepL
          if ((error as Error).message.includes("Failed to fetch") || (error as Error).message.includes("Network Error")) {
            toast.error("Koneksi ke DeepL API gagal. Periksa koneksi internet atau coba gunakan layanan terjemahan lainnya.");
          }
          throw error;
        }
      } else {
        console.log(`Menerjemahkan dengan Gemini dari ${sourceLanguage} ke ${targetLanguage} menggunakan model ${selectedService}`);
        translated = await translateSubtitles(originalSubtitles, sourceLanguage, targetLanguage, selectedService);
      }
      
      setTranslatedSubtitles(translated);
      toast.success(`Terjemahan berhasil: ${translated.length} baris subtitle`);
    } catch (error) {
      toast.error(`Terjemahan gagal: ${(error as Error).message}`);
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = () => {
    if (translatedSubtitles.length === 0) {
      toast.error("Tidak ada subtitle terjemahan untuk diunduh");
      return;
    }

    const content = createSRTContent(translatedSubtitles);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = file ? `translated_${file.name}` : "translated_subtitles.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("File subtitle berhasil diunduh");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Terjemahan Subtitle</h1>
          <p className="text-muted-foreground">Upload file SRT Anda dan terjemahkan ke bahasa lain menggunakan AI</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={20} />
                <span>Upload File SRT</span>
              </CardTitle>
              <CardDescription>
                Seret dan lepas file SRT Anda atau klik untuk memilih file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUpload={handleFileUpload} file={file} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages size={20} />
                <span>Pilih Bahasa dan Layanan</span>
              </CardTitle>
              <CardDescription>
                Pilih bahasa asal, bahasa tujuan, dan layanan terjemahan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSelector 
                selectedSourceLanguage={sourceLanguage}
                selectedTargetLanguage={targetLanguage}
                selectedService={selectedService}
                onSourceLanguageChange={setSourceLanguage}
                onTargetLanguageChange={setTargetLanguage}
                onServiceChange={setSelectedService}
                onTranslate={handleTranslate}
                isTranslating={isTranslating}
                disableTranslate={originalSubtitles.length === 0}
              />
            </CardContent>
          </Card>

          {translatedSubtitles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  <span>Subtitle Terjemahan</span>
                </CardTitle>
                <CardDescription>
                  Hasil terjemahan dari file SRT Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TranslationResult 
                  original={originalSubtitles}
                  translated={translatedSubtitles}
                  onDownload={handleDownload}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
