"use client";

import { TabsContent } from "@/components/ui/tabs";
import { type AppStore, useAppStore } from "@/lib/store";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function VideoPanel() {
  const { jobId, videoUrl } = useAppStore<AppStore>(
    (state) => state as AppStore,
  );

  return (
    <>
      <TabsContent value="video" className="w-full h-full flex justify-center">
        <video
          key={jobId}
          src={videoUrl as string}
          controls
          autoPlay
          loop
          className="mt-2 aspect-video max-w-[1280px] w-fit rounded-none"
        />
      </TabsContent>
    </>
  );
}
