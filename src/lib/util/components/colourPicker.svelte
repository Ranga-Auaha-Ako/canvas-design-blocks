<script lang="ts" context="module">
  import { colord, extend, Colord } from "colord";
  // import a11yPlugin from "colord/plugins/a11y";
  // extend([a11yPlugin]);
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

  export const getContrast = (text: Colord, background: Colord) => {
    const textCol = text.toRgb();
    const bgCol = background.toRgb();
    return apcaContrastValue(colorFromObject(textCol), colorFromObject(bgCol));
  };

  // https://www.myndex.com/APCA/
  export enum Readability {
    BODY = 90, // 18px/weight 300 or 14px/weight 400 (normal), or non-body text with a font no smaller than 12px
    LARGE = 75, // 24px/300 weight, 18px/400, 16px/500 and 14px/700. This level may be used with non-body text with a font no smaller than 15px/400
    // CONTENT = 60, // 48px/200, 36px/300, 24px normal weight (400), 21px/500, 18px/600, 16px/700 (bold)
    HEADER = 45, //  (36px normal weight or 24px bold) such as headlines, and large text
    NONE = 0,
  }

  export const ReadableLevel = (text: Colord, background: Colord) => {
    const contrast = Math.abs(getContrast(text, background));
    let suitability = Readability.NONE;
    if (contrast >= Readability.BODY) suitability = Readability.BODY;
    else if (contrast >= Readability.LARGE) suitability = Readability.LARGE;
    else if (contrast >= Readability.HEADER) suitability = Readability.HEADER;
    return { contrast, suitability };
  };

  export const isReadable = (text: Colord, background: Colord) => {
    return Math.abs(getContrast(text, background)) >= 90;
  };
</script>

