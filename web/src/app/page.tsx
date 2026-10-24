import MapView from "@/components/map/MapView";
import TopBar from "@/components/shell/TopBar";
import SidePanel from "@/components/shell/SidePanel";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <main className="flex min-h-0 flex-1">
        <section aria-label="Map of rat-related reports" className="relative min-w-0 flex-1">
          <MapView />
        </section>
        <aside aria-label="Details, insights and assistant" className="flex w-[420px] shrink-0 flex-col border-l border-neutral-200 bg-white">
          <SidePanel />
        </aside>
      </main>
    </div>
  );
}
