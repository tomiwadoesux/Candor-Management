import Link from "next/link";

import "../styles/bracket-link.css";

/**
 * The site's bracket button, driven by HOVER instead of selection.
 *
 * The model page's board tabs open their brackets around the label when a tab
 * is CHOSEN (styles/tab-link.css). Here the same shape is wanted as a link, so
 * the open state is bound to :hover / :focus-visible on the anchor rather than
 * to a data-active flag — idle it reads "[ ] MODEL PORTFOLIO", and on hover the
 * closing bracket travels out to the right while the label slides back between
 * the pair: "[ MODEL PORTFOLIO ]".
 *
 * The mechanics (0fr → 1fr track, label parked past the bracket, invisible
 * sizer holding the width open) are the tab's, so both read as the same
 * control; only the trigger differs. See styles/tab-link.css for why the sizer
 * is needed — without it the row lays out as if the link were only "[ ]" wide.
 */
export default function BracketLink({ href = "#", className = "", children }) {
  return (
    <Link href={href} className={`bracket-link ${className}`}>
      <span className="bracket-link__sizer" aria-hidden="true">
        [&nbsp;]&nbsp;{children}
      </span>
      <span className="bracket-link__live">
        <span>[</span>
        <span className="bracket-link__well">
          <span className="bracket-link__label">{children}</span>
        </span>
        <span>]</span>
      </span>
    </Link>
  );
}
