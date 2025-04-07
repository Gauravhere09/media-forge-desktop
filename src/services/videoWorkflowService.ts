
import { generateScript } from "./apiService";
import { createLocalFileUrl } from "./apiService";
import useMediaStore from "@/store/mediaStore";

interface ScenePrompt {
  scene: string;
  description: string;
}

export async function generateScenePrompts(mainPrompt: string): Promise<ScenePrompt[]> {
  const apiKey = localStorage.getItem("mediaforge_api_keys") 
    ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "gemini")?.key 
    : "";

  if (!apiKey) {
    throw new Error("Gemini API key not found");
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
          console.error(`Failed with model ${model}, trying next model...`);
        }
      }
    }
    
    if (!success) {
      throw new Error(`Failed to generate image for scene: ${scene.scene}`);
    }
  }
  
  return imageUrls;
}

async function generateImage(prompt: string, model: string): Promise<Blob> {
  const apiKey = localStorage.getItem("mediaforge_api_keys") 
    ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "huggingface")?.key 
    : "";

  if (!apiKey) {
    throw new Error("Hugging Face API key not found");
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
    throw new Error(`Failed to generate image with model ${model}`);
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
  const script = await generateScript(userPrompt);
  store.setCurrentScript(script);
  store.addGeneratedFile({
    name: `Script ${new Date().toLocaleDateString()}`,
    type: "script",
    url: "#",
    content: script
  });
  
  // 2. Generate scene prompts based on the script
  const scenePrompts = await generateScenePrompts(userPrompt);
  
  // 3. Generate images for each scene
  const imageUrls = await processBatchImages(scenePrompts);
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
  
  // 4. Generate audio from the script
  let audioUrl = null;
  try {
    const voices = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "x-api-key": localStorage.getItem("mediaforge_api_keys") 
          ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "elevenlabs")?.key 
          : "",
      },
    }).then(res => res.json());
    
    if (voices.voices && voices.voices.length > 0) {
      const defaultVoice = voices.voices[0].voice_id;
      
      const audioBlob = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoice}`, {
        method: "POST",
        headers: {
          "x-api-key": localStorage.getItem("mediaforge_api_keys") 
            ? JSON.parse(localStorage.getItem("mediaforge_api_keys") || "[]").find((k: any) => k.name === "elevenlabs")?.key 
            : "",
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
      }).then(res => res.blob());
      
      audioUrl = URL.createObjectURL(audioBlob);
      store.setCurrentAudioUrl(audioUrl);
      
      store.addGeneratedFile({
        name: `Audio ${new Date().toLocaleDateString()}`,
        type: "audio",
        url: audioUrl
      });
    }
  } catch (error) {
    console.error("Error generating audio:", error);
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
