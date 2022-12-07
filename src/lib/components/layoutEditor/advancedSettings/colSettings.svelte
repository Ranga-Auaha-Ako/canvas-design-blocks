<script lang="ts">
  import Row from "$lib/grid/row";
  import { get } from "svelte/store";
  import { nanoid } from "nanoid";
  import writableDerived from "svelte-writable-derived";
  import toPx from "unit-to-px";
  import ColourPicker from "./colourPicker.svelte";
  import Column from "$lib/grid/column";

  export let column: Column;
  export let index: number;

  const rgb2hex = (rgb: string) => {
    const vals = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!vals) return undefined;
    return `#${vals
      .slice(1)
      .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
      .join("")}`;
  };

  enum ColType {
    Normal = "normal",
    Card = "card",
  }

  $: style = column._style;
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
        background: rgb2hex($style.background),
        textColor: rgb2hex($style.color),
        card: isCard ? ColType.Card : ColType.Normal,
      };
    },
    {
      withOld(reflecting, [oldStyle, oldClassList]) {
        // Card effect
        if (reflecting.card === ColType.Normal) {
          // if (oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "0";
          oldClassList.remove("uoa_shadowbox");
          oldClassList.remove("uoa_corners_4");
        } else if (reflecting.card === ColType.Card) {
          // if (!oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "10px";
          oldClassList.add("uoa_shadowbox");
          oldClassList.add("uoa_corners_4");
        }
        if (oldStyle) {
          // Padding
          oldStyle.padding = `${reflecting.padding}px`;
          // Background
          oldStyle.background = reflecting.background || "";
          // Text Colour
          oldStyle.color = reflecting.textColor || "";
        }
        return [oldStyle, oldClassList];
      },
    }
  );
</script>

<div class="card">
  <h5>Column {index + 1}</h5>
  <span class="label-text">Row Type</span>
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
  <ColourPicker
    label="Background Colour"
    id={column.id + "-bg-col"}
    bind:colour={$preferences.background}
  />
  <ColourPicker
    label="Text Colour"
    id={column.id + "-text-col"}
    bind:colour={$preferences.textColor}
  />
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
    @apply p-4 m-2 shadow-md rounded bg-white;
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
