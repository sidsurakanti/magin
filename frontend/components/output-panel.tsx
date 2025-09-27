"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { type AppStore, useAppStore } from "@/lib/store";
import { SourcePanel } from "@/components/source-panel";
import { VideoPanel } from "@/components/video-panel";

export default function OutputPanel() {
  const [tab, setTab] = useState("source");
  const { status } = useAppStore<AppStore>((state) => state as AppStore);

  useEffect(() => {
    if (status === "done") setTab("video");
  }, [status]);

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="h-full px-12 pb-0 pt-4 flex items-center"
      >
        <div className="h-1/15 w-full flex items-center justify-center ">
          <TabsList>
            <TabsTrigger value="source" className="cursor-pointer">
              source
            </TabsTrigger>

            <TabsTrigger
              value="video"
              className={"cursor-pointer disabled:cursor-not-allowed"}
              disabled={status !== "done"}
            >
              video
            </TabsTrigger>
          </TabsList>
        </div>

        {tab === "source" && <SourcePanel />}
        {tab === "video" && <VideoPanel />}
      </Tabs>
    </>
  );
}
