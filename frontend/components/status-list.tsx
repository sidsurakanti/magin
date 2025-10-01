"use client";

import { type AppStore, useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const statuses = [
  "idle",
  "storyboarding",
  "code-generating",
  "rendering",
  "editing",
  "done",
  "error",
];

export default function StatusList() {
  const { status: activeStatus, iteration } = useAppStore<AppStore>(
    (state) => state as AppStore,
  );
  // const activeStatus = "code-generating";

  return (
    <div className="flex flex-col items-start space-y-1 ml-6">
      {statuses.map((status) => (
        <span
          key={status}
          className={cn(
            status === activeStatus
              ? "text-black font-medium text-3xl mt-0.5 mb-1"
              : "text-neutral-600 text-base",
            "uppercase hover:scale-110 cursor-pointer transition-all",
          )}
        >
          {status}
          {activeStatus === "rendering" && status === "rendering" && (
            <div className="inline-block bg-black animate-spin ml-2 w-3 h-3" />
          )}
        </span>
      ))}
      <hr className="w-12 border-t border-neutral-300 my-2" />
      <span className="font-light text-xs">STATUS</span>
      <span className="font-light text-xs">ITERATION #{iteration}</span>
    </div>
  );
}
