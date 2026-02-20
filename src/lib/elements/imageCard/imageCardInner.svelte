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
  import { colord } from "colord";

  const dispatch = createEventDispatcher();

  export let cdbData: RowData;
  export let localState: Writable<LocalState>;
  export let destroyHandler: () => void;
  // svelte-ignore unused-export-let
  export let instance: any;

  onDestroy(() => {
    destroyHandler();
  });
  $: isSelected = $localState.isSelected;

  $: getContrastColor = (bgColor: string | undefined) => {
    if (!bgColor) return "#fff";
    return colord(bgColor).isDark() ? "#fff" : "#000";
  };
</script>

<div
  class="ImageCards--row {cdbData.theme} {cdbData.size}"
  class:ImageCards--usesIcons={cdbData.usesIcon}
  class:ImageCard--labelBelow={!cdbData.labelOverlaid}
>
  {#each cdbData.cards as card, index}
    {@const labelLines = card.label.split("\n")}
    <a
      href={card.link !== "#" ? card.link : `#card-${index+1}`}
      class="ImageCard"
      data-cdb-id={card.id}
      target={card.openInNewTab ? "_blank" : undefined}
      rel={card.openInNewTab ? "noopener noreferrer" : undefined}
      style:color={cdbData.theme === ImageCardTheme.Dark &&
      cdbData.usesIcon &&
      card.icon
        ? getContrastColor(card.icon.color)
        : undefined}
      style:background-color={cdbData.theme === ImageCardTheme.Dark &&
      cdbData.usesIcon &&
      card.icon
        ? card.icon.color
        : undefined}
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
      {#if cdbData.usesIcon}
        <span class="ImageCardIcon">
          {#if card.icon}
            <IconElement
              icon={card.icon}
              colorOverride={cdbData.theme === ImageCardTheme.Dark
                ? getContrastColor(card.icon?.color)
                : undefined}
            />
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
