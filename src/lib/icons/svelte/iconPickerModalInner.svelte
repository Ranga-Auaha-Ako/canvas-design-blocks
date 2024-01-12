<script lang="ts">
  import { debounce } from "perfect-debounce";
  import { IconPickerOptions, IconType, icon, icons } from "./iconPicker";
  import { createEventDispatcher } from "svelte";
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
  <IconList {icons} {options} on:selectIcon />
</div>
