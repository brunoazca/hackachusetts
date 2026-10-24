import MapView from "@/components/map/MapView";
import TopBar from "@/components/shell/TopBar";
import RightPanel from "@/components/shell/RightPanel";

// Full-bleed map; every panel floats on glass 12 px from the edge.
// Layout: docs/design/foundations/space-layout.md
export default function Home() {
  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <section aria-label="Map of rat-related reports" className="absolute inset-0">
        <MapView />
      </section>
      <TopBar />
      <RightPanel />
    </div>
  );
}
