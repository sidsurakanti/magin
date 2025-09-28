"use client";

import { useEffect, useState } from "react";
import { type AppStore, useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function QueryPanel() {
  const [query, setQuery] = useState<string>("");
  const [editQuery, setEditQuery] = useState<string>("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [editHistory, setEditHistory] = useState<string[]>([]);
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
    // localhost:8000/submit/{base_prompt}
    setQuery("");
    const response = await fetch("http://localhost:8000/submit/", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ base_prompt: query }),
    });
    const data = await response.json();
    setJobId(data.job_id);
    console.log("RESPONSE:", data);
  };

  const handleEdit = async () => {
    setEditHistory((h) => [...h, editQuery]);
    setEditQuery("");
    const response = await fetch("http://localhost:8000/edit/", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ job_id: jobId, base_prompt: editQuery }),
    });
    const data = await response.json();
    setReloadVersion((v) => v + 1);
    console.log("EDIT RESPONSE:", data);
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

      if (data.status === "error") {
        console.error("ERROR:", data.error);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE ERROR:", err);
      sse.close();
    };

    return () => sse.close();
  }, [jobId, reloadVersion]);

  return (
    <>
      <div className="flex items-center gap-5">
        <Input
          className="rounded-none text-lg"
          placeholder="What do you want to visualize today?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
        />
        <Button className="rounded-none cursor-pointer" onClick={handleSubmit}>
          Create
        </Button>
      </div>

      {(status === "done" || status === "editing") && (
        <div className="text-sm absolute z-100 flex flex-col bottom-[35%] right-5 w-80 h-12">
          <div className="flex flex-col justify-center items-end bg-gradient-to-br from-transparent via-white/40 to-white px-4 py-2 text-right">
            <span className="font-light text-neutral-600 MB-1">EDITS</span>
            <ul className="list-none flex flex-col items-end">
              {editHistory.map((edit, idx) => (
                <li key={idx} className="mb-0.5">
                  {edit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center">
            <Textarea
              className="bg-white resize-none rounded-none fixed-0 bottom-0 text-lg w-80 h-18 shadow-md"
              placeholder="Suggest changes!"
              value={editQuery}
              onChange={(e) => setEditQuery(e.target.value)}
            />
            <Button
              className="h-18 shadow-md rounded-none cursor-pointer"
              onClick={handleEdit}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
