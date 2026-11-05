/** Each visible glyph uses the shared image/video sampler, like Look's title.
 * Inline spans preserve normal word wrapping and the original typography.
 */
export default function AdaptiveText({ as: Tag = "span", children, ...props }) {
  const text = String(children ?? "");
  return (
    <Tag {...props} data-adaptive-text={text}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text, (letter, index) => /\s/.test(letter)
          ? letter
          : <span key={index}>{letter}</span>)}
      </span>
    </Tag>
  );
}
