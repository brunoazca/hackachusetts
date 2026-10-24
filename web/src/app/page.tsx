import MapView from "@/components/map/MapView";
import TopBar from "@/components/shell/TopBar";
import SidePanel from "@/components/shell/SidePanel";

// Full-bleed map; every panel floats on glass 12 px from the edge.
// Layout: docs/design/foundations/space-layout.md
export default function Home() {
  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <section aria-label="Map of rat-related reports" className="absolute inset-0">
        <MapView />
      </section>
      <TopBar />
      <aside
        aria-label="Details, insights and assistant"
        className="glass absolute bottom-3 right-3 top-[68px] z-30 flex w-[400px] flex-col overflow-hidden rounded-lg 2xl:w-[440px]"
      >
        <SidePanel />
      </aside>
    </div>
  );
}
