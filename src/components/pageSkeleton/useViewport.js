"use client";

import { useSyncExternalStore } from "react";

const subscribe = (notify) => {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
};
const snapshot = () => `${document.documentElement.clientWidth},${window.innerHeight}`;
const serverSnapshot = () => "";

export default function useViewport() {
  const size = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return size ? size.split(",").map(Number) : null;
}
