<svelte:options accessors />

<script lang="ts">
  import Modal from "$lib/util/components/modalDialog/modal.svelte";
  import { createEventDispatcher } from "svelte";
  import Grid from "../../grid";

  export let queue: Grid[] = [];
</script>

{#if queue.length}
  <Modal
    title="Delete Grid{queue.length !== 1 ? 's' : ''}"
    show={true}
    on:save={() => {
      queue.forEach((grid) => {
        grid.delete();
      });
      queue = [];
    }}
    on:close={() => {
      queue = [];
    }}
  >
    {#if queue.length === 1}
      <p>Are you sure you want to delete this grid?</p>
    {:else}
      <p>Are you sure you want to delete all {queue.length} grids?</p>
    {/if}
  </Modal>
{/if}
