import Link from "next/link";

/**
 * The site's one link style: "↳ label", set in the display serif, lowercase.
 * Used for every text link and call to action — the footer, the landing
 * page's chrome, the rail, the CTAs — so the look only lives here.
 *
 * The ↳ is drawn rather than typed: Arno is subset to Latin and has no arrows,
 * so the character would fall back to whatever system face has one and look
 * different on every machine. Drawn in currentColor it follows the text on
 * light and dark sections alike, held back to 40% so the label leads.
 *
 * `vertical` is for links set in a vertical writing mode (the small-screen
 * rails on the landing page). The text turns with the writing mode but an
 * inline SVG stays upright, so the arrow is turned by hand to match.
 *
 * The type runs at 0.95em of wherever the link sits, so every link on the
 * site steps down together without touching each column's own size.
 *
 * `left` is accepted and ignored: it chose which side the old hover arrow
 * appeared on. The arrow now always leads, and the parent column aligns rows.
 */
export function HookArrow({ className = "" }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`h-[0.8em] w-[0.8em] shrink-0 opacity-40 ${className}`}
    >
      <path
        d="M2 1.5V8.5H10M7.5 6L10 8.5L7.5 11"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}

// A plain → for the pill variant, drawn for the same reason as the hook.
export function StraightArrow({ className = "" }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`h-[0.8em] w-[0.8em] shrink-0 ${className}`}
    >
      <path
        d="M1.5 6H10M6.5 2.5L10 6L6.5 9.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * `pill` is the footer's button: the label in the body sans, as written,
 * on a 7% black block with the arrow trailing. Hover darkens the block and
 * nudges the arrow on, so the press reads without the whole thing fading.
 */
export default function ChromeLink({
  href = "#",
  left, // eslint-disable-line no-unused-vars
  vertical = false,
  pill = false,
  className = "",
  children,
  ...rest
}) {
  if (pill) {
    return (
      <Link
        href={href}
        className={`group pointer-events-auto inline-flex items-center gap-[0.4em] whitespace-nowrap rounded-[1px] bg-black/[0.07] px-[0.6em] py-[0.3em] leading-none transition-colors duration-200 hover:bg-black/[0.12] ${className}`}
        {...rest}
      >
        <span>{children}</span>
        <StraightArrow className="transition-transform duration-200 ease-out group-hover:translate-x-[0.15em]" />
      </Link>
    );
  }

  // At rest the link is only its label: the arrow's slot is zero wide and the
  // arrow inside it scaled to nothing. On hover the slot opens, pushing the
  // label over, while the arrow grows out of its left edge and travels right
  // into place. inline-size rather than width so the slot opens along the line
  // in the vertical rails too, where "width" would be across it.
  return (
    <Link
      href={href}
      className={`font-display group pointer-events-auto inline-flex whitespace-nowrap lowercase tracking-[0.02em] ${className}`}
      {...rest}
    >
      <span className="inline-flex items-baseline text-[0.95em]">
        <span
          aria-hidden="true"
          className="inline-flex overflow-hidden [inline-size:0] transition-[inline-size] duration-300 ease-out group-hover:[inline-size:0.95em] group-focus-visible:[inline-size:0.95em]"
        >
          <HookArrow
            className={`origin-left scale-0 transition-[scale,translate] duration-300 ease-out group-hover:scale-100 group-focus-visible:scale-100 ${
              vertical
                ? "rotate-90"
                : "-translate-x-[0.4em] group-hover:translate-x-0 group-focus-visible:translate-x-0"
            }`}
          />
        </span>
        <span>{children}</span>
      </span>
    </Link>
  );
}
