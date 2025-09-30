"use client";

import { TabsContent } from "@/components/ui/tabs";
import { type AppStore, useAppStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SourcePanel() {
  const { status, storyboardChunk, codegenChunk } = useAppStore<AppStore>(
    (state) => state as AppStore,
  );
  const storyboardRef = useRef<HTMLDivElement>(null);
  const codegenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyboardRef.current) {
      storyboardRef.current.scrollTop = storyboardRef.current.scrollHeight; // stick bottom
    }
  }, [storyboardChunk]);

  useEffect(() => {
    if (codegenRef.current) {
      codegenRef.current.scrollTop = codegenRef.current.scrollHeight; // stick bottom
    }
  }, [codegenChunk]);

  if (status === "idle") {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-neutral-700 text-xl font-light">
          Submit a prompt to get started.
        </p>
        <div className="absolute -z-[1000] top-1/2 left-1/2 w-100 h-105 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-sky-200 to-blue-200 rounded-full blur-3xl opacity-50 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <TabsContent
        value="source"
        className="mt-4 w-full h-full flex justify-center gap-5"
      >
        <div
          ref={storyboardRef}
          className={cn(
            storyboardChunk ? "bg-pink-50" : "",
            "prose text-xs h-full w-[600px] overflow-auto markdown flex flex-col items-center px-6 py-2 rounded-md",
          )}
        >
          {storyboardChunk && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {storyboardChunk}
            </ReactMarkdown>
          )}
        </div>

        <div
          ref={codegenRef}
          className="prose text-xs h-full w-[600px] overflow-auto markdown rounded-md"
        >
          {codegenChunk && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {codegenChunk}
            </ReactMarkdown>
          )}
        </div>
      </TabsContent>
    </>
  );
}
