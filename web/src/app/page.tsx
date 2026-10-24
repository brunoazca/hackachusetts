import MapView from "@/components/map/MapView";
import TopBar from "@/components/shell/TopBar";
import RightPanel from "@/components/shell/RightPanel";

// Full-bleed map; every panel floats on glass 12 px from the edge.
// Layout: docs/design/foundations/space-layout.md
export default function Home() {
  return (
    <div className="piper-shell relative h-dvh overflow-hidden bg-bg text-fg [--shell-top:116px] sm:[--shell-top:68px]">
      {/* Skip link: first focusable element, jumps keyboard users past the chrome to the map (2.4.1). */}
      <a
        href="#map"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-3 focus-visible:top-3 focus-visible:z-[60] focus-visible:rounded-md focus-visible:bg-accent focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Skip to the map
      </a>
      <TopBar />
      <main id="map" tabIndex={-1} aria-label="Map of rat-related reports" className="absolute inset-0 outline-none">
        <MapView />
      </main>
      <RightPanel />
    </div>
  );
}
