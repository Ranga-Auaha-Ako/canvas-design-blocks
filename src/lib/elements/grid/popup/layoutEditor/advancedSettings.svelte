<script lang="ts">
  import Row from "$lib/elements/grid/row";
  import { get } from "svelte/store";
  import { nanoid } from "nanoid";
  import writableDerived from "svelte-writable-derived";
  import toPx from "to-px";
  import ColourPicker, {
    getColour,
    isReadable,
    Readability,
    ReadableLevel,
  } from "$lib/util/components/colourPicker.svelte";
  import ColSettings from "./advancedSettings/colSettings.svelte";
  import { colord } from "colord";
  import type { Colord } from "colord";
  import preventBubble from "$lib/util/preventBubble";

  export let row: Row;

  enum RowType {
    Normal = "normal",
    Card = "card",
  }

  $: columns = row.columns;

  $: style = row.style;
  $: classList = row.classList;

  $: preferences = writableDerived(
    [style, classList],
    ([$style, $classList]) => {
      const isCard =
        $classList.contains("uoa_shadowbox") &&
        $classList.contains("uoa_corners_4");
      return {
        padding: $style.padding ? toPx($style.padding) : 0,
        margin: $style.margin ? toPx($style.margin) : 0,
        background: getColour($style.background),
        textColor: getColour($style.color),
        card: isCard ? RowType.Card : RowType.Normal,
      };
    },
    {
      withOld(reflecting, [oldStyle, oldClassList]) {
        // Card effect
        if (reflecting.card === RowType.Normal) {
          if (oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "0";
          oldClassList.remove("uoa_shadowbox");
          oldClassList.remove("uoa_corners_4");
        } else if (reflecting.card === RowType.Card) {
          if (!oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "10px";
          oldClassList.add("uoa_shadowbox");
          oldClassList.add("uoa_corners_4");
        }
        if (oldStyle) {
          // Padding
          oldStyle.padding = `${reflecting.padding}px`;
          // Background
          oldStyle.background = reflecting.background?.toHex() || "";
          // Text Colour
          oldStyle.color = reflecting.textColor?.toHex() || "";
        }
        return [oldStyle, oldClassList];
      },
    }
  );

  let activeColumn = 0;

  $: contrastLevel = (
    $preferences.textColor && $preferences.background
      ? ReadableLevel($preferences.textColor, $preferences.background)
      : false
  ) as false | ReturnType<typeof ReadableLevel>;

  const ids = {
    padding: nanoid(),
    card: nanoid(),
    background: nanoid(),
    textcolor: nanoid(),
  };
</script>

<div class="cgb-component">
  <div class="advancedSettings" use:preventBubble>
    <h5>Row Settings</h5>
    <span class="label-text">Row Type</span>
    <div class="btn-group">
      <label class="btn" class:active={$preferences.card === RowType.Normal}>
        <span>Default</span>
        <input
          name={ids.card}
          type="radio"
          value="normal"
          bind:group={$preferences.card}
        />
      </label>
      <label class="btn" class:active={$preferences.card === RowType.Card}>
        <span>Card</span>
        <input
          name={ids.card}
          type="radio"
          value="card"
          bind:group={$preferences.card}
        />
      </label>
    </div>
    <label for={ids.padding}>
      <span class="label-text">Padding ({$preferences.padding}px)</span>
      <input
        id={ids.padding}
        type="range"
        min="0"
        max="20"
        bind:value={$preferences.padding}
      />
    </label>
    <!-- Warning if contrast is dangerously low -->
    {#if contrastLevel && contrastLevel.suitability !== Readability.BODY}
      <div class="card bg-orange-100">
        <p>
          <span class="font-bold">Warning:</span> The contrast between the
          background and text colours is
          {#if contrastLevel.suitability === Readability.LARGE}
            only suitable for bold text, large text or headers.
          {:else if contrastLevel.suitability === Readability.HEADER}
            only suitable for headers.
          {:else if contrastLevel.suitability === Readability.NONE}
            not suitable for any text.
          {:else}
            not definedHeaders.
          {/if}
        </p>
      </div>
    {/if}
    <ColourPicker
      label="Background Colour"
      id={ids.background}
      bind:colour={$preferences.background}
      bind:contrastColour={$preferences.textColor}
      isTextColour={false}
    />
    <ColourPicker
      label="Text Colour"
      id={ids.textcolor}
      bind:colour={$preferences.textColor}
      bind:contrastColour={$preferences.background}
      isTextColour={true}
    />
  </div>
</div>

<style lang="postcss">
  .advancedSettings {
    /* @apply columns-2; */
  }
  h5 {
    @apply w-full font-bold;
    &:after {
      @apply block w-16 bg-uni-blue;
      height: 3px;
      content: " ";
    }
  }
  .card {
    @apply p-4 shadow-md rounded;
    @apply flex flex-col gap-2;
    & .label-text {
      @apply font-bold text-uni-gray-500;
    }
  }
  label {
    @apply flex flex-col items-start gap-1;
    & input {
      @apply block;
      &[type="range"] {
        @apply w-full;
      }
    }
  }
  .input-group {
    @apply flex items-center gap-2;
  }
  input[type="color"] {
    @apply rounded border-none;
  }
  .btn {
    @apply flex items-center gap-2 px-2 py-1 bg-uni-blue text-white rounded border-none cursor-pointer;
  }
  .btn-group {
    @apply flex;
    & .btn {
      @apply bg-gray-200 text-black rounded-none;
      &.active {
        @apply bg-uni-blue text-white font-bold;
      }
      &:first-child {
        @apply rounded-l;
      }
      &:last-child {
        @apply rounded-r;
      }
      & input {
        @apply invisible absolute;
      }
    }
  }
</style>
