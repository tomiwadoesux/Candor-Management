"use client"
import { useRef, useMemo, useCallback, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

const GRID_SPACING_X = 4.5
const GRID_SPACING_Y = 3.5
const IMAGES_PER_ROW = 3
const ROWS = 2

const createClothMaterial = () => {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        
        float ripple1 = sin(pos.x * 1.5 + time * 2.0) * 0.015;
        float ripple2 = sin(pos.y * 2.0 + time * 1.5) * 0.01;
        float clothEffect = (ripple1 + ripple2) * (1.0 + abs(scrollForce) * 0.5);
        
        // Gentle wave effect when hovered
        float hoverWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 2.0 + time * 4.0;
          float waveAmplitude = sin(wavePhase) * 0.05;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          hoverWave = waveAmplitude * dampening;
        }
        
        // Apply subtle Z displacement for cloth effect
        pos.z += clothEffect + hoverWave;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(map, vUv);
        
        // Simple blur for distance effect
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          
          for (float x = -1.0; x <= 1.0; x += 1.0) {
            for (float y = -1.0; y <= 1.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  })
}

function ImagePlane({ texture, position, scale, material, rotation, index }) {
  const meshRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (material && texture) {
      material.uniforms.map.value = texture
    }
  }, [material, texture])

  useEffect(() => {
    if (material && material.uniforms) {
      material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0
    }
  }, [material, isHovered])

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      rotation={rotation}
      material={material}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <planeGeometry args={[1, 1, 16, 16]} />
    </mesh>
  )
}

// Add text overlay component
function TextOverlay() {
  return (
    <group position={[0, 0, 5]}>
      <mesh position={[0, 1, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshBasicMaterial color="white" transparent opacity={0} />
      </mesh>
    </group>
  )
}

function GalleryScene({ images, speed = 1 }) {
  const [scrollVelocity, setScrollVelocity] = useState({ horizontal: 0, vertical: 0 })
  const [autoPlay, setAutoPlay] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const lastInteraction = useRef(Date.now())
  const groupRef = useRef()

  // Normalize images to objects
  const normalizedImages = useMemo(
    () => images.map((img) => (typeof img === "string" ? { src: img, alt: "" } : img)),
    [images],
  )

  // Load textures
  const textures = useTexture(normalizedImages.map((img) => img.src))

  // Create materials pool
  const materials = useMemo(
    () => Array.from({ length: normalizedImages.length }, () => createClothMaterial()), 
    [normalizedImages.length]
  )

  // Calculate grid positions
  const gridPositions = useMemo(() => {
    const positions = []
    const totalSets = Math.ceil(normalizedImages.length / (IMAGES_PER_ROW * ROWS))
    
    for (let setIndex = 0; setIndex < totalSets; setIndex++) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < IMAGES_PER_ROW; col++) {
          const imageIndex = setIndex * (IMAGES_PER_ROW * ROWS) + row * IMAGES_PER_ROW + col
          if (imageIndex >= normalizedImages.length) break
          
          const x = (col - IMAGES_PER_ROW / 2) * GRID_SPACING_X + setIndex * (IMAGES_PER_ROW * GRID_SPACING_X + 2)
          const y = (ROWS / 2 - row) * GRID_SPACING_Y - 0.5
          const z = 0
          
          positions.push({
            position: [x, y, z],
            rotation: [0, 0, 0],
            index: imageIndex,
            baseX: x,
            baseY: y,
          })
        }
      }
    }
    
    return positions
  }, [normalizedImages.length])

  const planesData = useRef(gridPositions.map(pos => ({
    ...pos,
    currentX: pos.position[0],
    currentY: pos.position[1],
  })))

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      const deltaX = event.deltaX * 0.005 * speed
      const deltaY = event.deltaY * 0.005 * speed

      setScrollVelocity((prev) => ({
        horizontal: prev.horizontal + deltaX,
        vertical: prev.vertical + deltaY,
      }))
      setAutoPlay(false)
      lastInteraction.current = Date.now()
    },
    [speed],
  )

  // Handle mouse/touch drag
  const handlePointerDown = useCallback((event) => {
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    setAutoPlay(false)
    lastInteraction.current = Date.now()
  }, [])

  const handlePointerMove = useCallback((event) => {
    if (!isDragging) return
    
    const deltaX = (event.clientX - dragStart.x) * 0.01 * speed
    const deltaY = (event.clientY - dragStart.y) * 0.01 * speed
    
    setScrollVelocity((prev) => ({
      horizontal: prev.horizontal - deltaX,
      vertical: prev.vertical + deltaY,
    }))
    
    setDragStart({ x: event.clientX, y: event.clientY })
  }, [isDragging, dragStart, speed])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback(
    (event) => {
      const force = 0.15 * speed
      switch (event.key) {
        case "ArrowLeft":
          setScrollVelocity((prev) => ({ ...prev, horizontal: prev.horizontal - force }))
          break
        case "ArrowRight":
          setScrollVelocity((prev) => ({ ...prev, horizontal: prev.horizontal + force }))
          break
        case "ArrowUp":
          setScrollVelocity((prev) => ({ ...prev, vertical: prev.vertical - force }))
          break
        case "ArrowDown":
          setScrollVelocity((prev) => ({ ...prev, vertical: prev.vertical + force }))
          break
      }
      setAutoPlay(false)
      lastInteraction.current = Date.now()
    },
    [speed],
  )

  useEffect(() => {
    const canvas = document.querySelector("canvas")
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false })
      canvas.addEventListener("pointerdown", handlePointerDown)
      canvas.addEventListener("pointermove", handlePointerMove)
      canvas.addEventListener("pointerup", handlePointerUp)
      canvas.addEventListener("pointerleave", handlePointerUp)
      document.addEventListener("keydown", handleKeyDown)

      return () => {
        canvas.removeEventListener("wheel", handleWheel)
        canvas.removeEventListener("pointerdown", handlePointerDown)
        canvas.removeEventListener("pointermove", handlePointerMove)
        canvas.removeEventListener("pointerup", handlePointerUp)
        canvas.removeEventListener("pointerleave", handlePointerUp)
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [handleWheel, handleKeyDown, handlePointerDown, handlePointerMove, handlePointerUp])

  // Auto-play logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 3000) {
        setAutoPlay(true)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useFrame((state, delta) => {
    // Apply auto-play
    if (autoPlay) {
      setScrollVelocity((prev) => ({
        horizontal: prev.horizontal + 0.015 * delta,
        vertical: 0,
      }))
    }

    // Damping
    setScrollVelocity((prev) => ({
      horizontal: prev.horizontal * 0.92,
      vertical: prev.vertical * 0.92,
    }))

    // Update time uniform for all materials
    const time = state.clock.getElapsedTime()
    materials.forEach((material) => {
      if (material && material.uniforms) {
        material.uniforms.time.value = time
        material.uniforms.scrollForce.value = Math.abs(scrollVelocity.horizontal) + Math.abs(scrollVelocity.vertical)
      }
    })

    // Update plane positions
    planesData.current.forEach((plane, i) => {
      plane.currentX -= scrollVelocity.horizontal * delta * 50
      plane.currentY += scrollVelocity.vertical * delta * 30

      // Wrap around horizontally for infinite scroll
      const totalWidth = Math.ceil(normalizedImages.length / (IMAGES_PER_ROW * ROWS)) * (IMAGES_PER_ROW * GRID_SPACING_X + 2)
      if (plane.currentX < -totalWidth / 2 - 10) {
        plane.currentX += totalWidth
      } else if (plane.currentX > totalWidth / 2 + 10) {
        plane.currentX -= totalWidth
      }

      // Limit vertical movement
      plane.currentY = Math.max(-3, Math.min(3, plane.currentY))

      // Calculate distance from center for effects
      const distance = Math.sqrt(plane.currentX * plane.currentX + plane.currentY * plane.currentY)
      const normalizedDistance = Math.min(distance / 20, 1)

      // Update material uniforms
      const material = materials[i]
      if (material && material.uniforms) {
        material.uniforms.opacity.value = Math.max(0.6, 1 - normalizedDistance * 0.3)
        material.uniforms.blurAmount.value = normalizedDistance * 0.5
      }
    })
  })

  if (normalizedImages.length === 0) return null

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {planesData.current.map((plane, i) => {
        const texture = textures[plane.index]
        const material = materials[plane.index]

        if (!texture || !material) return null

        // Calculate scale to maintain aspect ratio
        const aspect = texture.image ? texture.image.width / texture.image.height : 1
        const scale = aspect > 1 ? [3 * aspect, 3, 1] : [3, 3 / aspect, 1]

        return (
          <ImagePlane
            key={plane.index}
            texture={texture}
            position={[plane.currentX, plane.currentY, 0]}
            scale={scale}
            rotation={plane.rotation}
            material={material}
            index={plane.index}
          />
        )
      })}
      
      <TextOverlay />
    </group>
  )
}

