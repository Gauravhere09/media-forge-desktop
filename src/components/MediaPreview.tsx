
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Pause, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaPreviewProps {
  scriptContent?: string;
  audioUrl?: string;
  imageUrl?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  scriptContent,
  audioUrl,
  imageUrl,
}) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    } else if (audioUrl) {
      audioRef.current!.src = audioUrl;
    }
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSaveAll = () => {
    // In a real electron app, we would use the fs module to save all files
    // For this web demo, we'll trigger individual downloads
    
    // Save script
    if (scriptContent) {
      const scriptElement = document.createElement("a");
      const scriptFile = new Blob([scriptContent], { type: "text/plain" });
      scriptElement.href = URL.createObjectURL(scriptFile);
      scriptElement.download = `script-${Date.now()}.txt`;
      document.body.appendChild(scriptElement);
      scriptElement.click();
      document.body.removeChild(scriptElement);
    }
    
    // Save audio
    if (audioUrl) {
      const audioElement = document.createElement("a");
      audioElement.href = audioUrl;
      audioElement.download = `audio-${Date.now()}.mp3`;
      document.body.appendChild(audioElement);
      audioElement.click();
      document.body.removeChild(audioElement);
    }
    
    // Save image
    if (imageUrl) {
      const imageElement = document.createElement("a");
      imageElement.href = imageUrl;
      imageElement.download = `image-${Date.now()}.png`;
      document.body.appendChild(imageElement);
      imageElement.click();
      document.body.removeChild(imageElement);
    }
    
    toast({
      title: "Media Saved",
      description: "All generated media files have been saved locally.",
    });
  };

  const hasContent = scriptContent || audioUrl || imageUrl;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Media Preview</CardTitle>
        <CardDescription>
          Preview and manage your generated media
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {imageUrl && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Generated Image</h3>
            <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-md">
              <img 
                src={imageUrl} 
                alt="Generated content" 
                className="object-cover h-full w-full"
              />
            </AspectRatio>
          </div>
        )}
        
        {audioUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Generated Audio</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="h-12 bg-muted/50 rounded-md flex items-center justify-center">
              {isPlaying ? (
                <div className="flex space-x-1">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 h-6 bg-primary animate-pulse" 
                      style={{ animationDelay: `${i * 0.15}s` }}
                    ></div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Audio loaded. Click play to listen.</span>
              )}
            </div>
          </div>
        )}
        
        {scriptContent && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Generated Script</h3>
            <div className="max-h-36 overflow-y-auto p-3 bg-muted/50 text-sm rounded-md">
              {scriptContent}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveAll} className="space-x-2">
          <Download className="h-4 w-4" />
          <span>Save All Files</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MediaPreview;
