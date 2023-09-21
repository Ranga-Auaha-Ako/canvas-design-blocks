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
    offset,
    Placement,
    shift,
  } from "@floating-ui/dom";
  import { onDestroy, onMount } from "svelte";
  import { clickOutside } from "svelte-use-click-outside";
  import Portal from "$lib/portal/portal.svelte";
  import preventBubble from "../preventBubble";

  export let id: string;
  export let colour: Colord | undefined = undefined;
  export let contrastColour: Colord | undefined = undefined;
  export let showAccessible: boolean = true;
  export let isText: boolean = false;
  export let label: string;
  export let popupDirection: Placement = "bottom-start";

  const smartColour = (colour: string, conColour: typeof contrastColour) => {
    const c = colord(colour);
    // Only adjust colour if contrast is not readable (AA not AAA)
    if (conColour && showAccessible && !conColour.isReadable(c)) {
      if (conColour.isLight()) {
        return c.darken(0.1);
      } else {
        return c.desaturate(0.3).lighten(0.5);
      }
    }
    return c;
  };
  $: options = [
    {
      code: smartColour("#00467F", contrastColour),
      name: "Dark blue",
    },
    {
      code: smartColour("#000000", contrastColour),
      name: "Black",
    },
    {
      code: smartColour("#4A4A4C", contrastColour),
      name: "Body Grey",
    },
    {
      code: smartColour("#8D9091", contrastColour),
      name: "Silver",
    },
    {
      code: smartColour("#A71930", contrastColour),
      name: "Arts",
    },
    {
      code: smartColour("#7D0063", contrastColour),
      name: "Business School",
    },
    {
      code: smartColour("#D2492A", contrastColour),
      name: "Creative Arts and Industries",
    },
    {
      code: smartColour("#55A51C", contrastColour),
      name: "Education and Social Work",
    },
    {
      code: smartColour("#4F2D7F", contrastColour),
      name: "Engineering",
    },
    {
      code: smartColour("#005B82", contrastColour),
      name: "Auckland Law School",
    },
    {
      code: smartColour("#00877C", contrastColour),
      name: "Medical Health Sciences",
    },
    {
      code: smartColour("#0039A6", contrastColour),
      name: "Science",
    },
    {
      code: smartColour("#BA4482", contrastColour),
      name: "Auckland Bioengineering Institute",
    },
    {
      code: smartColour("#006990", contrastColour),
      name: "Liggins Institute",
    },
    {
      code: smartColour("#ffffff", contrastColour),
      name: "White",
    },
    { code: undefined, name: "None" },
  ];

  const select = (c: Colord | undefined) => {
    colour = getColour(c);
    customColour = false;
  };

  let edit = false;

  let x = 0;
  let y = 0;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let container: HTMLDivElement;
  let popoverTarget: HTMLButtonElement;
  let popoverEl: HTMLDivElement;

  $: updateFunction = async () => {
    const position = await computePosition(popoverTarget, popoverEl, {
      placement: popupDirection,
      middleware: [
        offset(0),
        shift(),
        // flip(),
        offset(10),
      ],
    });
    x = position.x;
    y = position.y;
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

  onDestroy(() => {
    if (cleanup) cleanup();
  });

  let customColour = false;

  let customColourVal: string | undefined;
  $: if (!customColour) {
    customColourVal = colour?.toHex();
  } else if (customColourVal) {
    colour = colord(customColourVal);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="cgb-component">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
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
      class:white={colour && colour.isLight()}
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
              {#if !(option.code === undefined && contrastColour !== undefined && isText)}
                {@const inaccessible =
                  showAccessible &&
                  contrastColour &&
                  option.code &&
                  !option.code.isReadable(contrastColour, { level: "AAA" })}

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
                    aria-hidden="true"
                  />
                </label>
                <input
                  id={id + "-custom"}
                  type="text"
                  bind:value={customColourVal}
                  on:input={(e) => {
                    customColour = true;
                    return true;
                  }}
                />
              </div>
            </div>
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
  }
  .container,
  .colourPicker {
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
    @apply absolute top-0 left-0 p-4 z-10 box-content;
    @apply shadow-lg bg-white rounded;
    @apply grid gap-1;
    grid-template-columns: repeat(4, var(--size));
    grid-template-rows: repeat(auto-fill, var(--size)), auto;
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

  .colour-custom {
    @apply col-span-4 mt-1 pt-2 border-t-2 border-gray-300;
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
