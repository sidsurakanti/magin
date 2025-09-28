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
  const { status: activeStatus } = useAppStore<AppStore>(
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
              ? "text-black font-medium text-3xl"
              : "text-neutral-600 text-base",
            "uppercase",
          )}
        >
          {status}
        </span>
      ))}
      <hr className="w-12 border-t border-neutral-300 mt-2" />
      <span className="font-light text-xs">STATUS</span>
    </div>
  );
}
