import { create } from "zustand";

export type AppStore = {
  jobId: null | string;
  storyboardChunk: null | string;
  codegenChunk: null | string;
  videoUrl: null | string;
  status: string;
  iteration: number;
  setStatus: (newStatus: string) => void;
  setJobId: (newJobId: string) => void;
  setIteration: (newIteration: number) => void;
  setStoryboardChunk: (newChunk: string) => void;
  setCodegenChunk: (newChunk: string) => void;
  setVideoUrl: (newUrl: string) => void;
};

export const useAppStore = create((set) => ({
  status: "idle",
  jobId: null,
  storyboardChunk: null,
  codegenChunk: null,
  videoUrl: null,
  iteration: 0,
  setIteration: (newIteration: number) => set({ iteration: newIteration }),
  setStatus: (newStatus: string) => set({ status: newStatus }),
  setJobId: (newJobId: string) => set({ jobId: newJobId }),
  setStoryboardChunk: (newChunk: string) => set({ storyboardChunk: newChunk }),
  setCodegenChunk: (newChunk: string) => set({ codegenChunk: newChunk }),
  setVideoUrl: (newUrl: string) => set({ videoUrl: newUrl }),
}));
