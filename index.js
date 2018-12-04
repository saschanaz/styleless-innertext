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

// https://www.w3.org/TR/css-display-3/#ref-for-block-level
const blockLevelDisplays = [
  "block",
  "flow-root",
  "list-item",
  "flex",
  "grid",
  "table"
];

module.exports = innerText;
innerText.default = innerText;

/**
 * @param {HTMLElement} element target element
 * @param {{ getComputedStyle?: Window["getComputedStyle"] }} options
 */
function innerText(element, { getComputedStyle } = {}) {
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

  /**
   * @param {Element} element 
   */
  function isBlock(element) {
    if (["optgroup", "option"].includes(element.localName)) {
      // Considered as block-level only for innerText
      return true;
    }
    if (getComputedStyle) {
      return blockLevelDisplays.includes(String(getComputedStyle(element).display));
    }
    return blockElements.includes(element.localName);
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
          if (node.localName === "caption" || isBlock(node)) {
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
   * @param {Text} text 
   */
  function getPreviousVisualTextSibling(text) {
    if (text.previousSibling) {
      return getLastLeafTextIfInline(text.previousSibling);
    }
    let { parentElement } = text;
    while (parentElement) {
      if (isBlock(parentElement)) {
        return;
      } else if (parentElement.previousSibling) {
        return getLastLeafTextIfInline(parentElement.previousSibling);
      }
      parentElement = parentElement.parentElement;
    }
  }

  /**
   * @param {Node} node 
   */
  function getLastLeafTextIfInline(node) {
    let target = node;
    while (target) {
      if (isElement(target) && isBlock(target)) {
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
   * @param {Text} text 
   */
  function getNextVisualTextSibling(text) {
    if (text.nextSibling) {
      return getFirstLeafTextIfInline(text.nextSibling);
    }
    let { parentElement } = text;
    while (parentElement) {
      if (isBlock(parentElement)) {
        return;
      } else if (parentElement.nextSibling) {
        return getFirstLeafTextIfInline(parentElement.nextSibling);
      }
      parentElement = parentElement.parentElement;
    }
  }

  /**
   * @param {Node} node 
   */
  function getFirstLeafTextIfInline(node) {
    let target = node;
    while (target) {
      if (isElement(target) && isBlock(target)) {
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
