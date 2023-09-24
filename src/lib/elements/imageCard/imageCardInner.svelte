<script lang="ts">
  import { Writable } from "svelte/store";
  import { LocalState, RowData } from "./imageCard";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: RowData;
  export let localState: Writable<LocalState> | undefined = undefined;
  $: isSelected = localState ? $localState?.isSelected : undefined;
</script>

<div class="ImageCards--row {cdbData.theme} {cdbData.size}">
  {#each cdbData.cards as card, index}
    <a
      href={card.link}
      class="ImageCard"
      data-mce-selected={$localState?.selectedCard == index && isSelected
        ? "cbe"
        : undefined}
      on:click|preventDefault={() => {
        localState?.update((state) => {
          return {
            ...state,
            selectedCard: index,
          };
        });
      }}
    >
      {#if card.image}
        <img
          class="ImageCardImage"
          src={card.image}
          alt=""
          role="presentation"
        />
      {/if}
      <span class="ImageCardLabel">
        {card.label}
      </span>
    </a>
  {/each}
</div>
{JSON.stringify($localState)}
