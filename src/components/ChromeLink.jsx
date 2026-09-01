import ArrowOut from "./ArrowOut";

// The arrow never moves: it sits at the outer edge of the link, scaled down
// and invisible, and only scales up on hover. What moves is the text, which
// steps aside to uncover it — left in the right-hand column, right in the
// left-hand one, where the arrow is on the left. Both are absolutely
// positioned, so a hover never changes a row's width or reflows the column.
const ARROW =
  "pointer-events-none absolute scale-50 opacity-0 transition duration-300 ease-out group-hover:scale-100 group-hover:opacity-100";

export default function ChromeLink({ href = "#", left = false, className = "", children }) {
  return (
    <a
      href={href}
      className={`group pointer-events-auto relative flex items-center ${
        left ? "justify-start" : "justify-end"
      } ${className}`}
    >
      {left && <ArrowOut size={12} className={`${ARROW} left-0`} />}
      <span
        className={`whitespace-nowrap transition-transform duration-300 ease-out ${
          left ? "group-hover:translate-x-4" : "group-hover:-translate-x-4"
        }`}
      >
        {children}
      </span>
      {!left && <ArrowOut size={12} className={`${ARROW} right-0`} />}
    </a>
  );
}
