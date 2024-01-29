<script lang="ts">
  import { Writable } from "svelte/store";
  import {
    ImageCardTheme,
    LocalState,
    RowData,
    ValidThemes,
  } from "./imageCard";
  import { createEventDispatcher, onDestroy } from "svelte";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: RowData;
  export let localState: Writable<LocalState>;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
  $: isSelected = $localState.isSelected;
</script>

<div class="ImageCards--row {cdbData.theme} {cdbData.size}">
  {#each cdbData.cards as card, index}
    {@const labelLines = card.label.split("\n")}
    <a
      href={card.link}
      class="ImageCard"
      data-cdb-id={card.id}
      data-mce-selected={$localState.selectedCard == card.id && isSelected
        ? "cbe"
        : undefined}
      on:pointerdown={() => {
        localState.update((state) => {
          return {
            ...state,
            selectedCard: card.id,
          };
        });
      }}
      on:keydown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          dispatch("toolbar", true);
          localState.update((state) => {
            return {
              ...state,
              selectedCard: card.id,
            };
          });
        }
      }}
    >
      {#if cdbData.theme === ImageCardTheme.Icon}
        <span class="ImageCardIcon">
          {#if card.icon}
            <IconElement icon={card.icon} />
          {/if}
        </span>
      {:else if card.image}
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
