/**
 * The 45° out-arrow used on link hovers across the site (footer, the sphere
 * page's chrome). One component so the glyph only ever changes in one place.
 */
export default function ArrowOut({ size = 14, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4.22904 12.2711L11.7715 4.7286M11.7715 4.7286H5.17185M11.7715 4.7286V11.3283"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
