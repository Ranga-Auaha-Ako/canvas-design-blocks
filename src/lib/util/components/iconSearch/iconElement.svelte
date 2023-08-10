<script context="module" lang="ts">
  export interface IconState {
    url: string;
    class: string;
    type: IconType;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { IconType } from "./iconPicker";
  const dispatch = createEventDispatcher();

  export let icon: IconState;

  $: typeClass = icon.type == IconType.Solid ? "icon-Solid" : "icon-Line";
</script>

<span class="icon">
  <i
    class="{typeClass} icon-{icon.class}"
    style:--cdb-icon="url({icon.url})"
    data-mce-style=""
  />
</span>
