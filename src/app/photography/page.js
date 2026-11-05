import PhotographyPage from "./PhotographyPage";
import referenceData from "../references/reference-data.json";
import { choosePreviewIndices } from "./preview-selection";
import "../references/references.css";
import "./photography.css";

// Choose previews once per page request, so server and client share the same
// selection and opening, closing or resizing never reshuffles the strip.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photography — Candor",
  description: "A photographic index. Open a folder to explore the images.",
  robots: { index: false, follow: false },
};

export default function Page() {
  const previews = referenceData.alicia.map((project) => choosePreviewIndices(project.images.length));
  return <PhotographyPage previews={previews} />;
}
