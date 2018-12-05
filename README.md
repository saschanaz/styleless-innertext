# styleless-innertext

A library to imitate WHATWG HTMLElement.innerText specification. It ignores CSS styles by default, unless `getComputedStyle` function is explicitly given.

```js
const innerText = require("styleless-innertext");
const { JSDOM } = require("jsdom");

const html = `<table>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td>Abe Nana</td><td>17</td></tr>
</table>`;

// Gives "Name\tAge\nAbe Nana\t17"
innerText(JSDOM.fragment(html).firstChild);

// CSS-agnostic way, gives "inline text"
const csshtml = `<style>.inline { display: inline }</style>
<div class="inline">inline</div> <div class="inline">text</div>`;
const scope = new JSDOM(csshtml).window;
innerText(scope.document.body, {
  getComputedStyle: scope.getComputedStyle
});
```
