"use client"
import Image from "next/image";

export default function HoverImage({ src, alt, cursorText, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      height={800}
      width={800}
      {...props}
    />
  );
}
