"use client";

import { TabsContent } from "@/components/ui/tabs";
import { type AppStore, useAppStore } from "@/lib/store";
import { useRef } from "react";
import { cn } from "@/lib/utils";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SourcePanel() {
  const { status, storyboardChunk, codegenChunk } = useAppStore<AppStore>(
    (state) => state as AppStore,
  );
  const storyboardRef = useRef<HTMLDivElement>(null);
  const codegenRef = useRef<HTMLDivElement>(null);

  if (status === "idle") {
    return (
      <div className="debug h-full w-full flex items-center justify-center">
        <p className="text-gray-500">Submit a prompt to get started.</p>
      </div>
    );
  }

  return (
    <>
      <TabsContent
        value="source"
        className="w-full h-full flex justify-center gap-12 "
      >
        <div
          ref={storyboardRef}
          className={cn(
            storyboardChunk ? "bg-yellow-50" : "",
            "prose h-full w-full overflow-auto markdown flex flex-col items-center px-6 py-2 rounded-md",
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
          className="prose h-full w-full overflow-auto markdown rounded-md"
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
