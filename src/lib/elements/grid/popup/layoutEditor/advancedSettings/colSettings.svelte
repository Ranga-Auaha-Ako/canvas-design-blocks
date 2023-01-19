<script lang="ts">
  import Row from "$lib/elements/grid/row";
  import { get, Writable } from "svelte/store";
  import { nanoid } from "nanoid";
  import writableDerived from "svelte-writable-derived";
  import toPx from "to-px";
  import ColourPicker, {
    getColour,
  } from "$lib/util/components/colourPicker.svelte";
  import Column from "$lib/elements/grid/column";
  import ColourSettings from "$lib/util/components/colourSettings.svelte";

  export let column: Column;

  enum ColType {
    Normal = "normal",
    Card = "card",
  }

  $: style = column.style;
  $: classList = column.classList;

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
        card: isCard ? ColType.Card : ColType.Normal,
      };
    },
    {
      withOld(reflecting, [oldStyle, oldClassList]) {
        // Card effect
        if (reflecting.card === ColType.Normal) {
          if (
            oldClassList.contains("uoa_shadowbox") &&
            oldStyle.margin === "10px"
          )
            reflecting.margin = 0;
          oldClassList.remove("uoa_shadowbox");
          oldClassList.remove("uoa_corners_4");
        } else if (reflecting.card === ColType.Card) {
          if (
            !oldClassList.contains("uoa_shadowbox") &&
            oldStyle.margin === "0px"
          )
            reflecting.margin = 10;
          oldClassList.add("uoa_shadowbox");
          oldClassList.add("uoa_corners_4");
        }
        if (oldStyle) {
          // Padding
          oldStyle.padding = `${reflecting.padding}px`;
          // Margin
          oldStyle.margin = `${reflecting.margin}px`;
          // Background
          oldStyle.background = reflecting.background?.toHex() || "";
          // Text Colour
          oldStyle.color = reflecting.textColor?.toHex() || "";
        }
        return [oldStyle, oldClassList];
      },
    }
  );
</script>

<div class="cgb-component">
  <div class="card">
    <h5>Column Settings</h5>
    {$style.margin}
    <span class="label-text">Column Type</span>
    <div class="btn-group">
      <label class="btn" class:active={$preferences.card === ColType.Normal}>
        <span>Default</span>
        <input
          name={column.id + "-card"}
          type="radio"
          value="normal"
          bind:group={$preferences.card}
        />
      </label>
      <label class="btn" class:active={$preferences.card === ColType.Card}>
        <span>Card</span>
        <input
          name={column.id + "-card"}
          type="radio"
          value="card"
          bind:group={$preferences.card}
        />
      </label>
    </div>
    <label for={column.id + "-pad"}>
      <span class="label-text">Padding ({$preferences.padding}px)</span>
      <input
        id={column.id + "-pad"}
        type="range"
        min="0"
        max="20"
        bind:value={$preferences.padding}
      />
    </label>
    <label for={column.id + "-margin"}>
      <span class="label-text">Margin ({$preferences.margin}px)</span>
      <input
        id={column.id + "-margin"}
        type="range"
        min="0"
        max="20"
        bind:value={$preferences.margin}
      />
    </label>
    <ColourSettings element={column} {preferences} popupDirection="top" />
  </div>
</div>

<style lang="postcss">
  h5 {
    @apply w-full font-bold;
    &:after {
      @apply block w-16 bg-uni-blue;
      height: 3px;
      content: " ";
    }
  }
  .card {
    @apply p-4 mt-2 shadow-md rounded-lg border-uni-blue-light border-2 bg-white w-screen max-w-sm;
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
