<script lang="ts">
  import { Button } from "./button";

  export let button: Button;

  $: href = button.attributes.get("href");
  $: classList = button.classList;
  $: innerText = button.innerText;
</script>

<div class="cgb-component">
  <div
    class={$classList.toString() +
      " border border-[#c7cdd1] mock-button Button--block"}
  >
    {$innerText}
  </div>
  <p class="text-sm">
    You have selected a button! Very cool. I don't have any options to share
    with you yet, sorry. But know that I'm working on it :)
  </p>
  <!-- {#if $href !== undefined}
    <input type="text" id="buttonLinkConfig" bind:value={$href} />
  {/if} -->
</div>

<style lang="postcss">
  .mock-button {
    @apply truncate px-2;
    /* text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap; */
  }
</style>
