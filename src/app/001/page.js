import { models } from "../../../data/models";
import { agency, contactMailto } from "../../../data/agency";
import Gallery001 from "./Gallery001";

export const metadata = {
  title: "Selected faces — Candor",
  description: "A selection of faces from Candor Management.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

const ratios = [1.25, 0.8, 1, 2 / 3, 1.5, 0.75];

export default function Page001() {
  const faces = models
    .filter((model) => !model.placeholder)
    .slice(0, 16)
    .map((model, index) => ({
      id: model.id,
      name: model.name,
      image: model.coverImage,
      href: `/models/${model.id}`,
      ratio: ratios[index % ratios.length],
    }));

  return (
    <Gallery001
      faces={faces}
      agencyName={agency.name}
      contactHref={contactMailto}
    />
  );
}
