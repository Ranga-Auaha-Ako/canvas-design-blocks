<script lang="ts">
  import Row from "$lib/elements/grid/row";
  import { nanoid } from "nanoid";
  import writableDerived from "svelte-writable-derived";
  import toPx from "to-px";
  import { getColour } from "$lib/util/components/colourPicker.svelte";
  import ColourSettings from "$lib/util/components/colourSettings.svelte";
  import preventBubble from "$lib/util/preventBubble";

  export let row: Row;

  enum RowType {
    Normal = "normal",
    Card = "card",
  }

  $: columns = row.columns;

  $: style = row.style;
  $: classList = row.classList;

  let manualAdjustMargin: boolean | undefined,
    manualAdjustPadding: boolean | undefined;
  $: manualAdjustMargin = undefined;
  $: manualAdjustPadding = undefined;

  $: preferences = writableDerived(
    [style, classList],
    ([$style, $classList]) => {
      // Margin
      let margin: number | [number, number, number, number];
      if ($style.margin && !manualAdjustMargin) {
        margin = toPx($style.marginTop) || 0;
      } else if (manualAdjustMargin) {
        margin = [
          $style.marginTop,
          $style.marginRight,
          $style.marginBottom,
          $style.marginLeft,
        ].map((m) => toPx(m) || 0) as [number, number, number, number];
      } else {
        margin = 0;
      }
      // Padding
      let padding: number | [number, number, number, number];
      if ($style.padding && !manualAdjustPadding) {
        padding = toPx($style.paddingTop) || 0;
      } else if (manualAdjustPadding) {
        padding = [
          $style.paddingTop,
          $style.paddingRight,
          $style.paddingBottom,
          $style.paddingLeft,
        ].map((m) => toPx(m) || 0) as [number, number, number, number];
      } else {
        padding = 0;
      }
      // Card
      const isCard =
        $classList.contains("uoa_shadowbox") &&
        $classList.contains("uoa_corners_4");
      return {
        padding: padding,
        margin: margin,
        background: getColour($style.background),
        textColor: getColour($style.color),
        card: isCard ? RowType.Card : RowType.Normal,
      };
    },
    {
      withOld(reflecting, [oldStyle, oldClassList]) {
        // Card effect
        if (reflecting.card === RowType.Normal) {
          if (oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "";
          oldClassList.remove("uoa_shadowbox");
          oldClassList.remove("uoa_corners_4");
        } else if (reflecting.card === RowType.Card) {
          if (!oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "10px";
          oldClassList.add("uoa_shadowbox");
          oldClassList.add("uoa_corners_4");
        }
        if (oldStyle) {
          // Padding
          if (typeof reflecting.padding === "number")
            oldStyle.padding = `${reflecting.padding}px`;
          else if (Array.isArray(reflecting.padding))
            oldStyle.padding = reflecting.padding
              .map((p) => `${p}px`)
              .join(" ");
          // Margin
          if (typeof reflecting.margin === "number")
            oldStyle.margin = `${reflecting.margin}px`;
          else if (Array.isArray(reflecting.margin))
            oldStyle.margin = reflecting.margin.map((m) => `${m}px`).join(" ");
          // Background
          oldStyle.background = reflecting.background?.toHex() || "";
          // Text Colour
          oldStyle.color = reflecting.textColor?.toHex() || "";
        }
        return [oldStyle, oldClassList];
      },
    }
  );

  const ids = {
    padding: nanoid(),
    margin: nanoid(),
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
    <!-- Checkbox for individually adjusting padding -->
    <label class="checkbox">
      <input
        type="checkbox"
        bind:checked={manualAdjustPadding}
        class="checkbox-input"
      />
      <span class="checkbox-label">Manual Adjust Padding</span>
    </label>
    {#if !manualAdjustPadding && typeof $preferences.padding === "number"}
      <label for={ids.padding}>
        <span class="label-text"
          >Padding ({Math.round($preferences.padding || 0)}px)</span
        >
        <input
          id={ids.padding}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.padding}
        />
      </label>
    {:else if typeof $preferences.padding !== "number"}
      <label for={ids.padding + "-top"}>
        <span class="label-text"
          >Padding Top ({Math.round($preferences.padding[0] || 0)}px)</span
        >
        <input
          id={ids.padding + "-top"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.padding[0]}
        />
      </label>
      <label for={ids.padding + "-right"}>
        <span class="label-text"
          >Padding Right ({Math.round($preferences.padding[1] || 0)}px)</span
        >
        <input
          id={ids.padding + "-right"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.padding[1]}
        />
      </label>
      <label for={ids.padding + "-bottom"}>
        <span class="label-text"
          >Padding Bottom ({Math.round($preferences.padding[2] || 0)}px)</span
        >
        <input
          id={ids.padding + "-bottom"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.padding[2]}
        />
      </label>
      <label for={ids.padding + "-left"}>
        <span class="label-text"
          >Padding Left ({Math.round($preferences.padding[3] || 0)}px)</span
        >
        <input
          id={ids.padding + "-left"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.padding[3]}
        />
      </label>
    {/if}
    <!-- Checkbox for individually adjusting margin -->
    <label class="checkbox">
      <input
        type="checkbox"
        bind:checked={manualAdjustMargin}
        class="checkbox-input"
      />
      <span class="checkbox-label">Manual Adjust Margin</span>
    </label>
    {#if !manualAdjustMargin}
      <label for={ids.margin}>
        <span class="label-text"
          >Margin ({Math.round($preferences.margin || 0)}px)</span
        >
        <input
          id={ids.margin}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.margin}
        />
      </label>
    {:else if typeof $preferences.margin !== "number"}
      <label for={ids.margin + "-top"}>
        <span class="label-text"
          >Margin Top ({Math.round($preferences.margin[0] || 0)}px)</span
        >
        <input
          id={ids.margin + "-top"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.margin[0]}
        />
      </label>
      <label for={ids.margin + "-right"}>
        <span class="label-text"
          >Margin Right ({Math.round($preferences.margin[1] || 0)}px)</span
        >
        <input
          id={ids.margin + "-right"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.margin[1]}
        />
      </label>
      <label for={ids.margin + "-bottom"}>
        <span class="label-text"
          >Margin Bottom ({Math.round($preferences.margin[2] || 0)}px)</span
        >
        <input
          id={ids.margin + "-bottom"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.margin[2]}
        />
      </label>
      <label for={ids.margin + "-left"}>
        <span class="label-text"
          >Margin Left ({Math.round($preferences.margin[3] || 0)}px)</span
        >
        <input
          id={ids.margin + "-left"}
          type="range"
          min="0"
          max="20"
          bind:value={$preferences.margin[3]}
        />
      </label>
    {/if}
    <ColourSettings element={row} {preferences} />
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
  /* .input-group {
    @apply flex items-center gap-2;
  }
  input[type="color"] {
    @apply rounded border-none;
  } */
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
