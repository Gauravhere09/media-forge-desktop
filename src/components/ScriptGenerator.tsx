
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScriptGeneratorProps {
  onScriptGenerated?: (script: string) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ onScriptGenerated }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [scriptLength, setScriptLength] = useState("medium");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateScript = async () => {
    const apiKey = localStorage.getItem("mediaforge_api_keys") 
      ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "gemini")?.key 
      : "";

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Gemini API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt to generate a script.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Length guidelines based on selection
      const lengthGuide = {
        short: "about 50 words",
        medium: "about 100-150 words",
        long: "about 250-300 words"
      }[scriptLength];
      
      const scriptPrompt = `Generate a creative script ${lengthGuide} based on the following prompt: "${prompt}". 
      Make it engaging, conversational and suitable for voice narration. Don't include any headers, just the script content.`;
      
      // Set up the API call to Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: scriptPrompt
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const generatedText = data.candidates[0].content.parts[0].text;
        setGeneratedScript(generatedText);
        if (onScriptGenerated) {
          onScriptGenerated(generatedText);
        }
        
        toast({
          title: "Script Generated",
          description: "Your script has been successfully created!",
        });
      } else {
        throw new Error("Failed to generate script");
      }
    } catch (error) {
      console.error("Script generation error:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveScript = () => {
    if (!generatedScript) return;
    
    // In a real electron app, we would use the fs module to save the file
    // For this web demo, we'll use a download link
    const element = document.createElement("a");
    const file = new Blob([generatedScript], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `script-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Script Saved",
      description: "Your script has been saved locally.",
    });
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Script Generator</CardTitle>
        <CardDescription>
          Generate creative scripts using Gemini AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Enter a prompt for your script (e.g., 'Create a short ad about a flying car that runs on renewable energy')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-24 resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="length">Script Length</Label>
          <div className="flex items-center space-x-2">
            {["short", "medium", "long"].map((length) => (
              <Button
                key={length}
                variant={scriptLength === length ? "default" : "outline"}
                onClick={() => setScriptLength(length)}
                className="capitalize"
              >
                {length}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="generated-script">Generated Script</Label>
            {generatedScript && (
              <Button variant="ghost" size="sm" onClick={handleSaveScript}>
                Save as File
              </Button>
            )}
          </div>
          <Textarea
            id="generated-script"
            value={generatedScript}
            onChange={(e) => setGeneratedScript(e.target.value)}
            placeholder="Your generated script will appear here..."
            className="h-64 resize-none"
            readOnly={isGenerating}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateScript}
          disabled={isGenerating || !prompt}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating Script...
            </>
          ) : (
            "Generate Script"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ScriptGenerator;
