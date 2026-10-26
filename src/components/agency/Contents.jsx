"use client";

import { useEffect, useState } from "react";

// The privacy policy's table of contents. On a wide screen it sits in the
// left margin and follows you down, marking the section you are reading; on
// a phone it is a closed list at the top of the document.
//
// "The section you are reading" is the last heading to have passed a line a
// fifth of the way down the screen — the point where the eye actually is,
// rather than the top edge, so a section counts as current as soon as its
// heading is comfortably in view.
export default function Contents({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!headings.length) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.2;
      let current = headings[0].id;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) current = h.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  const list = (
    <ol className="flex flex-col gap-1.5 text-[13px] leading-[1.35]">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            aria-current={active === s.id ? "location" : undefined}
            className="grid grid-cols-[28px_1fr] transition-colors duration-300"
            style={{ color: active === s.id ? "var(--ag-ink)" : "var(--ag-faint)" }}
          >
            <span className="ag-num">{String(i + 1).padStart(2, "0")}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav aria-label="Contents" className="sticky top-8 hidden lg:block">
        <p className="ag-label pb-4">Contents</p>
        {list}
      </nav>

      <details className="border-y border-[var(--ag-rule)] py-4 lg:hidden">
        <summary className="ag-label cursor-pointer">Contents</summary>
        <div className="pt-4">{list}</div>
      </details>
    </>
  );
}
