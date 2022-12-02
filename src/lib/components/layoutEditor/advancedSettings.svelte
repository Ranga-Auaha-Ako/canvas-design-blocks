<script lang="ts">
  import ColPicker from "./advancedSettings/colPicker.svelte";

  import Row from "$lib/grid/row";
  import { get } from "svelte/store";
  import { nanoid } from "nanoid";
  import writableDerived from "svelte-writable-derived";
  import toPx from "unit-to-px";

  export let row: Row;
  $: columns = row.columns;

  $: style = row._style;
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
        card: isCard,
      };
    },
    {
      withOld(reflecting, [oldStyle, oldClassList]) {
        // Card effect
        if (!reflecting.card) {
          if (oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "0";
          oldClassList.remove("uoa_shadowbox");
          oldClassList.remove("uoa_corners_4");
        } else {
          if (!oldClassList.contains("uoa_shadowbox")) oldStyle.margin = "10px";
          oldClassList.add("uoa_shadowbox");
          oldClassList.add("uoa_corners_4");
        }
        if (oldStyle) {
          // Padding
          oldStyle.padding = `${reflecting.padding}px`;
        }
        return [oldStyle, oldClassList];
      },
    }
  );

  let activeColumn = 0;

  const ids = {
    padding: nanoid(),
    card: nanoid(),
  };
</script>

<div class="advancedSettings">
  <h5>Advanced Settings</h5>
  <ColPicker {row} />
  <label for={ids.padding}>
    Padding ({$preferences.padding}px)
    <input
      id={ids.padding}
      type="range"
      min="0"
      max="20"
      bind:value={$preferences.padding}
    />
  </label>
  <label for={ids.card}>
    Show as card? ({$preferences.card})
    <input id={ids.card} type="checkbox" bind:checked={$preferences.card} />
  </label>
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
</style>
