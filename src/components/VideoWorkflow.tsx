
import React, { useState } from "react";
import { VideoGenerationResult } from "@/services/videoWorkflowService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Pause, Download, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface VideoWorkflowProps {
  results: VideoGenerationResult;
}

const VideoWorkflow: React.FC<VideoWorkflowProps> = ({ results }) => {
  const { toast } = useToast();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const { script, scenePrompts, imageUrls, audioUrl } = results;

  const handlePlayPauseAudio = () => {
    if (!audioUrl) return;
    
    if (!currentAudio) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsAudioPlaying(false);
      setCurrentAudio(audio);
      audio.play();
      setIsAudioPlaying(true);
    } else {
      if (isAudioPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();
      const mediaFolder = zip.folder("media-forge-content");
      
      if (!mediaFolder) throw new Error("Failed to create folder in zip");
      
      // Add script to zip
      if (script) {
        mediaFolder.file("script.txt", script);
      }
      
      // Add scene descriptions
      if (scenePrompts && scenePrompts.length > 0) {
        const scenesText = scenePrompts.map((scene, index) => 
          `Scene ${index + 1}: ${scene.scene}\n${scene.description}`
        ).join("\n\n");
        mediaFolder.file("scene-descriptions.txt", scenesText);
      }
      
      // Add images to zip
      if (imageUrls && imageUrls.length > 0) {
        const imagePromises = imageUrls.map(async (url, index) => {
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            mediaFolder.file(`scene-${index + 1}.png`, blob);
          } catch (error) {
            console.error(`Error adding image ${index + 1} to zip`, error);
          }
        });
        
        await Promise.all(imagePromises);
      }
      
      // Add audio to zip
      if (audioUrl) {
        try {
          const response = await fetch(audioUrl);
          const blob = await response.blob();
          mediaFolder.file("audio.mp3", blob);
        } catch (error) {
          console.error("Error adding audio to zip", error);
        }
      }
      
      // Generate and download the zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "media-forge-content.zip");
      
      toast({
        title: "Download Complete",
        description: "All generated media files have been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading files:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the files.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Generated Script</h3>
        <div className="bg-muted/30 p-4 rounded-md text-sm max-h-40 overflow-y-auto">
          {script}
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Generated Scenes</h3>
          {audioUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPauseAudio}
            >
              {isAudioPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isAudioPlaying ? "Pause Narration" : "Play Narration"}
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {scenePrompts.map((scene, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="relative">
                <AspectRatio ratio={16/9} className="bg-muted/50">
                  {imageUrls[index] && (
                    <img 
                      src={imageUrls[index]} 
                      alt={scene.scene} 
                      className="object-cover w-full h-full"
                    />
                  )}
                </AspectRatio>
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
                  Scene {index + 1}
                </div>
              </div>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-1">{scene.scene}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{scene.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleDownloadAll} className="space-x-2">
          <Download className="h-4 w-4" />
          <span>Download All Content</span>
        </Button>
      </div>
    </div>
  );
};

export default VideoWorkflow;
