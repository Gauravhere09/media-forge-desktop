
import { generateScript } from "./apiService";
import { createLocalFileUrl } from "./apiService";
import useMediaStore from "@/store/mediaStore";
import { useToast } from "@/hooks/use-toast";

interface ScenePrompt {
  scene: string;
  description: string;
}

export async function generateScenePrompts(mainPrompt: string): Promise<ScenePrompt[]> {
  const apiKey = localStorage.getItem("mediaforge_api_keys") 
    ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "gemini")?.key 
    : "";

  if (!apiKey) {
    throw new Error("Gemini API key not found. Please add your API key in the Settings tab.");
  }

  const scenePromptRequest = `Based on this video idea: "${mainPrompt}", generate 3 distinct scene descriptions for a short video. 
  Format the output as a JSON array with objects that have 'scene' (one-line title) and 'description' (detailed visual description) fields. 
  Make sure the descriptions are detailed enough for image generation.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: scenePromptRequest
        }]
      }]
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Gemini API error:", data);
    throw new Error(`Failed to generate scene prompts: ${data.error?.message || 'Unknown error'}`);
  }
  
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    const responseText = data.candidates[0].content.parts[0].text;
    
    try {
      // Extract JSON array from the response text
      // This handles cases where the model might wrap the JSON in code blocks or add explanations
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (error) {
      console.error("Error parsing scene prompts:", error);
      throw new Error("Failed to parse scene prompts from Gemini response");
    }
  } else {
    throw new Error("Failed to generate scene prompts: " + JSON.stringify(data.error || data));
  }
}

export async function processBatchImages(scenePrompts: ScenePrompt[]): Promise<string[]> {
  const imageUrls: string[] = [];
  
  // Models to try in order of preference
  const models = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
    "prompthero/openjourney"
  ];
  
  const apiKey = localStorage.getItem("mediaforge_api_keys") 
    ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "huggingface")?.key 
    : "";

  if (!apiKey) {
    throw new Error("Hugging Face API key not found. Please add your API key in the Settings tab.");
  }

  // Validate API key first with a test request
  try {
    const testResponse = await fetch(`https://api-inference.huggingface.co/models/${models[0]}`, {
      method: "HEAD",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    if (testResponse.status === 401 || testResponse.status === 403) {
      throw new Error("Invalid or unauthorized Hugging Face API key. Please check your key in the Settings tab.");
    }
  } catch (error) {
    console.error("Error validating Hugging Face API key:", error);
    throw new Error("Failed to validate Hugging Face API key. Please check your internet connection and API key.");
  }
  
  for (const scene of scenePrompts) {
    let success = false;
    
    // Try each model until one works
    for (const model of models) {
      if (!success) {
        try {
          const imageBlob = await generateImage(scene.description, model);
          const imageUrl = URL.createObjectURL(imageBlob);
          imageUrls.push(imageUrl);
          success = true;
          break;
        } catch (error) {
          console.error(`Failed with model ${model}, trying next model...`, error);
        }
      }
    }
    
    if (!success) {
      throw new Error(`Failed to generate image for scene: ${scene.scene}. Please check your Hugging Face API key.`);
    }
  }
  
  return imageUrls;
}

async function generateImage(prompt: string, model: string): Promise<Blob> {
  const apiKey = localStorage.getItem("mediaforge_api_keys") 
    ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "huggingface")?.key 
    : "";

  if (!apiKey) {
    throw new Error("Hugging Face API key not found. Please add your API key in the Settings tab.");
  }

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

  if (!response.ok) {
    // Check specific error codes
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Failed to generate image: Invalid or unauthorized Hugging Face API key`);
    }
    throw new Error(`Failed to generate image with model ${model} (HTTP ${response.status})`);
  }
  
  return await response.blob();
}

export interface VideoGenerationResult {
  script: string;
  scenePrompts: ScenePrompt[];
  imageUrls: string[];
  audioUrl: string | null;
  videoUrl: string | null;
}

export async function generateVideoContent(userPrompt: string): Promise<VideoGenerationResult> {
  const store = useMediaStore.getState();
  
  // 1. Generate script from user prompt
  let script;
  try {
    script = await generateScript(userPrompt);
    store.setCurrentScript(script);
    store.addGeneratedFile({
      name: `Script ${new Date().toLocaleDateString()}`,
      type: "script",
      url: "#",
      content: script
    });
    console.log("Script generated successfully:", script);
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
  
  // 2. Generate scene prompts based on the script
  let scenePrompts;
  try {
    scenePrompts = await generateScenePrompts(userPrompt);
    console.log("Scene prompts generated successfully:", scenePrompts);
  } catch (error) {
    console.error("Error generating scene prompts:", error);
    throw error;
  }
  
  // 3. Generate images for each scene
  let imageUrls;
  try {
    imageUrls = await processBatchImages(scenePrompts);
    console.log("Images generated successfully:", imageUrls);
    imageUrls.forEach((url, index) => {
      store.addGeneratedFile({
        name: `Scene ${index + 1} Image`,
        type: "image",
        url: url
      });
    });
    
    // Use the first image as the main preview image
    if (imageUrls.length > 0) {
      store.setCurrentImageUrl(imageUrls[0]);
    }
  } catch (error) {
    console.error("Error generating images:", error);
    throw error;
  }
  
  // 4. Generate audio from the script
  let audioUrl = null;
  try {
    // Validate ElevenLabs API key first
    const elevenLabsApiKey = localStorage.getItem("mediaforge_api_keys") 
      ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "elevenlabs")?.key 
      : "";
      
    if (!elevenLabsApiKey) {
      throw new Error("ElevenLabs API key not found. Please add your API key in the Settings tab.");
    }
    
    // Check if API key is valid with a simple request
    const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "x-api-key": elevenLabsApiKey,
      },
    });
    
    if (!voicesResponse.ok) {
      if (voicesResponse.status === 401) {
        throw new Error("Invalid ElevenLabs API key. Please check your key in the Settings tab.");
      }
      throw new Error(`ElevenLabs API error (HTTP ${voicesResponse.status})`);
    }
    
    const voices = await voicesResponse.json();
    
    if (voices.voices && voices.voices.length > 0) {
      const defaultVoice = voices.voices[0].voice_id;
      
      const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoice}`, {
        method: "POST",
        headers: {
          "x-api-key": elevenLabsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });
      
      if (!audioResponse.ok) {
        if (audioResponse.status === 401) {
          throw new Error("Invalid ElevenLabs API key for audio generation.");
        }
        throw new Error(`Failed to generate audio (HTTP ${audioResponse.status})`);
      }
      
      const audioBlob = await audioResponse.blob();
      
      audioUrl = URL.createObjectURL(audioBlob);
      store.setCurrentAudioUrl(audioUrl);
      
      store.addGeneratedFile({
        name: `Audio ${new Date().toLocaleDateString()}`,
        type: "audio",
        url: audioUrl
      });
      
      console.log("Audio generated successfully");
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
  
  // We'll implement video generation in a separate step
  const videoUrl = null;
  
  return {
    script,
    scenePrompts,
    imageUrls,
    audioUrl,
    videoUrl
  };
}
