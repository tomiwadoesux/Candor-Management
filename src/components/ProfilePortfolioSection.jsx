import ProfileGallery from "@/components/ProfileGallery";

// The data layer has already removed empty sections and invalid media. Each
// medium gets its own presentation instead of treating a reel as a still.
export default function ProfilePortfolioSection({ section, name, onSelect }) {
  if (section.kind === "gallery") {
    return <ProfileGallery items={section.items} onSelect={onSelect} />;
  }

  return (
    <div className={`profile-section-content profile-section-content--${section.kind}`}>
      <h2 className="profile-section-title">{section.label}</h2>

      {section.kind === "about" && (
        <div className="profile-about">
          {section.text && <div className="profile-about__copy">{section.text.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
          {section.details?.length > 0 && <dl className="profile-about__details">
            {section.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>}
        </div>
      )}

      {section.kind === "videos" && (
        <div className="profile-films">
          {section.items.map((item) => (
            <figure key={item.id} className="profile-film">
              {item.embedUrl ? (
                <iframe className="profile-film__player" src={item.embedUrl} title={`${name} — ${item.title}`}
                  loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
              ) : item.src ? (
                <video className="profile-film__player" src={item.src} poster={item.poster || undefined}
                  controls playsInline preload="metadata" aria-label={`${name} — ${item.title}`}>
                  {item.captions && <track kind="captions" src={item.captions} srcLang="en" label="English" default />}
                </video>
              ) : (
                <a className="profile-content-link" href={item.href} target="_blank" rel="noopener noreferrer">Watch {item.title} ↗</a>
              )}
              <figcaption>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {section.kind === "credits" && (
        <ul className="profile-credits">
          {section.items.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <div><h3>{item.title}</h3>{(item.role || item.client) && <p>{[item.role, item.client].filter(Boolean).join(" · ")}</p>}</div>
              {item.year && <span>{item.year}</span>}
            </li>
          ))}
        </ul>
      )}

      {section.kind === "document" && (
        <a className="profile-content-link" href={section.href} download={section.href.startsWith("/") || undefined}
          target="_blank" rel="noopener noreferrer">
          {section.href.startsWith("/") ? "Download" : "Open"} {name}’s {section.label} ↗
        </a>
      )}
    </div>
  );
}
