import QueryPanel from "@/components/query-panel";
import OutputPanel from "@/components/output-panel";
import StatusList from "@/components/status-list";

export default function Studio() {
  return (
    <section className="font-mono flex flex-col w-full h-full">
      <section className="absolute top-[35%] left-0">
        <StatusList />
      </section>

      <section className="h-14 w-3/5 mx-auto mt-8">
        <QueryPanel />
      </section>

      <section className="h-3/4 w-full mb-4">
        <OutputPanel />
      </section>

      <footer className="w-full flex-1 flex flex-col justify-end items-end text-right py-6 px-6 text-sm mb-2">
        <span className="font-medium">/magin.it/</span>
        <span>
          <a
            href="https://github.com/sidsurakanti"
            target="_blank"
            className="hover:underline underline-offset-8"
          >
            @sidsurakanti
          </a>
          , 2025.
        </span>
      </footer>
    </section>
  );
}
