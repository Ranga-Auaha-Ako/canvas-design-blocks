<script context="module" lang="ts">
  import { tick } from "svelte";
  // License: MIT
  // Derived from: https://github.com/romkor/svelte-portal

  const deriveWindow = (elm: HTMLElement | null) => {
    // Source: https://stackoverflow.com/a/20532809/3902950
    return elm?.ownerDocument?.defaultView || false;
  };

  /**
   * Usage: <div use:portal={'css selector'}> or <div use:portal={document.body}> or <div use:portal={document.body} window={otherwindowcontext}>
   *
   * @param el
   * @param target DOM Element or CSS Selector
   */
  export function portal(
    el: HTMLElement,
    target: HTMLElement | string = "body"
  ) {
    let targetEl: HTMLElement;
    async function update(newTarget: typeof target | null) {
      let target = newTarget;
      let newTargetEl: HTMLElement | null;
      if (typeof target === "string") {
        newTargetEl = document.querySelector(target);
        if (newTargetEl === null) {
          await tick();
          newTargetEl = document.querySelector(target);
        }
        if (newTargetEl === null) {
          throw new Error(
            `No element found matching css selector: "${target}"`
          );
        }
        targetEl = newTargetEl;
      } else {
        const tWindow = deriveWindow(target);
        if (tWindow && target instanceof tWindow.HTMLElement) {
          targetEl = target;
        } else {
          debugger;
          throw new TypeError(
            `Unknown portal target type: ${
              target === null ? "null" : typeof target
            }. Allowed types: string (CSS selector) or HTMLElement.`
          );
        }
      }
      targetEl.appendChild(el);
      el.hidden = false;
    }

    function destroy() {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }

    update(target);
    return {
      update,
      destroy,
    };
  }
</script>

<script lang="ts">
  /**
   * DOM Element or CSS Selector
   */
  export let target: HTMLElement | string = "body";
</script>

<div use:portal={target} style="display: contents" hidden>
  <slot />
</div>
