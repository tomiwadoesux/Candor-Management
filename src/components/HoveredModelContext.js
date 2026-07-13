"use client" 
import { createContext, useContext, useState } from "react";

const HoveredModelContext = createContext();

export function HoveredModelProvider({ children }) {
  const [hoveredModel, setHoveredModel] = useState(null);
  return (
    <HoveredModelContext.Provider value={{ hoveredModel, setHoveredModel }}>
      {children}
    </HoveredModelContext.Provider>
  );
}

export function useHoveredModel() {
  return useContext(HoveredModelContext);
}
