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
  "ul",

  // Considered as block-level only for innerText
  "optgroup",
  "option"
];

/**
 * @param {Element} element
 */
function getDisplay(element) {
  if (blockElements.includes(element.localName)) {
    return "block";
  }
  switch (element.localName) {
    // https://drafts.csswg.org/css-tables-3/#mapping
    case "table": return "table";
    case "thead": return "table-header-group";
    case "tbody": return "table-row-group";
    case "tfoot": return "table-footer-group";
    case "tr": return "table-row";
    case "td":
    case "th":
      return "table-cell";
    case "colgroup": return "table-column-group"
    case "col": return "table-column";
    case "caption": return "table-caption";

    // https://drafts.csswg.org/css-ruby-1/#default-ua-ruby
    case "ruby": return "ruby";
    case "rp": return "none";
    case "rbc": return "ruby-base-container";
    case "rtc": return "ruby-text-container";
    case "rb": return "ruby-base";
    case "rt": return "ruby-text";
  }
  return "inline";
}

const blockLevelDisplays = ["block", "flow-root", "list-item", "flex", "grid", "table"];

/**
 * @param {Element} element 
 */
function isBlockLevel(element) {
  return blockLevelDisplays.includes(getDisplay(element))
}

const inlineLevelDisplays = [
  "inline",
  "inline-block",
  "run-in",
  "inline list-item",
  "inline-flex",
  "inline-grid",
  "ruby",
  "inline-table"
];

/**
 * @param {Element} element 
 */
function isInlineLevel(element) {
  return inlineLevelDisplays.includes(getDisplay(element));
}

const tableRowGroups = [
  "table-header-group",
  "table-row-group",
  "table-footer-group"
]

/**
 * @param {Element} element 
 */
function isTableRowGroup(element) {
  return tableRowGroups.includes(getDisplay(element));
}

module.exports = {
  getDisplay,
  isBlockLevel,
  isInlineLevel,
  isTableRowGroup
};
