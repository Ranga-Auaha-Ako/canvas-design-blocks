<svelte:options accessors />

<script lang="ts">
  import Modal from "$lib/components/modalDialog/modal.svelte";
  import { createEventDispatcher } from "svelte";
  import Grid from "../../grid";

  export let queue: Grid[] = [];
</script>

{#if queue.length}
  <Modal
    title="Delete Grid{queue.length !== 1 ? 's' : ''}"
    show={true}
    on:close={() => {
      queue = [];
    }}
  >
    {#if queue.length === 1}
      <p>Are you sure you want to delete this grid?</p>
    {:else}
      <p>Are you sure you want to delete all {queue.length} grids?</p>
    {/if}
    <svelte:fragment slot="actions">
      <button
        on:click={() => {
          queue = [];
        }}
        class="Button">Cancel</button
      >
      <button
        on:click={() => {
          queue.forEach((grid) => {
            grid.delete();
          });
          queue = [];
        }}
        class="Button Button--danger save">I'm sure: Delete this</button
      >
    </svelte:fragment>
  </Modal>
{/if}
