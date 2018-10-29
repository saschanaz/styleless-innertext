/**
 * @param {HTMLElement} element target element
 */
export default function innerText(element) {

}


/** 
 * elements that is block-level by default
 * From MDN: https://developer.mozilla.org/docs/Web/HTML/Block-level_elements
 */
const blockElements = [
  "address",
  "article",
  "aside",
  "blockquote",
  "details",
  "dialog",
  "dd",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul"
]

/**
 * Runs "inner text collection steps"
 * @param {Node} node target node
 */
function collectInnerText(node) {
  /** @type {(number | string)[]} */
  const items = arrayFlat([...node.childNodes].map(collectInnerText));

  if (node.nodeType === 3) {

  } else if (isElement(node)) {
    switch (node.localName) {
      case "br":
        items.push("\n");
        break;
      case "p":
        items.splice(0, 0, 2);
        items.push(2);
        break;
      case "td":
      case "th":
        if (node.parentElement && isElementOf(node.parentElement, "tr")) {
          const { cells } = node.parentElement;
          if (node !== cells[cells.length - 1]) {
            items.push("\t");
          }
        }
        break;
      case "tr":
        if (node.parentElement && isElementOf(node.parentElement, "table")) {
          const { rows } = node.parentElement;
          if (node !== rows[rows.length - 1]) {
            items.push("\n");
          }
        }
        break;
      default:
        if (node.localName === "caption" || blockElements.includes(node.localName)) {
          items.splice(0, 0, 1);
          items.push(1);
        }
        break;
    }
  }
  return items;
}

/**
 * @template {keyof HTMLElementTagNameMap} K 
 * @param {Node} node
 * @param {K} localName
 * @return {node is HTMLElementTagNameMap[K]}
 */
function isElementOf(node, localName) {
  return isElement(node) && node.localName === localName;
  document.createElement
}

/**
 * 
 * @param {Node} node
 * @return {node is Element}
 */
function isElement(node) {
  return node.nodeType === 1;
}

/**
 * @template T
 * @param {T[][]} array 
 */
function arrayFlat(array) {
  return (/** @type {T[]} */([])).concat(...array);
}
