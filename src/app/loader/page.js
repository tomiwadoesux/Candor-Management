'use client';

import Search from "@/components/Search";
import dynamic from "next/dynamic";



const HoverImage = dynamic(() => import("../../components/HoverImage"), { ssr: false });

export default function Home() {
  return (
<Search/>
  );
}
