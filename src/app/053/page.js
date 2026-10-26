import Gallery053 from "./Gallery053";
import { getImageProps } from "next/image";
import { models } from "../../../data/models";
import { agency, mailtoWith } from "../../../data/agency";

export const metadata = {
  title: "053 — Candor",
  description: "Models, talents and creatives. A collection by Candor.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0c" },
  ],
};

export default function Page053() {
  // Reuse sphere2's existing 53 looks. Resolve small, compressed URLs on the
  // server so the gallery needs neither an image loader nor extra client JS.
  const photos = Array.from({ length: 53 }, (_, index) => {
    const src = `/thumbs/sphere/${index + 1}.jpg`;
    const optimized = (width) => getImageProps({
      src, width, height: width, quality: 35, alt: "",
    }).props.src;
    return { thumbnail: optimized(128), preview: optimized(192) };
  });

  const roster = models
    .filter((person) => !person.placeholder && ["models", "talents", "creatives"].includes(person.division))
    .map((person) => ({
      id: person.id,
      name: person.name.trim().split(/\s+/)[0],
      category: { models: "Model", talents: "Talent", creatives: "Creative" }[person.division],
      intro: person.bio?.match(/[^.!?]+[.!?]/)?.[0] || person.bio || "",
      details: (person.division === "talents" ? [
        ["Based in", person.based],
        ["Focus", person.focus],
        ["With Candor", person.since],
      ] : []).filter(([, value]) => value),
      enquiryHref: mailtoWith(agency.contact.email, `Booking enquiry — ${person.name}`),
    }));

  return <Gallery053 roster={roster} photos={photos} />;
}
