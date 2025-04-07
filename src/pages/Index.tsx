
import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ApiKeyManager from "@/components/ApiKeyManager";
import ScriptGenerator from "@/components/ScriptGenerator";
import VoiceGenerator from "@/components/VoiceGenerator";
import ImageGenerator from "@/components/ImageGenerator";
import MediaPreview from "@/components/MediaPreview";
import useMediaStore from "@/store/mediaStore";

const Index = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("script");
  const { 
    currentScript, 
    currentAudioUrl, 
    currentImageUrl,
    setCurrentScript,
    setCurrentAudioUrl,
    setCurrentImageUrl,
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
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
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <div className="mt-4">
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
