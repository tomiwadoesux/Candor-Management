import CreativeSphere from "@/components/CreativeSphere";

export const metadata = { title: "Sphere" };

const items = [
  ...Array.from({ length: 35 }, (_, i) => ({
    src: `/images/img${i + 1}.jpeg`,
    label: `Look ${String(i + 1).padStart(2, "0")}`,
    meta: "CANDOR",
  })),
  ...Array.from({ length: 18 }, (_, i) => ({
    src: `/carousel/${i + 1}.webp`,
    label: `Look ${String(i + 36).padStart(2, "0")}`,
    meta: "CANDOR",
  })),
];

export default function SpherePage() {
  return (
    <main className="relative h-[100svh] bg-white text-black">
      <CreativeSphere items={items} title="Creative Space" />
    </main>
  );
}
