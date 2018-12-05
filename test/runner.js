const fs = require("fs");
const path = require("path");
const expect = require("expect");
const { JSDOM } = require("jsdom");
const innerText = require("../index");

describe("Tests without getComputedStyle()", () => {
  const cases = path.join(__dirname, "cases");
  const baselines = path.join(__dirname, "baselines")
  for (const caseName of fs.readdirSync(cases)) {
    it(caseName, () => {
      const caseText = fs.readFileSync(path.join(cases, caseName), "utf-8");
      const fragment = JSDOM.fragment(caseText);
      if (!fragment.firstElementChild) {
        throw new Error("Test case requires a single container element");
      }
      const converted = innerText(/** @type {HTMLElement} */(fragment.firstElementChild));
      const baselineName = caseName.split(".")[0];
      const baseline = fs.readFileSync(path.join(baselines, baselineName), "utf-8");
      expect(converted + "\n").toBe(baseline);
    });
  }
});

describe("Tests with getComputedStyle()", () => {
  const cases = path.join(__dirname, "cases");
  const baselines = path.join(__dirname, "baselines")
  for (const caseName of fs.readdirSync(cases)) {
    it(caseName, () => {
      const caseText = fs.readFileSync(path.join(cases, caseName), "utf-8");
      const win = new JSDOM(caseText).window;
      const { firstElementChild } = win.document.body;
      if (!firstElementChild) {
        throw new Error("Test case requires a single container element");
      }
      const converted = innerText(/** @type {HTMLElement} */(firstElementChild), {
        getComputedStyle: win.getComputedStyle
      });
      const baselineName = caseName.split(".")[0];
      const baseline = fs.readFileSync(path.join(baselines, baselineName), "utf-8");
      expect(converted).toBe(baseline.trimEnd());
    });
  }
});
