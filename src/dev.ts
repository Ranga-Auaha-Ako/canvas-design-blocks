import "redefine-custom-elements";
// LICENSED: MIT
// This file is released under the MIT license to be used in any project. You can find the license text at https://opensource.org/licenses/MIT

// This should only be loaded in the dev environment
// Patch: https://nuclia.com/front-end/how-to-run-svelte-custom-elements-in-dev-mode/

if (!import.meta.env.DEV) {
  throw new Error("This should only be loaded in the dev environment");
}

const _define = customElements.define;
customElements.define = function (name, CustomElement, options) {
  const nativeDef = _define.bind(customElements);
  nativeDef(name, CustomElement, options);

  // re-render the impacted elements
  setTimeout(() => {
    if (document.querySelectorAll(name).length) {
      console.log(`Re-rendering ${name} elements`);
      document.querySelectorAll(name).forEach((el) => {
        const parentNode = el.parentNode;
        el.remove();
        parentNode?.appendChild(el);
      });
    }
  }, 0);
};
