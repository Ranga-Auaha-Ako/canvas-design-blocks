<script lang="ts">
  import Row from "$lib/elements/grid/row";
  import { Writable, get } from "svelte/store";
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
  $: innerStyle = column.attributes.get(
    "innerNode/style"
  ) as Writable<CSSStyleDeclaration>;
  $: innerClassList = column.attributes.get(
    "innerNode/class"
  ) as Writable<DOMTokenList>;

  $: preferences = writableDerived(
    [style, classList, innerStyle, innerClassList],
    ([$style, $classList, $innerStyle, $innerClassList]) => {
      const isCard =
        $innerClassList.contains("uoa_shadowbox") &&
        $innerClassList.contains("uoa_corners_4");
      return {
        padding:
          $innerStyle.padding && (toPx($innerStyle.padding) || 0) > 0
            ? Math.round(toPx($innerStyle.padding) || 0)
            : 0,
        margin: $innerStyle.margin ? toPx($innerStyle.margin) : 0,
        background: getColour($innerStyle.background),
        textColor: getColour($innerStyle.color),
        card: isCard ? ColType.Card : ColType.Normal,
      };
    },
    (
      reflecting,
      [oldStyle, oldClassList, oldInnerStyle, oldInnerClassList]
    ) => {
      // Height
      if (!oldInnerStyle.height) oldInnerStyle.height = "100%";
      // Card effect
      if (reflecting.card === ColType.Normal) {
        // if (oldInnerClassList.contains("uoa_shadowbox")) oldStyle.margin = "0";
        oldInnerClassList.remove("uoa_shadowbox");
        oldInnerClassList.remove("uoa_corners_4");
      } else if (reflecting.card === ColType.Card) {
        if (
          !oldInnerClassList.contains("uoa_shadowbox") &&
          reflecting.padding < 1
        )
          reflecting.padding = 10;
        oldInnerClassList.add("uoa_shadowbox");
        oldInnerClassList.add("uoa_corners_4");
        oldInnerStyle.display = "flow-root";
      }
      if (oldInnerStyle) {
        // Padding
        oldInnerStyle.padding = `${reflecting.padding}px`;
        oldInnerStyle.margin = `${reflecting.margin}px`;
        // Background
        oldInnerStyle.background = reflecting.background?.toHex() || "";
        // Text Colour
        oldInnerStyle.color = reflecting.textColor?.toHex() || "";
      }
      return [oldStyle, oldClassList, oldInnerStyle, oldInnerClassList] as [
        typeof oldStyle,
        typeof oldClassList,
        typeof oldInnerStyle,
        typeof oldInnerClassList
      ];
    }
  );

  $: editorContainer = column.editor.getContainer();
  let editorWidth = "50vw";
  let windowWidth = 0;
  let offsetLeft = "0px";
  let popupEl: HTMLDivElement;

  $: if (editorContainer && windowWidth) {
    editorWidth = `${editorContainer.offsetWidth}px`;
    offsetLeft = `${
      (popupEl.offsetParent?.getBoundingClientRect().x || 0) * -1 +
      editorContainer.getBoundingClientRect().x
    }px`;
  }
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="cgb-component">
  <div
    class="card"
    style:--editor-width={editorWidth}
    style:--offset-left={offsetLeft}
    bind:this={popupEl}
  >
    <h5>Column Settings</h5>
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
    <!-- Padding -->
    <label for={column.id + "-pad"}>
      <span class="label-text"
        >Padding ({Math.round($preferences.padding || 0)}px)</span
      >
      <input
        id={column.id + "-pad"}
        type="range"
        min="0"
        max="20"
        bind:value={$preferences.padding}
      />
    </label>
    <!-- Margin -->
    <label for={column.id + "-margin"}>
      <span class="label-text"
        >Margin ({Math.round($preferences.margin || 0)}px)</span
      >
      <input
        id={column.id + "-margin"}
        type="range"
        min="0"
        max="20"
        bind:value={$preferences.margin}
      />
      <ColourSettings element={column} {preferences} popupDirection="top" />
    </label>
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
    @apply p-4 mt-2 shadow-md rounded-lg border-uni-blue-light border-2 bg-white w-screen;
    @apply flex flex-col gap-2;
    @apply absolute;
    max-width: var(--editor-width);
    left: var(--offset-left);
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