<script lang="ts">
  import {
    autoUpdate,
    computePosition,
    flip,
    hide,
    offset,
    shift,
  } from "@floating-ui/dom";
  import { onMount } from "svelte";
  import { clickOutside } from "svelte-use-click-outside";
  import { apcaContrastValue, colorFromObject } from "a11y-color-contrast";
  import Portal from "$lib/portal/portal.svelte";
  import preventBubble from "../preventBubble";

  export let id: string;
  export let colour: Colord | undefined = undefined;
  export let contrastColour: Colord | undefined = undefined;
  export let isTextColour: boolean = true; // Used to determine if the colour is for text or background
  // export let contrastSettings: undefined | Parameters<Colord["isReadable"]>[1] =
  export let showAccessible: boolean = true;
  $: inaccessible = false;
  undefined;
  export let label: string;

  /**
   * Returns whether the combination is light mode (true) or dark mode (false)
   * @param colours
   * @param background
   * @param flip If true, the foreground/bg will be flipped
   */
  const isLightMode = (
    text: Colord,
    background: Colord,
    flip: boolean = false
  ): boolean => {
    return (
      (flip ? getContrast(background, text) : getContrast(text, background)) > 0
    );
  };

  const getAccessibleCol = (fg: Colord, bg: Colord, returnBG = true) => {
    const returnCol = returnBG ? bg : fg;
    if (isLightMode(fg, bg)) {
      return returnCol.darken(0.25);
    } else {
      return returnCol.desaturate(0.3).lighten(0.7);
    }
  };

  const smartColour = (
    colour: string,
    conColour: typeof contrastColour,
    colIsText: boolean
  ) => {
    const c = colord(colour);
    if (conColour && !colIsText && !isReadable(conColour, c)) {
      return getAccessibleCol(c, conColour, false);
    }
    return c;
  };
  $: options = [
    {
      code: smartColour("#00467F", contrastColour, isTextColour),
      name: "Dark blue",
    },
    {
      code: smartColour("#000000", contrastColour, isTextColour),
      name: "Black",
    },
    {
      code: smartColour("#4A4A4C", contrastColour, isTextColour),
      name: "Body Grey",
    },
    {
      code: smartColour("#8D9091", contrastColour, isTextColour),
      name: "Silver",
    },
    {
      code: smartColour("#A71930", contrastColour, isTextColour),
      name: "Arts",
    },
    {
      code: smartColour("#7D0063", contrastColour, isTextColour),
      name: "Business School",
    },
    {
      code: smartColour("#D2492A", contrastColour, isTextColour),
      name: "Creative Arts and Industries",
    },
    {
      code: smartColour("#55A51C", contrastColour, isTextColour),
      name: "Education and Social Work",
    },
    {
      code: smartColour("#4F2D7F", contrastColour, isTextColour),
      name: "Engineering",
    },
    {
      code: smartColour("#005B82", contrastColour, isTextColour),
      name: "Auckland Law School",
    },
    {
      code: smartColour("#00877C", contrastColour, isTextColour),
      name: "Medical Health Sciences",
    },
    {
      code: smartColour("#0039A6", contrastColour, isTextColour),
      name: "Science",
    },
    {
      code: smartColour("#BA4482", contrastColour, isTextColour),
      name: "Auckland Bioengineering Institute",
    },
    {
      code: smartColour("#006990", contrastColour, isTextColour),
      name: "Liggins Institute",
    },
    {
      code: smartColour("#ffffff", contrastColour, isTextColour),
      name: "White",
    },
    { code: undefined, name: "None" },
  ];

  $: {
    if (colour && contrastColour && !isTextColour) {
      // Lighten the BG if text is inaccessible
      const inaccessible = !isReadable(contrastColour, colour);
      if (inaccessible) {
        colour = getAccessibleCol(contrastColour, colour);
      }
    }
  }

  const select = (c: Colord | undefined) => {
    colour = getColour(c);
  };

  let edit = false;

  let x = 0;
  let y = 0;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let container: HTMLDivElement;
  let popoverTarget: HTMLButtonElement;
  let popoverEl: HTMLDivElement;

  $: updateFunction = async () => {
    let additionalOffset = [0, 0];
    const position = await computePosition(popoverTarget, popoverEl, {
      placement: "bottom-start",
      middleware: [
        offset(0),
        shift(),
        // flip(),
        offset(10),
      ],
    });
    x = position.x + additionalOffset[0];
    y = position.y + additionalOffset[1];
  };

  let cleanup: () => void;
  $: if (edit && popoverTarget && popoverEl) {
    cleanup = autoUpdate(popoverTarget, popoverEl, updateFunction, {
      animationFrame: true,
    });
  } else {
    if (cleanup) cleanup();
  }
  onMount(() => {
    updateFunction();
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="cgb-component">
  <div
    class="container"
    bind:this={container}
    on:click={({ target }) => {
      if (target === container) edit = false;
    }}
  >
    <label for={id}> {label} </label>
    <button
      bind:this={popoverTarget}
      on:click={(e) => (edit = !edit)}
      class="colour"
      title="Click to change"
      style:background-color={colour?.toHex() || "unset"}
      class:unset={colour === undefined}
      class:white={colour?.toHex() == "#ffffff"}
    />
    <Portal>
      <div
        class="cgb-component"
        use:clickOutside={() => (edit = false)}
        use:preventBubble={false}
      >
        <div
          {id}
          class="colourPicker"
          aria-hidden={!edit}
          class:edit
          bind:this={popoverEl}
          style:transform
        >
          {#if edit}
            {#each options as option}
              {@const inaccessible =
                showAccessible &&
                contrastColour &&
                option.code &&
                (isTextColour
                  ? !isReadable(option.code, contrastColour)
                  : !isReadable(contrastColour, option.code))}

              <button
                class="colour colour-option"
                class:unset={option.code === undefined}
                class:white={option.code && option.code.toHsl().l > 0.9}
                class:inaccessible
                class:dark={option.code && option.code.toHsl().l < 0.5}
                title={`${option.name}${
                  inaccessible ? " (Warning! inaccessible)" : ""
                }`}
                style:background-color={option.code?.toHex()}
                class:selected={colour?.rgba === option.code?.rgba}
                on:click={(e) => select(option.code)}
              />
            {/each}
          {/if}
        </div>
      </div>
    </Portal>
  </div>
</div>

<style lang="postcss">
  button {
    @apply border-0 block text-base;
  }
  .container {
    @apply flex items-center justify-start w-full;
    --size: 1.7em;
  }
  label {
    @apply pr-2;
  }
  .colour {
    @apply rounded;
    width: var(--size);
    height: var(--size);
    cursor: pointer;
    display: inline-block;
  }
  .colourPicker {
    @apply absolute top-0 left-0 p-4 z-10 w-44 h-44;
    @apply shadow-lg bg-white rounded;
    @apply grid grid-cols-4 gap-1;
    /* @apply flex flex-wrap gap-1 shadow bg-white rounded; */
    @apply pointer-events-none opacity-0 transition-opacity;
    &.edit {
      @apply visible opacity-100 pointer-events-auto;
    }
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
</style>
