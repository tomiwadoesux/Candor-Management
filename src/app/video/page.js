import "../../styles/film-player.css";
import FilmPlayer from "../../components/FilmPlayer";
import { films } from "../../../data/films";

export const metadata = {
  title: "Video",
  description:
    "Candor's motion work, one project to a screen. The film and the stills off the same shoot are one reel; the chrome floats over the frame and inverts itself to stay readable on any cut.",
};

export default function VideoPage() {
  return <FilmPlayer films={films} exitHref="/" />;
}
