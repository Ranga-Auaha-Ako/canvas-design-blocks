<script lang="ts" context="module">
  import { colord, extend, Colord } from "colord";
  import a11yPlugin from "colord/plugins/a11y";
  extend([a11yPlugin]);
  export function getColour(
    colour: Colord | string | undefined
  ): undefined | Colord {
    const notColours = new Set([
      "currentcolor",
      "inherit",
      "initial",
      "revert",
      "rever-layer",
      "unset",
    ]);
    if (colour instanceof Colord) return colour;
    if (!colour || notColours.has(colour)) return undefined;
    return colord(colour);
  }
</script>

<script lang="ts">
  import {
    autoUpdate,
    computePosition,
    flip,
    offset,
    Placement,
    shift,
  } from "@floating-ui/dom";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { clickOutside } from "svelte-use-click-outside";
  import Portal from "$lib/portal/portal.svelte";
  import preventBubble from "$lib/util/preventBubble";
  import theme from "$lib/util/theme";
  import { stringify } from "querystring";
  import { nanoid } from "nanoid";

  export let id: string = nanoid();
  export let colour: Colord | undefined = undefined;
  export let contrastColour: Colord | undefined | "Light/Dark" = undefined;
  export let showAccessible: boolean = false;
  export let isText: boolean = false;
  export let label: string;
  export let popupDirection: Placement = "bottom-start";
  export let zIndex = 10;
  export let showNone = true;
  export let asModal = false;
  export let style: "default" | "wide" | "minimal" = "default";
  export let filterByContrast: boolean = false;
  export let useSmartColour: boolean = false;

  const dispatch = createEventDispatcher<{ select: Colord | undefined }>();

  const smartColour = (colour: string, conColour: typeof contrastColour) => {
    let c = colord(colour);
    let foundConColour =
      conColour === "Light/Dark"
        ? c.isLight()
          ? colord("#000000")
          : colord("#ffffff")
        : conColour;
    // Only adjust colour if contrast is not readable (AA not AAA)
    if (foundConColour && !foundConColour.isReadable(c)) {
      if (foundConColour.isLight()) {
        return c.darken(0.1);
      } else {
        return c.desaturate(0.3).lighten(0.5);
      }
    }
    return c;
  };

  $: options = (() => {
    let colours: { code?: Colord; name: string }[] = [
      {
        code: useSmartColour ? smartColour(theme.primary, contrastColour) : colord(theme.primary),
        name: "Primary",
      },
      {
        code: useSmartColour ? smartColour(theme.secondary, contrastColour) : colord(theme.secondary),
        name: "Secondary",
      },
    ];

    if (theme.palette) {
      let allColors = Object.entries(theme.palette).map(([name, hex]) => ({
        code: useSmartColour ? smartColour(hex, contrastColour) : colord(hex),
        name,
      }));
      colours.push(...allColors);
    }

    // if filterByContrast, filter palette AFTER all colors are assembled
    if (filterByContrast && contrastColour) {
      if (contrastColour === "Light/Dark") {
        colours = colours.filter(c => c.code && (
          c.code.isDark()
            ? c.code.contrast(colord("#ffffff")) >= 4.5
            : c.code.contrast(colord("#000000")) >= 4.5
        ));
      } else {
        colours = colours.filter(c => c.code && c.code.contrast(contrastColour) >= 4.5);
      }
    }

    if (showNone) {
      colours.push({ code: undefined, name: "None" });
    }
    return colours;
  })();

  const select = (c: Colord | undefined) => {
    colour = getColour(c);
    customColour = false;
    dispatch("select", colour);
  };

  let edit = false;

  let x = 0;
  let y = 0;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let container: HTMLDivElement;
  let popoverTarget: HTMLButtonElement;
  let popoverEl: HTMLDialogElement;

  $: if (edit && popoverEl) {
    if (asModal) popoverEl.showModal();
    else popoverEl.show();
  } else if (popoverEl) {
    popoverEl.close();
  }

  $: updateFunction = async () => {
    const position = await computePosition(popoverTarget, popoverEl, {
      placement: popupDirection,
      middleware: [offset(0), shift(), flip(), offset(10)],
    });
    x = position.x;
    y = position.y;
  };

  let cleanup: () => void;
  $: if (edit && popoverTarget && popoverEl) {
    cleanup = autoUpdate(popoverTarget, popoverEl, updateFunction, {});
  } else {
    if (cleanup) cleanup();
  }
  onMount(() => {
    updateFunction();
  });

  onDestroy(() => {
    if (cleanup) cleanup();
  });

  let customColour = false;

  let customColourVal: string | undefined;

  const updateCustomColour = (col?: Colord) => {
    if (col?.toHex() === customColourVal) return;
    if (col) customColourVal = col.toHex();
  };
  const updateColourFromCustom = (col?: string) => {
    if (!col || col.length !== 7) return;
    const newCol = colord(col);
    if (newCol.isValid() && col !== colour?.toHex()) colour = colord(col);
    dispatch("select", colour);
  };

  $: updateCustomColour(colour);
  $: updateColourFromCustom(customColourVal);

  $: isInaccessible = (option: Colord | undefined) => {
    if (!showAccessible || !option) return false;
    if (contrastColour === "Light/Dark") {
      return option.isDark()
        ? !option.isReadable(colord("#ffffff"))
        : !option.isReadable(colord("#000000"));
    }
    return (
      contrastColour && !option.isReadable(contrastColour, { level: "AAA" })
    );
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="cgb-component">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="container"
    class:container-wide={style === "wide"}
    bind:this={container}
    on:click={({ target }) => {
      if (target === container) edit = false;
    }}
  >
    {#if style !== "minimal"}
      <label for={id}> {label} </label>
    {/if}
    <button
      bind:this={popoverTarget}
      on:click={(e) => (edit = !edit)}
      class="colour"
      title="Click to change"
      style:background-color={colour?.toHex() || "unset"}
      class:unset={colour === undefined}
      class:white={colour && colour.isLight()}
    />
    <Portal>
      <div
        class="cgb-component"
        use:preventBubble={false}
        use:clickOutside={() => (edit = false)}
      >
        <dialog
          {id}
          style:z-index={zIndex}
          aria-hidden={!edit}
          bind:this={popoverEl}
          style:transform
          on:click={(e) => {
            if (e.target === popoverEl) edit = false;
          }}
        >
          <div class="colourPicker">
            {#each options as option}
              {#if !(option.code === undefined && contrastColour !== undefined && isText)}
                {@const inaccessible = isInaccessible(option.code)}
                <button
                  class="colour colour-option"
                  class:unset={option.code === undefined}
                  class:white={option.code?.isLight()}
                  class:inaccessible
                  class:dark={option.code?.isDark()}
                  title={`${option.name}${
                    inaccessible ? " (Warning! inaccessible)" : ""
                  }`}
                  style:background-color={option.code?.toHex()}
                  class:selected={colour?.toHex() === option.code?.toHex()}
                  on:click={(e) => select(option.code)}
                />
              {/if}
            {/each}
            <div class="colour-custom" class:selected={customColour}>
              <div class="editor">
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <label
                  class="colour colour-option"
                  title="Custom colour"
                  class:white={!customColourVal ||
                    colord(customColourVal)?.isLight() ||
                    colord(customColourVal)?.alpha() === 0}
                  style:background-color={customColourVal}
                  on:click={() => (customColour = true)}
                  for={id + "-custom"}
                >
                  <input
                    id={id + "-custom"}
                    class="invisible absolute"
                    type="color"
                    bind:value={customColourVal}
                    on:input={() => (customColour = true)}
                    aria-hidden="true"
                  />
                </label>
                <input
                  id={id + "-custom"}
                  type="text"
                  bind:value={customColourVal}
                  on:input={() => (customColour = true)}
                />
              </div>
            </div>
          </div>
        </dialog>
      </div></Portal
    >
  </div>
</div>

<style lang="postcss">
  button {
    @apply border-0 block text-base;
  }
  .container {
    @apply flex items-center justify-start w-full;
    &.container-wide {
      @apply justify-between;
      &::before,
      &::after {
        @apply hidden;
      }
    }
  }
  .container,
  .colourPicker {
    --size: 1.7em;
  }
  label {
    @apply pr-2 mb-0;
  }
  .colour {
    @apply rounded;
    width: var(--size);
    height: var(--size);
    cursor: pointer;
    display: inline-block;
  }
  dialog {
    @apply absolute top-0 left-0 p-0 m-0 box-content overflow-clip shadow-lg rounded;
    @apply opacity-0 transition-opacity;
    @apply pointer-events-none;
    &[open] {
      @apply visible opacity-100 pointer-events-auto;
    }
  }
  .colourPicker {
    @apply p-4;
    @apply shadow-lg bg-white rounded;
    @apply grid gap-1;
    grid-template-columns: repeat(4, var(--size));
    /*grid-template-columns: repeat(3, var(--size));*/
    grid-template-rows: auto;
    & .colour-option {
      @apply shadow-sm z-0 transition;
      &.selected {
        @apply z-10 shadow-md scale-75 ring-gray-300 ring-2;
      }
    }
  }
  .colour,
  .colour-option {
    &.unset {
      @apply relative border border-gray-600 border-solid;
      &:after {
        content: " ";
        @apply absolute top-0 left-0 right-0 mx-auto w-px bg-gray-600 h-full;
        transform: rotate(45deg);
      }
    }
    &.white {
      @apply relative border border-gray-200 border-solid;
    }
    &.inaccessible {
      @apply ring-red-500 ring-2 scale-90;
      &:after {
        content: "!";
        @apply absolute top-0 left-0 right-0 mx-auto text-red-500 h-full font-bold;
      }
      &.dark:after {
        @apply text-red-100;
      }
    }
  }

  .colour-custom {
    @apply col-span-4 mt-1 pt-2 border-t-2 border-gray-300;
    /*@apply col-span-3 mt-1 pt-2 border-t-2 border-gray-300;*/
    & .editor {
      @apply flex gap-1;
      height: var(--size);
    }
    &.selected {
      & input {
        @apply ring-blue-500 ring-1;
      }
    }
    & .colour-option {
      @apply m-0 p-0 aspect-square h-full;
    }
    & input {
      @apply w-full h-full grow p-1;
    }
  }
</style>
