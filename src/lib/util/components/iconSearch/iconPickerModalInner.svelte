<script lang="ts">
  import { debounce } from "perfect-debounce";
  import IconPicker, {
    IconPickerOptions,
    IconType,
    loadCustomIcons,
  } from "./iconPicker";
  import { createEventDispatcher } from "svelte";
  import ColourPicker from "../colourPicker.svelte";
  import { nanoid } from "nanoid";
  import { colord } from "colord";
  import { persisted as localStorageWritable } from "svelte-local-storage-store";
  import {
    customCategory,
    customIcon,
    getIconClass,
    instCategory,
    instIcon,
    isCustomCategory,
    isInstCategory,
  } from "./canvas-icons/icons";
  import IconList from "./canvas-icons/iconList.svelte";

  const dispatch = createEventDispatcher<{
    selectIcon: {
      icon: instIcon | customIcon;
      color?: string;
      type: IconType;
    };
  }>();
  export let iconPicker: IconPicker;
  export let options: IconPickerOptions;
</script>

<div class="modal-wrap">
  {#await loadCustomIcons()}
    <IconList icons={iconPicker.choices} {options} on:selectIcon />
  {:then icons}
    <IconList {icons} {options} on:selectIcon />
  {/await}
</div>
