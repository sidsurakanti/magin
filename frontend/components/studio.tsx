import QueryPanel from "@/components/query-panel";
import OutputPanel from "@/components/output-panel";

export default function Studio() {
  return (
    <section className="font-mono flex flex-col w-full h-full">
      <section className="debug h-1/12 w-4/10 mx-auto mt-4">
        <QueryPanel />
      </section>

      <section className="debug flex-1 w-full mb-4 overflow-auto">
        <OutputPanel />
      </section>
    </section>
  );
}
