"use client";

import HeaderTest from "../../components/headerTest";
import Hero from "../../components/hero";
import { SearchProvider } from "../../components/SearchContext";

export default function Test() {
  return (
    <SearchProvider>
      <section>
        <HeaderTest />
        <Hero />
      </section>
    </SearchProvider>
  );
}
