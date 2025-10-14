import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Health = {
  redis: string;
  anthropic: string;
  celery: string;
};

export default async function Home() {
  const health: Health = await fetch("http://api:8000/health/").then((res) =>
    res.json(),
  );

  // console.log("HEALTH STATUS:", health);

  return (
    <main className="font-mono flex items-center justify-center h-screen text-2xl">
      <div className="space-y-2">
        <h1 className="text-lg mb-2 text-neutral-600">System Status</h1>
        <span className="flex items-center gap-3">
          REDIS
          <p
            className={cn(
              health.redis == "HEALTHY"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-200",
              "lowercase rounded-md px-2 py-1 text-sm",
            )}
          >
            {health.redis}
          </p>
        </span>
        <span className="flex items-center gap-3">
          API
          <p
            className={cn(
              health.anthropic == "HEALTHY"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-200",
              "lowercase rounded-md px-2 py-1 text-sm",
            )}
          >
            {health.anthropic}
          </p>
        </span>
        <span className="flex items-center gap-3">
          WORKERS
          <p
            className={cn(
              health.celery == "HEALTHY"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-200",
              "lowercase rounded-md px-2 py-1 text-sm",
            )}
          >
            {health.celery}
          </p>
        </span>
      </div>
    </main>
  );
}
