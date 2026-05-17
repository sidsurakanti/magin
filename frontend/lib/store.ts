import { create } from "zustand";

export type AppStore = {
  jobId: null | string;
  storyboardChunk: null | string;
  codegenChunk: null | string;
  videoUrl: null | string;
  status: string;
  iteration: number;
  error: null | string;
  setStatus: (newStatus: string) => void;
  setJobId: (newJobId: string) => void;
  setIteration: (newIteration: number) => void;
  setStoryboardChunk: (newChunk: string | null) => void;
  setCodegenChunk: (newChunk: string | null) => void;
  appendStoryboardChunk: (delta: string) => void;
  appendCodegenChunk: (delta: string) => void;
  setVideoUrl: (newUrl: string) => void;
  setError: (error: string | null) => void;
};

export const useAppStore = create((set) => ({
  status: "idle",
  jobId: null,
  storyboardChunk: null,
  codegenChunk: null,
  videoUrl: null,
  iteration: 0,
  error: null,
  setIteration: (newIteration: number) => set({ iteration: newIteration }),
  setStatus: (newStatus: string) => set({ status: newStatus }),
  setJobId: (newJobId: string) => set({ jobId: newJobId }),
  setStoryboardChunk: (newChunk: string | null) => set({ storyboardChunk: newChunk }),
  setCodegenChunk: (newChunk: string | null) => set({ codegenChunk: newChunk }),
  appendStoryboardChunk: (delta: string) =>
    set((state: AppStore) => ({ storyboardChunk: (state.storyboardChunk ?? "") + delta })),
  appendCodegenChunk: (delta: string) =>
    set((state: AppStore) => ({ codegenChunk: (state.codegenChunk ?? "") + delta })),
  setVideoUrl: (newUrl: string) => set({ videoUrl: newUrl }),
  setError: (error: string | null) => set({ error }),
}));
