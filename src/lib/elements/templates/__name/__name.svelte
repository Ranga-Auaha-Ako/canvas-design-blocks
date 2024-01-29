<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { __NameData } from "./__name";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: __NameData;
  // svelte-ignore unused-export-let
  export let localState: any;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
</script>

<div class="DesignBlocks--__Name {cdbData.theme}">
  <p contenteditable="false">Hi! I'm the interior of a new component.</p>
  <ul>
    <li>Title: {cdbData.title}</li>
    <li>
      <a href={cdbData.url}
        >Url: {cdbData.url} (Note: This is sanitized by pulling directly from the
        rendered sanitized DOM)</a
      >
    </li>
  </ul>
</div>
