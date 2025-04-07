
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKey {
  name: string;
  key: string;
  isSet: boolean;
}

interface ApiKeyInfo {
  name: string;
  description: string;
  requiredFor: string;
  link: string;
  linkText: string;
}

const ApiKeyManager: React.FC = () => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { name: "gemini", key: "", isSet: false },
    { name: "elevenlabs", key: "", isSet: false },
    { name: "huggingface", key: "", isSet: false },
  ]);

  const keyInfo: ApiKeyInfo[] = [
    {
      name: "gemini",
      description: "Used to generate scripts and scene descriptions",
      requiredFor: "script and scene generation",
      link: "https://aistudio.google.com/app/apikey",
      linkText: "Get Gemini API Key"
    },
    {
      name: "elevenlabs",
      description: "Used to convert text to realistic speech",
      requiredFor: "voice generation",
      link: "https://elevenlabs.io/app/api-keys",
      linkText: "Get ElevenLabs API Key"
    },
    {
      name: "huggingface",
      description: "Used for AI image generation from scene descriptions",
      requiredFor: "image generation",
      link: "https://huggingface.co/settings/tokens",
      linkText: "Get Hugging Face API Key"
    }
  ];

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedKeys = localStorage.getItem("mediaforge_api_keys");
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(
          apiKeys.map((key) => {
            const saved = parsedKeys.find((k: ApiKey) => k.name === key.name);
            if (saved) {
              return { ...key, key: saved.key, isSet: true };
            }
            return key;
          })
        );
      } catch (error) {
        console.error("Error loading API keys:", error);
      }
    }
  }, []);

  const handleSaveKey = (index: number, value: string) => {
    const newApiKeys = [...apiKeys];
    newApiKeys[index].key = value;
    newApiKeys[index].isSet = value.trim() !== "";
    setApiKeys(newApiKeys);

    // Save to localStorage
    localStorage.setItem("mediaforge_api_keys", JSON.stringify(newApiKeys));
    
    toast({
      title: `${newApiKeys[index].name.charAt(0).toUpperCase() + newApiKeys[index].name.slice(1)} API Key Updated`,
      description: "Your API key has been saved locally.",
    });
  };

  const getApiKey = (name: string) => {
    const key = apiKeys.find((k) => k.name === name);
    return key ? key.key : "";
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>API Key Management</CardTitle>
        <CardDescription>
          Set your API keys to enable media generation. Keys are stored locally and never sent to any server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="mb-4">
          <AlertDescription>
            All features require valid API keys. If you're experiencing errors, please ensure you've entered valid API keys below.
          </AlertDescription>
        </Alert>
        
        {apiKeys.map((apiKey, index) => {
          const info = keyInfo.find(k => k.name === apiKey.name);
          
          return (
            <div key={apiKey.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`key-${apiKey.name}`} className="capitalize">
                  {apiKey.name} API Key
                </Label>
                {apiKey.isSet ? (
                  <div className="flex items-center text-green-500 text-xs">
                    <Check size={14} className="mr-1" /> Set
                  </div>
                ) : (
                  <div className="flex items-center text-destructive text-xs">
                    <X size={14} className="mr-1" /> Not Set
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Input
                  id={`key-${apiKey.name}`}
                  type="password"
                  value={apiKey.key}
                  onChange={(e) => {
                    const newApiKeys = [...apiKeys];
                    newApiKeys[index].key = e.target.value;
                    setApiKeys(newApiKeys);
                  }}
                  placeholder={`Enter your ${apiKey.name} API key`}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSaveKey(index, apiKeys[index].key)}
                  variant="outline"
                >
                  Save
                </Button>
              </div>
              <div className="flex justify-between items-start">
                <p className="text-xs text-muted-foreground">
                  {info?.description} <br/>
                  <span className="font-medium">Required for: </span>{info?.requiredFor}
                </p>
                <a 
                  href={info?.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-primary flex items-center"
                >
                  {info?.linkText} <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ApiKeyManager;
