
/**
 * Service for handling API calls to external services
 */

// Get API keys from local storage
const getApiKey = (name: string): string => {
  const savedKeys = localStorage.getItem("mediaforge_api_keys");
  if (!savedKeys) return "";
  
  try {
    const parsedKeys = JSON.parse(savedKeys);
    const key = parsedKeys.find((k: any) => k.name === name);
    return key ? key.key : "";
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return "";
  }
};

// Gemini API for script generation
export const generateScript = async (prompt: string, length: string = "medium") => {
  const apiKey = getApiKey("gemini");
  if (!apiKey) {
    throw new Error("Gemini API key not found");
  }

  // Length guidelines based on selection
  const lengthGuide = {
    short: "about 50 words",
    medium: "about 100-150 words",
    long: "about 250-300 words"
  }[length];
  
  const scriptPrompt = `Generate a creative script ${lengthGuide} based on the following prompt: "${prompt}". 
  Make it engaging, conversational and suitable for voice narration. Don't include any headers, just the script content.`;
  
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
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Failed to generate script: " + JSON.stringify(data.error || data));
  }
};

// ElevenLabs API for voice generation
export const getVoices = async () => {
  const apiKey = getApiKey("elevenlabs");
  if (!apiKey) {
    throw new Error("ElevenLabs API key not found");
  }

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: {
      "x-api-key": apiKey,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.voices;
};

export const generateVoice = async (
  text: string,
  voiceId: string
): Promise<Blob> => {
  const apiKey = getApiKey("elevenlabs");
  if (!apiKey) {
    throw new Error("ElevenLabs API key not found");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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

  if (!response.ok) {
    throw new Error(`Failed to generate voice: ${response.statusText}`);
  }
  
  return await response.blob();
};

// Hugging Face API for image generation
export const generateImage = async (
  prompt: string,
  model: string = "stabilityai/stable-diffusion-xl-base-1.0"
): Promise<Blob> => {
  const apiKey = getApiKey("huggingface");
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
    throw new Error(`Failed to generate image: ${response.statusText}`);
  }
  
  return await response.blob();
};

// Helper to create a local file URL from a blob
export const createLocalFileUrl = (blob: Blob, filename: string): string => {
  // In a real electron app, we would use the fs module to save the file
  // For this web demo, we'll use object URLs
  return URL.createObjectURL(blob);
};
