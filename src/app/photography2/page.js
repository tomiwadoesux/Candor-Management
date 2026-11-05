import photos from "./photos.json";
import { imageSize } from "../../lib/imageSize";
import Photography2Page from "./Photography2Page";
import "../references/references.css";
import "../../styles/morph-gallery.css";
import "./photography2.css";

export const metadata = {
  title: "Photography 2 — Candor",
  description: "A floating image collection, moving through space as you scroll.",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const [painting, ...cards] = await Promise.all(photos.map(async (photo) => ({
    ...photo,
    ...await imageSize(photo.src),
  })));
  return <Photography2Page cards={cards} painting={painting} />;
}
