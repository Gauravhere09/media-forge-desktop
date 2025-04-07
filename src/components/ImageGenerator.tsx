
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader, ImageIcon, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageGeneratorProps {
  initialPrompt?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  initialPrompt = "",
  onImageGenerated,
}) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState("stabilityai/stable-diffusion-xl-base-1.0");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // List of available models
  const models = [
    { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL" },
    { id: "runwayml/stable-diffusion-v1-5", name: "Stable Diffusion v1.5" },
    { id: "prompthero/openjourney", name: "OpenJourney" },
  ];

  const handleGenerateImage = async () => {
    const apiKey = localStorage.getItem("mediaforge_api_keys") 
      ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "huggingface")?.key 
      : "";

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Hugging Face API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate image");
      
      // Get image blob from response
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      
      // Set generated image
      setGeneratedImage(imageUrl);
      
      // Call callback if provided
      if (onImageGenerated) {
        onImageGenerated(imageUrl);
      }
      
      toast({
        title: "Image Generated",
        description: "Your image has been successfully created!",
      });
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImage = () => {
    if (!generatedImage) return;
    
    // In a real electron app, we would use the fs module to save the file
    // For this web demo, we'll use a download link
    const element = document.createElement("a");
    element.href = generatedImage;
    element.download = `image-${Date.now()}.png`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Image Saved",
      description: "Your image has been saved locally.",
    });
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Image Generator</CardTitle>
        <CardDescription>
          Create images from text descriptions using Hugging Face models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Image Prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate in detail..."
            className="h-24 resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Select Model</Label>
          <Select
            value={model}
            onValueChange={setModel}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {generatedImage && (
          <div className="space-y-4 p-4 rounded-md bg-muted/30">
            <AspectRatio ratio={1 / 1} className="bg-muted">
              <img
                src={generatedImage}
                alt="Generated"
                className="rounded-md object-cover h-full w-full"
              />
            </AspectRatio>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveImage}
                disabled={isGenerating}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Image
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!generatedImage ? (
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating || !prompt}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default ImageGenerator;
