"use client";

import SkeletonSvg from "./SkeletonSvg";
import useViewport from "./useViewport";
import { BUCKETS, pickBucket } from "./layoutMap";
import "../../styles/page-skeleton.css";

// Next's streamed loading boundary and the navigation cover use the same map.
// CSS chooses the breakpoint even before hydration, so a phone never paints
// the desktop fallback while it waits for JavaScript.
export default function RecordedSkeleton({ map }) {
  const viewport = useViewport();
  return (
    <div className="route-skeleton" data-page-loading="" role="status" aria-label="Loading page" aria-busy="true">
      <span className="sr-only">Loading page</span>
      {BUCKETS.map(({ name, max }) => {
        const width = viewport && (name === "sm" ? viewport[0] < 768 : name === "md" ? viewport[0] >= 768 && viewport[0] < 1024 : viewport[0] >= 1024)
          ? viewport[0] : Number.isFinite(max) ? max : 1440;
        const layout = pickBucket(map, width, viewport?.[1]);
        return layout && (
          <div key={name} className={`ps-breakpoint ps-breakpoint--${name}`} style={{ backgroundColor: layout.bg }}>
            <SkeletonSvg layout={layout} viewport={viewport} scan={false} />
          </div>
        );
      })}
    </div>
  );
}