export default function TrueKindGallery3D({
  images = [
    "https://images.unsplash.com/photo-1627384113858-ce93ff568d1f?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=1000&fit=crop",
    "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=800&h=1000&fit=crop",
  ],
  className = "h-screen w-full",
  style,
  speed = 1,
}) {
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) {
        setWebglSupported(false)
      }
    } catch (e) {
      setWebglSupported(false)
    }
  }, [])

  if (!webglSupported) {
    return (
      <div className={className} style={style}>
        <div className="flex flex-col items-center justify-center h-full bg-background p-4">
          <p className="text-muted-foreground mb-4">WebGL not supported. Showing image grid:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {images.map((img, i) => {
              const imgSrc = typeof img === "string" ? img : img.src
              const imgAlt = typeof img === "string" ? "" : img.alt
              return (
                <img
                  key={i}
                  src={imgSrc || "/placeholder.svg"}
                  alt={imgAlt}
                  className="w-full h-32 object-cover rounded"
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 py-6 pointer-events-none">
        <nav className="flex items-center justify-between mb-12 pointer-events-auto">
          <div className="text-2xl font-bold text-white drop-shadow-lg">trueKind.</div>
          <div className="flex gap-8 text-sm uppercase tracking-wider text-white drop-shadow-lg">
            <a href="#" className="hover:opacity-70 transition-opacity">Shop</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Philosophy</a>
            <a href="#" className="hover:opacity-70 transition-opacity font-semibold border-b-2 border-white pb-1">Gallery</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Journal</a>
          </div>
          <div className="flex gap-4">
            <button className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Title Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-white drop-shadow-2xl">Glow Up</h1>
          <p className="text-6xl font-light italic mt-2 text-white drop-shadow-2xl">Gallery</p>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className={className} style={{ ...style, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Canvas 
          camera={{ position: [0, 0, 10], fov: 75 }} 
          gl={{ antialias: true, alpha: false }}
          style={{ cursor: 'grab' }}
        >
          <GalleryScene images={images} speed={speed} />
        </Canvas>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-2 text-white/80 pointer-events-none z-10">
        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-xs uppercase tracking-widest">Drag or scroll to explore</span>
        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}