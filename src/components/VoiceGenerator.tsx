
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader, Volume2, Volume1, VolumeX, Play, Pause, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceGeneratorProps {
  initialText?: string;
  onVoiceGenerated?: (audioUrl: string) => void;
}

interface Voice {
  voice_id: string;
  name: string;
}

const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ 
  initialText = "", 
  onVoiceGenerated 
}) => {
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch available voices when component mounts
  useEffect(() => {
    const fetchVoices = async () => {
      const apiKey = localStorage.getItem("mediaforge_api_keys") 
        ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "elevenlabs")?.key 
        : "";
      
      if (!apiKey) return;

      try {
        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: {
            "x-api-key": apiKey,
          },
        });
        
        if (!response.ok) throw new Error("Failed to fetch voices");
        
        const data = await response.json();
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices);
          setSelectedVoice(data.voices[0].voice_id);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
      }
    };

    fetchVoices();
  }, []);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

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

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleGenerateVoice = async () => {
    const apiKey = localStorage.getItem("mediaforge_api_keys") 
      ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "elevenlabs")?.key 
      : "";

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your ElevenLabs API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!text) {
      toast({
        title: "Empty Text",
        description: "Please enter text to generate voice.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: "No Voice Selected",
        description: "Please select a voice for generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate voice");
      
      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set generated audio
      setGeneratedAudio(audioUrl);
      
      // Create audio element
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = handleAudioEnded;
      } else {
        audioRef.current.src = audioUrl;
      }

      audioRef.current.volume = volume / 100;
      
      // Call callback if provided
      if (onVoiceGenerated) {
        onVoiceGenerated(audioUrl);
      }
      
      toast({
        title: "Voice Generated",
        description: "Your voice has been successfully generated!",
      });
    } catch (error) {
      console.error("Voice generation error:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAudio = () => {
    if (!generatedAudio) return;
    
    // In a real electron app, we would use the fs module to save the file
    // For this web demo, we'll use a download link
    const element = document.createElement("a");
    element.href = generatedAudio;
    element.download = `voice-${Date.now()}.mp3`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Audio Saved",
      description: "Your audio file has been saved locally.",
    });
  };

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 50) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Voice Generator</CardTitle>
        <CardDescription>
          Convert text to realistic speech using ElevenLabs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-to-speech">Text to Speak</Label>
          <Textarea
            id="text-to-speech"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to convert to speech..."
            className="h-36 resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="voice">Select Voice</Label>
          <Select
            value={selectedVoice}
            onValueChange={setSelectedVoice}
            disabled={voices.length === 0}
          >
            <SelectTrigger id="voice">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </SelectItem>
              ))}
              {voices.length === 0 && (
                <SelectItem value="none" disabled>
                  No voices available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {voices.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Set your ElevenLabs API key in settings to load available voices
            </p>
          )}
        </div>

        {generatedAudio && (
          <div className="space-y-4 p-4 rounded-md bg-muted/30">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                disabled={isGenerating}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <div className="flex items-center flex-1 px-4 space-x-2">
                <VolumeIcon className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveAudio}
                disabled={isGenerating}
              >
                <Save className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateVoice}
          disabled={isGenerating || !text || !selectedVoice}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating Voice...
            </>
          ) : (
            "Generate Voice"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VoiceGenerator;
