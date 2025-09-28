import QueryPanel from "@/components/query-panel";
import OutputPanel from "@/components/output-panel";
import StatusList from "@/components/status-list";

export default function Studio() {
  return (
    <section className="font-mono flex flex-col w-full h-full">
      <section className="absolute top-2/5 left-0">
        <StatusList />
      </section>

      <section className="h-14 w-3/5 mx-auto mt-8">
        <QueryPanel />
      </section>

      <section className="h-3/4 w-full mb-4">
        <OutputPanel />
      </section>
    </section>
  );
}
