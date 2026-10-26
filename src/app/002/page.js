import { models } from "../../../data/models";
import { agency, contactMailto } from "../../../data/agency";
import Gallery002 from "./Gallery002";

export const metadata = {
  title: "002 — Candor",
  description: "Models, talents and creatives. An editorial selection by Candor Management.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#a00909",
};

export default function Page002() {
  const faces = models.filter((person) => !person.placeholder).map((person) => ({
    id: person.id,
    name: person.name,
    category: { models: "Model", talents: "Talent", creatives: "Creative" }[person.division],
    // Use the corresponding photograph from Candor's existing photo studies.
    image: person.coverImage.replace("/images/", "/photos/"),
    href: `/models/${person.id}`,
  }));

  return (
    <Gallery002
      faces={faces}
      agencyName={agency.name}
      contactHref={contactMailto}
      offices={agency.offices.map((office) => office.city)}
    />
  );
}
