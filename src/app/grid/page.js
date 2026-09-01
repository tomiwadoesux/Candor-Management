import "../../styles/morph-gallery.css";
import CaseGrid from "../../components/CaseGrid";
import { models } from "../../../data/models";
import { imageSize } from "../../lib/imageSize";

// Scratch page for the staggered case grid: tiles scale up out of a corner as
// they scroll in, slide under the sticky bar on the way out, and open a modal
// on select.
export const metadata = {
  title: "Grid",
  description:
    "Selected work as a staggered grid. Every tile keeps its photo's true proportions; each one scales up out of a corner, scrubbed by scroll rather than fired once.",
};

// Tiles are never cropped, so the grid needs each photo's real proportions.
// Reading them here (on the server, at build time) keeps the client component
// free of layout-shift guesswork.
export default async function GridPage() {
  const items = await Promise.all(
    models.map(async (model) => {
      const src = model.coverImage || model.images[0];
      const size = await imageSize(src);
      return {
        id: model.id,
        name: model.name,
        talent: model.talent,
        board: model.board,
        nationality: model.nationality,
        height: model.height,
        chest: model.chest,
        waist: model.waist,
        shoe: model.shoe,
        bio: model.bio,
        alt: model.alt || model.name,
        src,
        // 3:4 is the house portrait ratio — a sane fallback if a header ever
        // fails to parse, so a tile can't collapse to zero height. Named pxW /
        // pxH because `height` on a model is already the stature string.
        pxW: size?.width || 3,
        pxH: size?.height || 4,
      };
    })
  );

  return <CaseGrid items={items} />;
}
