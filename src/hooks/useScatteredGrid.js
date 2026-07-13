"use client";

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

export const useScatteredGrid = (config = {}) => {
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const draggableInstance = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const defaultConfig = {
    gridSize: 4000,
    imageSize: { width: 200, height: 200 },
    dragBounds: 1000,
    inertia: true,
    edgeResistance: 0.7,
    dragResistance: 0.2,
    parallaxIntensity: 0.1,
    ...config
  };

  const initializeGrid = () => {
    if (!gridRef.current) return;

    const grid = gridRef.current;
    const images = Array.from(grid.children);

    // Create scattered layout
    images.forEach((img) => {
      gsap.set(img, {
        x: gsap.utils.random(-defaultConfig.gridSize/2, defaultConfig.gridSize/2),
        y: gsap.utils.random(-defaultConfig.gridSize/2, defaultConfig.gridSize/2),
        scale: gsap.utils.random(0.7, 1.3),
        rotation: gsap.utils.random(-20, 20),
        zIndex: gsap.utils.random(1, 100),
      });
    });

    // Create draggable with enhanced features
    draggableInstance.current = Draggable.create(grid, {
      type: 'x,y',
      bounds: {
        minX: -defaultConfig.dragBounds,
        maxX: defaultConfig.dragBounds,
        minY: -defaultConfig.dragBounds,
        maxY: defaultConfig.dragBounds
      },
      inertia: defaultConfig.inertia,
      edgeResistance: defaultConfig.edgeResistance,
      dragResistance: defaultConfig.dragResistance,

      onDrag: function() {
        if (defaultConfig.parallaxIntensity > 0) {
          gsap.to(images, {
            x: `+=${this.deltaX * defaultConfig.parallaxIntensity}`,
            y: `+=${this.deltaY * defaultConfig.parallaxIntensity}`,
            duration: 0.2,
            ease: 'power2.out',
            stagger: {
              amount: 0.1,
              from: 'random'
            }
          });
        }
      },

      onDragStart: function() {
        if (containerRef.current) {
          gsap.to(containerRef.current, { scale: 0.95, duration: 0.3 });
        }
      },

      onDragEnd: function() {
        if (containerRef.current) {
          gsap.to(containerRef.current, { scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
        }
      }
    })[0];

    setIsReady(true);
  };

  useEffect(() => {
    if (gridRef.current) {
      initializeGrid();

      return () => {
        if (draggableInstance.current) {
          draggableInstance.current.kill();
        }
      };
    }
  }, []);

  const resetView = () => {
    if (gridRef.current) {
      gsap.to(gridRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  };

  return {
    containerRef,
    gridRef,
    isReady,
    draggableInstance: draggableInstance.current,
    resetView
  };
};
