import InfiniteGallery from "../../components/InfiniteGallery"
import InfiniteGallery2 from "../../components/infiniteGallery2"

export default function Home() {
  const sampleImages = [
    { src: "/images/06.webp", alt: "Image 1" },
    { src: "/images/17.webp", alt: "Image 2" },
    { src: "/images/22.webp", alt: "Image 3" },
    { src: "/images/23.webp", alt: "Image 4" },
    { src: "/images/51.webp", alt: "Image 5" },
    { src: "/images/64.webp", alt: "Image 6" },
  ]

  return (
    <main className="min-h-screen ">
      <InfiniteGallery
        images={sampleImages}
        speed={1.2}
        zSpacing={3}
        visibleCount={12}
        falloff={{ near: 0.8, far: 14 }}
        className="h-screen w-full rounded-lg overflow-hidden"
      />
      <div className="h-screen inset-0 pointer-events-none fixed flex items-center justify-center text-center px-3 mix-blend-exclusion text-white">
        <h1 className="font-serif text-4xl md:text-7xl tracking-tight">
          <span className="italic">I create;</span> therefore I am
        </h1>
      </div>

      <div className="text-center fixed bottom-10 left-0 right-0 font-mono uppercase text-[11px] font-semibold">
        <p>Use mouse wheel, arrow keys, or touch to navigate</p>
        <p className=" opacity-60">Auto-play resumes after 3 seconds of inactivity</p>
      </div>
    </main>

    //  <main className="min-h-screen bg-background">
    //   <InfiniteGallery2 images={sampleImages} speed={1.2} visibleCount={24} className="h-screen w-full" />

    //   <div className="fixed inset-0 pointer-events-none flex items-center justify-center text-center px-4">
    //     <div className="text-foreground/90 mix-blend-difference">
    //       <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight text-balance">
    //         <span className="italic">Creation Without</span>
    //         <br />
    //         <span className="font-normal">Limitation</span>
    //       </h1>
    //       <p className="mt-6 text-sm md:text-base font-mono uppercase tracking-wider opacity-70">Scroll to Explore</p>
    //     </div>
    //   </div>

    //   <div className="fixed bottom-6 left-0 right-0 text-center font-mono text-xs uppercase tracking-wide text-muted-foreground">
    //     <p>Use mouse wheel or arrow keys to navigate in all directions</p>
    //     <p className="opacity-60 mt-1">Auto-play resumes after 3 seconds of inactivity</p>
    //   </div>
    // </main>
  )
}
