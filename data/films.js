// data/films.js
//
// The films behind /video — a full-bleed player where one project fills the
// screen and the chrome floats over it.
//
// A film is a piece of motion work plus the frame the stage opens on. The
// player shows the poster on arrival and dissolves into the cut on the first
// play, so `poster` wants to be a frame from the film itself once there is
// real footage to pull one from.
//
// PLACEHOLDER MEDIA. `src` points at MDN's open sample clips so the transport
// has something real to scrub while the actual cuts are still in post. Drop
// the finished files into public/video/ and swap the strings; nothing else has
// to change. The posters are real board images, so the page reads correctly
// either way.
//
// Not the gtv-videos-bucket URLs that Showcase.js and Showcase2.js still point
// at — Google started returning 403 for that bucket, so those are dead.
const SAMPLE = "https://mdn.github.io/shared-assets/videos";

export const films = [
  {
    id: "maison-ori-nkem",
    client: "Maison Orí",
    collaborator: "Nkem",
    director: "Marguerite Oduya",
    // The third line of the title block, under the director.
    disciplines: "Video, Stills",
    year: "2026",
    src: `${SAMPLE}/flower.mp4`,
    poster: "/images/img7.jpeg",
    credits: [
      { role: "Direction", name: "Marguerite Oduya" },
      { role: "Photography", name: "Estévez & Belloso" },
      { role: "Cast", name: "Ayotomiwa Durojaye, Chioma Nwosu" },
      { role: "Styling", name: "Anouk Sarr" },
      { role: "Production", name: "Candor Management" },
      { role: "Sound", name: "Ijebu Atelier" },
    ],
  },
  {
    id: "adeola-studio-fw26",
    client: "Adéọlá Studio",
    collaborator: "Fall / Winter 26",
    director: "Tobi Ajayi",
    disciplines: "Video, Runway",
    year: "2026",
    src: `${SAMPLE}/tears-of-steel-battle-clip-medium.mp4`,
    poster: "/images/img14.jpeg",
    credits: [
      { role: "Direction", name: "Tobi Ajayi" },
      { role: "Photography", name: "Ines Ferreira" },
      { role: "Cast", name: "Marcus Adeyemi, Zainab Hassan, Emeka Eze" },
      { role: "Styling", name: "Kelechi Nwosu" },
      { role: "Production", name: "Candor Management" },
      { role: "Score", name: "Casa Verano" },
    ],
  },
  {
    id: "atelier-lagos-nocturne",
    client: "Atelier Lagos",
    collaborator: "Nocturne",
    director: "Ines Ferreira",
    disciplines: "Video, Campaign",
    year: "2025",
    src: `${SAMPLE}/sintel-short.mp4`,
    poster: "/images/img22.jpeg",
    credits: [
      { role: "Direction", name: "Ines Ferreira" },
      { role: "Photography", name: "Marguerite Oduya" },
      { role: "Cast", name: "Amara Obi, Kolade Adedeji" },
      { role: "Styling", name: "Estévez & Belloso" },
      { role: "Production", name: "Candor Management" },
      { role: "Colour", name: "Anouk Sarr" },
    ],
  },
  {
    id: "casa-verano-resort",
    client: "Casa Verano",
    collaborator: "Resort",
    director: "Kelechi Nwosu",
    disciplines: "Video, Stills",
    year: "2025",
    src: `${SAMPLE}/friday.mp4`,
    poster: "/images/img30.jpeg",
    credits: [
      { role: "Direction", name: "Kelechi Nwosu" },
      { role: "Photography", name: "Tobi Ajayi" },
      { role: "Cast", name: "Isabella Adesina, Seun Oladele, Ngozi Eze" },
      { role: "Styling", name: "Ines Ferreira" },
      { role: "Production", name: "Candor Management" },
      { role: "Sound", name: "Maison Orí" },
    ],
  },
];
