const createDisplayHelpers = require("./display");

const nonCSSRenderedElements = [
  "audio",
  "input",
  "noscript",
  "script",
  "style",
  "textarea",
  "video",
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
  const { getDisplay, isBlockLevel, isInlineLevel, isTableRowGroup } = createDisplayHelpers(getComputedStyle);

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
  function getWhiteSpaceRule(element) {
    if (getComputedStyle) {
      return getComputedStyle(element).whiteSpace;
    }
    return element.localName === "pre" ? "pre" : "normal";
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
      if (node.parentElement && getWhiteSpaceRule(node.parentElement) === "pre") {
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
      if (node.localName === "br") {
        items.push("\n");
      } else if (node.localName === "p") {
        items.splice(0, 0, 2);
        items.push(2);
      } else {
        const display = getDisplay(node);
        switch (display) {
          case "table-cell":
            if (node.parentElement && getDisplay(node.parentElement) === "table-row") {
              const cells = [...node.parentElement.children]
                .filter(child => getDisplay(child) === "table-cell");
              if (node !== cells[cells.length - 1]) {
                items.push("\t");
              }
            }
            break;
          case "table-row":
            const table = getClosestParentDisplay(node, "table");
            if (table) {
              const rows = collectTableRows(table);
              if (node !== rows[rows.length - 1]) {
                items.push("\n");
              }
            }
            break;
          default:
            if (display === "table-caption" || isBlockLevel(node)) {
              items.splice(0, 0, 1);
              items.push(1);
            }
            break;
        }
      }
    }
    return items;
  }

  /**
   * @param {Element} element 
   * @param {string} display 
   */
  function getClosestParentDisplay(element, display) {
    let { parentElement } = element;
    while (parentElement) {
      if (getDisplay(parentElement) === display) {
        return parentElement;
      }
      parentElement = parentElement.parentElement;
    }
  }

  /**
   * @param {Element} tableLike 
   */
  function collectTableRows(tableLike) {
    const children = [...tableLike.children];
    const tableComponents = children.filter(isTableRowGroup);
    for (const component of tableComponents) {
      children.push(...component.children);
    }
    return children.filter(c => getDisplay(c) === "table-row")
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
    if (!isInlineLevel(parentElement)) {
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
      if (isElement(previousSibling) && !isInlineLevel(previousSibling)) {
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
      if (isElement(target) && !isInlineLevel(target)) {
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
    if (!isInlineLevel(parentElement)) {
      return;
    }
    return getNextVisualTextSibling(parentElement);
  }

  /**
   * @param {Node} node 
   */
  function getNextNonemptyInlineSibling(node) {
    /** @type {Node | null} */
    let nextSibling = node.nextSibling
    while (nextSibling) {
      if (isElement(nextSibling) && !isInlineLevel(nextSibling)) {
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
      if (isElement(target) && !isInlineLevel(target)) {
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
