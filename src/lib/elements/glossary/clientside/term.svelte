<script lang="ts">
  import Portal from "$lib/portal/portal.svelte";
  import {
    arrow,
    autoUpdate,
    computePosition,
    inline,
    offset,
    shift,
  } from "@floating-ui/dom";
  import { nanoid } from "nanoid";
  import { GLOSSARY_ENABLED } from "../glossaryClientManager";
  export let term: string;
  export let definition: string;
  const id = nanoid();
  let open = false;
  let termEl: HTMLElement;
  let defEl: HTMLElement;
  let arrowEl: HTMLElement;

  let x = 0;
  let y = 0;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let arrowX: number | null | undefined;
  let arrowY: number | null | undefined;
  $: updateFunction = async () => {
    if (!termEl || !defEl) return;
    const position = await computePosition(termEl, defEl, {
      placement: "bottom",
      middleware: [
        offset(10),
        shift({
          padding: 10,
          altBoundary: true,
        }),
        inline(),
        arrow({
          element: arrowEl,
          padding: 5,
        }),
      ],
    });
    arrowX = position.middlewareData.arrow?.x;
    arrowY = position.middlewareData.arrow?.y;
    x = position.x;
    y = position.y;
  };
  let cleanup: () => void | undefined;
  $: if (open && defEl && termEl) {
    if (cleanup) cleanup();
    cleanup = autoUpdate(termEl, defEl, updateFunction);
  }
  $: if (!open && cleanup) cleanup();

  let nextAction: number | undefined;
  let forceOpen = false;
  const hideTooltip = () => {
    if (forceOpen) return;
    clearTimeout(nextAction);
    nextAction = window.setTimeout(() => {
      nextAction = undefined;
      open = false;
    }, 150);
  };

  const showTooltip = () => {
    if (forceOpen) return;
    clearTimeout(nextAction);
    nextAction = window.setTimeout(() => {
      window.activeCDBGlossaryTooltip?.();
      nextAction = undefined;
      open = true;
    }, 150);
  };

  const forceToggle = () => {
    document.removeEventListener("click", forceToggle);
    forceOpen = !forceOpen;
    if (forceOpen) {
      window.activeCDBGlossaryTooltip?.();
      open = true;
      setTimeout(() => {
        document.addEventListener("click", forceToggle);
      }, 50);
    } else {
      open = false;
    }
  };

  $: if (open)
    window.activeCDBGlossaryTooltip = () => {
      if (forceOpen) return;
      open = false;
      forceOpen = false;
    };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  on:mouseenter={() => $GLOSSARY_ENABLED && showTooltip()}
  on:mouseleave={() => hideTooltip()}
  ><button
    class:disabledHighlight={!$GLOSSARY_ENABLED}
    aria-labelledby={open ? `${id}-label` : undefined}
    on:click={() => $GLOSSARY_ENABLED && forceToggle()}
    bind:this={termEl}>{term}</button
  ><Portal>
    <!-- svelte-ignore a11y-click-events-have-key-events --><span
      bind:this={defEl}
      class:open
      class="dfn"
      style:transform
      id={`${id}-label`}
      on:click|stopPropagation
      ><span
        class="dfn-arrow"
        style:top={arrowY != null ? `${arrowY}px` : undefined}
        style:left={arrowX != null ? `${arrowX}px` : undefined}
        bind:this={arrowEl}
      ></span><span class="dfn-text">{@html definition}</span></span
    ></Portal
  ></span
>

<style lang="postcss">
  button {
    @apply appearance-none bg-transparent border-0 cursor-help underline decoration-dotted select-text;
    font-style: inherit;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    padding: 0;
    display: inline;
    font-weight: inherit;
    vertical-align: inherit;

    &.disabledHighlight {
      @apply no-underline;
      cursor: unset;
    }
  }
  .dfn {
    @apply invisible opacity-0 transition-opacity duration-300;
    @apply absolute z-30 top-0 left-0;
    @apply text-sm bg-black text-white px-2 py-1 shadow rounded-sm;
    transition-property: opacity, visibility;
    max-width: fit-content;
    width: min(calc(100% - 3rem), 65ch);
    &.open {
      @apply visible opacity-100 duration-500;
    }
    .dfn-arrow {
      @apply absolute w-2 h-2 -top-1 -z-10 pointer-events-none;
      @apply bg-black rotate-45 rounded-tl-sm;
    }
  }
</style>
