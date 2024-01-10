<script lang="ts">
  import { debounce } from "perfect-debounce";
  import {
    IconPickerOptions,
    IconType,
    icon,
    icons,
    loadCustomIcons,
  } from "./iconPicker";
  import { createEventDispatcher } from "svelte";
  import { customIcon, instIcon } from "./canvas-icons/icons";
  import IconList from "./canvas-icons/iconList.svelte";

  const dispatch = createEventDispatcher<{
    selectIcon: {
      icon: icon;
      color?: string;
      type: IconType.Custom;
    };
  }>();
  export let options: IconPickerOptions;
</script>

<div class="modal-wrap">
  {#await loadCustomIcons()}
    <IconList {icons} {options} on:selectIcon />
  {:then allIcons}
    <IconList icons={allIcons} {options} on:selectIcon />
  {/await}
</div>
