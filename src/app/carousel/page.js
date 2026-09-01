import "../../styles/carousel.css";
import Stage from "../../components/carousel/Stage";

export const metadata = {
  title: "Carousel",
  description:
    "A portfolio carousel rendered as a single WebGL shader. Cards ride a ring and stretch into threads as they pull apart.",
};

export default function CarouselPage() {
  return <Stage />;
}
