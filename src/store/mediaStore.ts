
import { create } from 'zustand';

interface MediaFile {
  id: string;
  name: string;
  type: "script" | "audio" | "image" | "video";
  url: string;
  content?: string;
  createdAt: Date;
}

interface MediaStore {
  currentScript: string | null;
  currentAudioUrl: string | null;
  currentImageUrl: string | null;
  currentVideoUrl: string | null;
  generatedFiles: MediaFile[];
  setCurrentScript: (script: string | null) => void;
  setCurrentAudioUrl: (url: string | null) => void;
  setCurrentImageUrl: (url: string | null) => void;
  setCurrentVideoUrl: (url: string | null) => void;
  addGeneratedFile: (file: Omit<MediaFile, "id" | "createdAt">) => void;
  clearCurrent: () => void;
}

const useMediaStore = create<MediaStore>((set) => ({
  currentScript: null,
  currentAudioUrl: null,
  currentImageUrl: null,
  currentVideoUrl: null,
  generatedFiles: [],
  
  setCurrentScript: (script) => set({ currentScript: script }),
  setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),
  setCurrentImageUrl: (url) => set({ currentImageUrl: url }),
  setCurrentVideoUrl: (url) => set({ currentVideoUrl: url }),
  
  addGeneratedFile: (file) => set((state) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    return {
      generatedFiles: [newFile, ...state.generatedFiles]
    };
  }),
  
  clearCurrent: () => set({
    currentScript: null,
    currentAudioUrl: null,
    currentImageUrl: null,
    currentVideoUrl: null,
  }),
}));

export default useMediaStore;
