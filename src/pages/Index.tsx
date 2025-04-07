
import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ApiKeyManager from "@/components/ApiKeyManager";
import ScriptGenerator from "@/components/ScriptGenerator";
import VoiceGenerator from "@/components/VoiceGenerator";
import ImageGenerator from "@/components/ImageGenerator";
import MediaPreview from "@/components/MediaPreview";
import FileManager from "@/components/FileManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Wand2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useMediaStore from "@/store/mediaStore";
import { generateVideoContent, VideoGenerationResult } from "@/services/videoWorkflowService";
import VideoWorkflow from "@/components/VideoWorkflow";

const Index = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("workflow");
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<VideoGenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const { 
    currentScript, 
    currentAudioUrl, 
    currentImageUrl,
    setCurrentScript,
    setCurrentAudioUrl,
    setCurrentImageUrl,
    generatedFiles,
    addGeneratedFile
  } = useMediaStore();

  const handleScriptGenerated = (script: string) => {
    setCurrentScript(script);
    addGeneratedFile({
      name: `Script ${new Date().toLocaleDateString()}`,
      type: "script",
      url: "#", // In a real app, this would be a file path
      content: script
    });
  };

  const handleVoiceGenerated = (audioUrl: string) => {
    setCurrentAudioUrl(audioUrl);
    addGeneratedFile({
      name: `Audio ${new Date().toLocaleDateString()}`,
      type: "audio",
      url: audioUrl
    });
  };

  const handleImageGenerated = (imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    addGeneratedFile({
      name: `Image ${new Date().toLocaleDateString()}`,
      type: "image",
      url: imageUrl
    });
  };

  const checkApiKeys = () => {
    const apiKeys = localStorage.getItem("mediaforge_api_keys") 
      ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]")
      : [];

    const hasGemini = apiKeys.some((k: any) => k.name === "gemini" && k.key);
    const hasElevenLabs = apiKeys.some((k: any) => k.name === "elevenlabs" && k.key);
    const hasHuggingFace = apiKeys.some((k: any) => k.name === "huggingface" && k.key);

    const missingKeys = [];
    if (!hasGemini) missingKeys.push("Gemini");
    if (!hasElevenLabs) missingKeys.push("ElevenLabs");
    if (!hasHuggingFace) missingKeys.push("Hugging Face");

    return {
      allKeysPresent: hasGemini && hasElevenLabs && hasHuggingFace,
      missingKeys
    };
  };

  const handleGenerateContent = async () => {
    if (!userPrompt) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a video idea to generate content.",
        variant: "destructive",
      });
      return;
    }

    // Check API keys
    const { allKeysPresent, missingKeys } = checkApiKeys();

    if (!allKeysPresent) {
      toast({
        title: "Missing API Keys",
        description: `Please set the following API keys in the settings tab: ${missingKeys.join(", ")}`,
        variant: "destructive",
      });
      setCurrentTab("settings");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const results = await generateVideoContent(userPrompt);
      setGenerationResults(results);
      
      toast({
        title: "Content Generated Successfully",
        description: "Your video content has been created!",
      });
    } catch (error: any) {
      console.error("Content generation error:", error);
      setGenerationError(error.message || "An unknown error occurred");
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
            MediaForge
          </h1>
          <p className="text-muted-foreground">
            A powerful AI media generation desktop app
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="workflow">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Video Generation Workflow</CardTitle>
                      <CardDescription>
                        Generate a complete video with script, images, and audio in one go
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Describe your video idea in detail (e.g., 'Create a 30-second commercial about a futuristic electric car that runs on renewable energy')"
                          value={userPrompt}
                          onChange={(e) => setUserPrompt(e.target.value)}
                          className="h-32 resize-none"
                          disabled={isGenerating}
                        />
                      </div>
                      
                      {generationError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <AlertDescription>{generationError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {generationResults && !isGenerating && (
                        <VideoWorkflow results={generationResults} />
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={handleGenerateContent}
                        disabled={isGenerating || !userPrompt}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Generating Content...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Video Content
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="script">
                  <ScriptGenerator onScriptGenerated={handleScriptGenerated} />
                </TabsContent>
                
                <TabsContent value="voice">
                  <VoiceGenerator 
                    initialText={currentScript || ""} 
                    onVoiceGenerated={handleVoiceGenerated} 
                  />
                </TabsContent>
                
                <TabsContent value="image">
                  <ImageGenerator 
                    initialPrompt={currentScript || ""} 
                    onImageGenerated={handleImageGenerated}
                  />
                </TabsContent>
                
                <TabsContent value="settings">
                  <ApiKeyManager />
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <MediaPreview 
              scriptContent={currentScript || undefined}
              audioUrl={currentAudioUrl || undefined}
              imageUrl={currentImageUrl || undefined}
            />
            
            <FileManager files={generatedFiles} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
