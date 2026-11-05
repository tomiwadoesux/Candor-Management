// The travelling captions are owned by the scroll scene, outside React.
// Keep their glyph nodes stable while their text is unchanged.
export function setAdaptiveText(element, text) {
  if (element.dataset.adaptiveText === text) return;
  element.dataset.adaptiveText = text;
  element.replaceChildren(...Array.from(text, (letter) => {
    if (/\s/.test(letter)) return document.createTextNode(letter);
    const glyph = document.createElement("span");
    glyph.textContent = letter;
    return glyph;
  }));
}
