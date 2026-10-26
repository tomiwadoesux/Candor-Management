import { Fragment } from "react";
import Link from "next/link";

// The smallest markup that legal copy needs, so the policy can live as plain
// strings in a data file (data/privacy.js) and still carry links and the odd
// bold term:
//
//   [label](/contact)      a link — internal paths use next/link, anything
//                          else opens normally (mailto:, https:)
//   **term**               bold
//   `key`                  code — a storage key, a file name
//   {{key}}                a value from `vars` (an email, a date), so an
//                          address changed in data/agency.js changes here too
//
// Nothing else is interpreted. No HTML is ever injected.

const TOKEN = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;

export function fill(text, vars = {}) {
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}

export default function Rich({ text, vars }) {
  const source = fill(text, vars);
  const parts = source.split(TOKEN).filter((p) => p !== "");
  return parts.map((part, i) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={i} href={href} className="ag-link">
          {label}
        </Link>
      ) : (
        <a
          key={i}
          href={href}
          className="ag-link"
          {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const code = /^`([^`]+)`$/.exec(part);
    if (code) {
      return (
        <code key={i} className="ag-num text-[0.9em]" style={{ color: "var(--ag-ink)" }}>
          {code[1]}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
