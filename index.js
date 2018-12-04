/** 
 * Elements that is block-level by default
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

  // Considered as block-level only for innerText
  "optgroup",
  "option"
];

const nonCSSRenderedElements = [
  "audio",
  "input",
  "noscript",
  "script",
  "style",
  "textarea",
  "video",
];

/**
 * @param {HTMLElement} element target element
 */
function innerText(element) {
  if (nonCSSRenderedElements.includes(element.localName)) {
    return element.textContent;
  }

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
module.exports = innerText;
innerText.default = innerText;

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
 * Runs "inner text collection steps"
 * @param {Node} node target node
 */
function collectInnerText(node) {
  if (isElement(node) && nonCSSRenderedElements.includes(node.localName)) {
    // Return early because `display: contents` is currently being ignored.
    return [];
  }

  /** @type {(number | string)[]} */
  const items = arrayFlat(getChildNodes(node).map(collectInnerText));

  if (isText(node)) {
    if (node.parentElement && node.parentElement.localName === "pre") {
      items.push(/** @type {string} */(node.textContent));
    } else {
      let collapsed = (/** @type {string} */(node.textContent)).replace(/\s+/g, " ");
      if (shouldTrimStart(node)) {
        collapsed = collapsed.trimStart();
      }
      if (isElementOf(node.nextSibling, "br") || !getNextVisualTextSibling(node)) {
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
        if (isElementOf(node.parentElement, "tr")) {
          const { cells } = node.parentElement;
          if (node !== cells[cells.length - 1]) {
            items.push("\t");
          }
        }
        break;
      case "tr":
        if (isElementOf(node.parentElement, "table")) {
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
function shouldTrimStart(text) {
  const previousSibling = getPreviousVisualTextSibling(text);
  if (!previousSibling) {
    return true;
  }
  return /\s$/.test(/** @type {string} */(previousSibling.textContent));
}

/**
 * @param {Node} node
 * @return {Text | undefined}
 */
function getPreviousVisualTextSibling(node) {
  const previousSibling = getPreviousNonemptyInlineSibling(node);
  if (previousSibling) {
    return getLastLeafTextIfInline(previousSibling);
  }
  let { parentElement } = node;
  if (!parentElement) {
    return;
  }
  if (blockElements.includes(parentElement.localName)) {
    return;
  }
  return getPreviousVisualTextSibling(parentElement);
}

/**
 * @param {Node} node 
 */
function getPreviousNonemptyInlineSibling(node) {
  let { previousSibling } = node
  while (previousSibling) {
    if (isElement(previousSibling) && blockElements.includes(previousSibling.localName)) {
      return;
    } else if (previousSibling.textContent) {
      return previousSibling;
    }
    previousSibling = previousSibling.previousSibling;
  }
}

/**
 * @param {Node} node 
 */
function getLastLeafTextIfInline(node) {
  let target = node;
  while (target) {
    if (isElement(target) && blockElements.includes(target.localName)) {
      return;
    }
    if (target.nodeType === 3) {
      return /** @type {Text} */ (target);
    }
    if (!target.lastChild) {
      return;
    }
    target = target.lastChild;
  }
}

/**
 * @param {Node} node
 * @return {Text | undefined}
 */
function getNextVisualTextSibling(node) {
  const nextSibling = getNextNonemptyInlineSibling(node);
  if (nextSibling) {
    return getFirstLeafTextIfInline(nextSibling);
  }
  let { parentElement } = node;
  if (!parentElement) {
    return;
  }
  if (blockElements.includes(parentElement.localName)) {
    return;
  }
  return getNextVisualTextSibling(parentElement);
}

/**
 * @param {Node} node 
 */
function getNextNonemptyInlineSibling(node) {
  let { nextSibling } = node
  while (nextSibling) {
    if (isElement(nextSibling) && blockElements.includes(nextSibling.localName)) {
      return;
    } else if (nextSibling.textContent) {
      return nextSibling;
    }
    nextSibling = nextSibling.previousSibling;
  }
}

/**
 * @param {Node} node 
 */
function getFirstLeafTextIfInline(node) {
  let target = node;
  while (target) {
    if (isElement(target) && blockElements.includes(target.localName)) {
      return;
    }
    if (target.nodeType === 3) {
      return /** @type {Text} */ (target);
    }
    if (!target.firstChild) {
      return;
    }
    target = target.firstChild;
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
 * @param {Node | null} node
 * @param {K} localName
 * @return {node is HTMLElementTagNameMap[K]}
 */
function isElementOf(node, localName) {
  return !!node && isElement(node) && node.localName === localName;
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
