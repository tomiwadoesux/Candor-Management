'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Your model data
export const models = [
  {
    id: "1",
    name: "Ayotomiwa Durojaye",
    stageName: "Zara",
    gender: "female",
    age: 22,
    height: "5'9\"",
    bio: "Jane is a professional model from New York.",
    coverImage: "/images/22.webp",
    face: "/images/22.webp",
    images: ["/images/23.webp", "/images/01.png"],
    polaroids: ["/images/22.webp", "/images/51.webp", "/images/06.webp", "/images/17.webp"],
    alt: "A Candor Model",
    talent: "Model",
  },
  // Add more models here if needed
]

const Runaway = () => {
  const cardRefs = useRef([])

  useEffect(() => {
    const cards = cardRefs.current

    cards.forEach((card, idx) => {
      if (!card) return

      const onMouseEnter = () => {
        // Bring hovered card forward & scale up
        gsap.to(card, {
          zIndex: 50,
          scale: 1.1,
          duration: 0.4,
          ease: 'power2.out',
        })

        // Animate siblings outward and fade
        cards.forEach((other, i) => {
          if (other && i !== idx) {
            const direction = i < idx ? -1 : 1
            gsap.to(other, {
              x: 30 * direction,
              scale: 0.95,
              opacity: 0.7,
              duration: 0.3,
              ease: 'power2.out',
            })
          }
        })
      }

      const onMouseLeave = () => {
        // Reset all cards
        cards.forEach(other => {
          if (other) {
            gsap.to(other, {
              x: 0,
              scale: 1,
              opacity: 1,
              zIndex: 1,
              duration: 0.4,
              ease: 'power2.out',
            })
          }
        })
      }

      card.addEventListener('mouseenter', onMouseEnter)
      card.addEventListener('mouseleave', onMouseLeave)

      // cleanup
      return () => {
        card.removeEventListener('mouseenter', onMouseEnter)
        card.removeEventListener('mouseleave', onMouseLeave)
      }
    })
  }, [])

  // Use the polaroids of the first model for the gallery
  const polaroids = models[0].polaroids

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      {/* Gallery Container */}
      <div className="relative flex items-center justify-center">
        {polaroids.map((src, idx) => (
          <div
            key={idx}
            ref={el => (cardRefs.current[idx] = el)}
            className="absolute w-56 h-72 bg-white rounded-lg overflow-hidden shadow-2xl cursor-pointer"
            style={{
              transform: `rotate(${(idx - (polaroids.length - 1) / 2) * 5}deg) translateX(${
                (idx - (polaroids.length - 1) / 2) * 20
              }px)`,
              zIndex: 1,
            }}
          >
            <img
              src={src}
              alt={models[0].alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="mt-16 text-center max-w-xl">
        <h2 className="text-3xl font-bold">{models[0].stageName}</h2>
        <p className="text-gray-600">{models[0].name}</p>
        <div className="flex justify-center gap-6 mt-2 text-sm text-gray-500">
          <span>Age: {models[0].age}</span>
          <span>Height: {models[0].height}</span>
          <span>Talent: {models[0].talent}</span>
        </div>
        <p className="mt-6 text-gray-700">{models[0].bio}</p>
      </div>
    </div>
  )
}

export default Runaway
