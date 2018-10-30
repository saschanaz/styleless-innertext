/**
 * @param {HTMLElement} element target element
 */
export default function innerText(element) {
  let results = collectInnerText(element);
  results = results.filter(item => item !== "");
  while (typeof results[0] === "number") {
    results.shift();
  }
  while (typeof results[results.length - 1] === "number") {
    results.pop();
  }

  // replacement by maximum value
  let found = findConsecutiveNumbers(results, 0);
  while (found.index !== -1) {
    const max = Math.max(...found.numbers);
    results.splice(found.index, found.numbers.length, "\n".repeat(max));
    found = findConsecutiveNumbers(results, found.index);
  }
  return results.join("");
}

/**
 * @param {(string | number)[]} array
 * @param {number} start
 */
function findConsecutiveNumbers(array, start) {
  let index = -1;
  for (let i = start; i < array.length; i++) {
    if (typeof array[i] === "number") {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return {
      index, numbers: []
    };
  }
  /** @type {number[]} */
  const numbers = [/** @type {number} */(array[index])];
  for (let i = index + 1; i < array.length; i++) {
    if (typeof array[i] !== "number") {
      break;
    }
    numbers.push(/** @type {number} */(array[i]));
  }
  return {
    index, numbers
  };
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
  "ul",

  // considered as block-level only for innerText
  "optgroup",
  "option"
]

/**
 * Runs "inner text collection steps"
 * @param {Node} node target node
 */
function collectInnerText(node) {
  /** @type {(number | string)[]} */
  const items = arrayFlat(getChildNodes(node).map(collectInnerText));

  if (isText(node)) {
    if (node.parentElement && node.parentElement.localName === "pre") {
      items.push(/** @type {string} */(node.textContent));
    } else {
      let collapsed = (/** @type {string} */(node.textContent)).replace(/\s+/g, " ");
      if (followedByInlineWhitespace(node) || followsBlock(node)) {
        collapsed = collapsed.trimStart();
      }
      if (!node.nextSibling || isElementOf(node.nextSibling, "br") || followedByBlock(node)) {
        items.push(collapsed.trimEnd());
      } else {
        items.push(collapsed);
      }
    }
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
 * @param {Text} text 
 */
function followsBlock(text) {
  return text.previousSibling && 
    isElement(text.previousSibling) &&
    blockElements.includes(text.previousSibling.localName);
}

/**
 * @param {Text} text 
 */
function followedByBlock(text) {
  return text.nextSibling && 
    isElement(text.nextSibling) &&
    blockElements.includes(text.nextSibling.localName);
}

/**
 * @param {Text} text 
 */
function followedByInlineWhitespace(text) {
  const previousSibling = getPreviousVisualTextSibling(text);
  if (!previousSibling) {
    return false;
  }
  return /\s$/.test(/** @type {string} */(previousSibling.textContent));
}

/**
 * @param {Text} text 
 */
function getPreviousVisualTextSibling(text) {
  let { parentElement } = text;
  while (parentElement) {
    if (blockElements.includes(parentElement.localName)) {
      return;
    } else if (parentElement.previousSibling && parentElement.previousSibling.nodeType === 1) {
      return /** @type {Text} */(parentElement.previousSibling);
    }
  }
}

/**
 * @param {Node} node 
 */
function getChildNodes(node) {
  const childNodes = [...node.childNodes];
  if (!isElement(node)) {
    return childNodes;
  }
  switch (node.localName) {
    case "select":
      return childNodes.filter(node => isElementOf(node, "optgroup") || isElementOf(node, "option"));
    case "optgroup":
      return childNodes.filter(node => isElementOf(node, "option"));
  }
  return childNodes;
}

/**
 * @template {keyof HTMLElementTagNameMap} K 
 * @param {Node} node
 * @param {K} localName
 * @return {node is HTMLElementTagNameMap[K]}
 */
function isElementOf(node, localName) {
  return isElement(node) && node.localName === localName;
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
 * 
 * @param {Node} node
 * @return {node is Text}
 */
function isText(node) {
  return node.nodeType === 3;
}

/**
 * @template T
 * @param {T[][]} array 
 */
function arrayFlat(array) {
  return (/** @type {T[]} */([])).concat(...array);
}
