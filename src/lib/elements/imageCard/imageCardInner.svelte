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
    {@const labelLines = card.label.split("\n")}
    <a
      href={card.link}
      class="ImageCard"
      data-mce-selected={$localState?.selectedCard == card.id && isSelected
        ? "cbe"
        : undefined}
      on:click|preventDefault={() => {
        localState?.update((state) => {
          return {
            ...state,
            selectedCard: card.id,
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
        {#each labelLines as line, index}
          <span class="ImageCardLabelLine">{line}</span>
          {#if index < labelLines.length - 1}
            <br />
          {/if}
        {/each}
      </span>
    </a>
  {/each}
</div>
