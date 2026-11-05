import { readFileSync } from "node:fs";
import path from "node:path";
import RecordedSkeleton from "./RecordedSkeleton";
import { routeFile } from "./layoutMap";

// Read on the server instead of importing JSON into the module graph. The
// dev recorder updates these files while browsing; treating every recording
// as a code edit would refresh the page being measured.
export default function RouteLoading({ route }) {
  let map;
  try {
    map = JSON.parse(readFileSync(path.join(process.cwd(), "public", "skeletons", routeFile(route)), "utf8"));
  } catch {
    return null;
  }
  return <RecordedSkeleton map={map} />;
}
