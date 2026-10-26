"use client";

import Image from "next/image";

export default function ProfilePhotoGrid({ photos, name, large = false, onSelect }) {
  const items = [...new Set(photos.filter(Boolean))].slice(0, large ? 5 : 4);
  if (!items.length) return null;

  return (
    <div className={`profile-mosaic${large ? " profile-mosaic--large" : ""}`} role="group"
      data-count={items.length}
      aria-label={`${name} ${large ? "photo grid" : "selected portraits"}`} data-hero-hide={large ? undefined : true}>
      {items.map((src, index) => {
        const alt = `${name} ${large ? "gallery" : "selected"} portrait ${index + 1}`;
        return (
          <button key={src} type="button" className="profile-mosaic__photo"
            style={{ gridArea: `photo-${index + 1}` }}
            onClick={() => onSelect(src)} aria-label={`Open ${alt}`}>
            <Image src={src} alt={alt} fill priority={large && index === 0}
              sizes={large
                ? `(min-width: 1024px) ${index === 0 ? 32 : 15}vw, 50vw`
                : "(min-width: 1024px) 10vw, 26vw"}
              className="profile-mosaic__image object-cover" />
          </button>
        );
      })}
    </div>
  );
}
