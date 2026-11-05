import AboutTakes from "./takes/AboutTakes";
import Header from "../../components/header";
import "../../styles/morph-gallery.css";
import "../../styles/model-profile.css";
import "./agency-page.css";
import "./contact-sheet.css";
import "./takes/about-takes.css";

export const metadata = {
  title: "The agency — Candor",
  description: "A different point of view. Models, talents and creatives in Lagos, Manchester and Dallas.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AboutTakes />
    </>
  );
}
