"use client";

import { useEffect, useState } from "react";
import { type AppStore, useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function QueryPanel() {
  const [query, setQuery] = useState<string>("");
  const {
    status,
    jobId,
    setStoryboardChunk,
    setCodegenChunk,
    setVideoUrl,
    setStatus,
    setJobId,
  } = useAppStore<AppStore>((state) => state as AppStore);

  const handleSubmit = async () => {
    console.log("QUERY SUBMITTED:", query);
    // localhost:8000/submit/{base_prompt}
    const response = await fetch("http://localhost:8000/submit/", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ base_prompt: query }),
    });
    const data = await response.json();
    setJobId(data.job_id);
    console.log("RESPONSE:", data);
  };

  useEffect(() => {
    if (!jobId) return;

    const sse = new EventSource(`http://localhost:8000/events/${jobId}`);

    sse.onmessage = (e) => {
      const data = JSON.parse(e.data);

      console.log("SSE MESSAGE: ", data);
      setStatus(data.status);
      setStoryboardChunk(data.stream.storyboard);
      setCodegenChunk(data.stream.codegen);

      if (data.status === "done") {
        sse.close();
        setVideoUrl(`http://localhost:8000/retrieve/${jobId}`);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE ERROR:", err);
      sse.close();
    };

    return () => sse.close();
  }, [jobId]);

  return (
    <>
      <div className="p-2 text-sm flex items-center justify-between">
        <span>{status}</span>
        <span>{jobId}</span>
      </div>
      <div className="flex items-center gap-5">
        <Input
          className="rounded-none text-lg"
          placeholder="What do you want to visualize today?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button className="rounded-none" onClick={handleSubmit}>
          Create
        </Button>
      </div>
    </>
  );
}
