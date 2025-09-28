import QueryPanel from "@/components/query-panel";
import OutputPanel from "@/components/output-panel";

export default function Studio() {
  return (
    <section className="font-mono flex flex-col w-full h-full">
      <section className="h-1/12 w-3/5 mx-auto mt-4">
        <QueryPanel />
      </section>

      <section className="h-3/4 w-full mb-4">
        <OutputPanel />
      </section>
    </section>
  );
}
