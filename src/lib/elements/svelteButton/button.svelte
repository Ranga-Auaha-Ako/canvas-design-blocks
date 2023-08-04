<script lang="ts">
  import { ButtonData } from "./button";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ButtonData;
</script>

<a class="Button {cdbData.theme} {cdbData.size}" href={cdbData.url}>
  {#if cdbData.icon}
    <span class="icon">
      <i class={cdbData.icon} />
    </span>
  {/if}
  <span class="text">{cdbData.label}</span>
</a>
