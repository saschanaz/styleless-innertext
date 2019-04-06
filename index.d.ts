declare function innerText(element: HTMLElement, options?: { 
  getComputedStyle?: Window["getComputedStyle"]
}): string;
declare var innerTextExport: typeof innerText & { default: typeof innerText };
export = innerTextExport;
