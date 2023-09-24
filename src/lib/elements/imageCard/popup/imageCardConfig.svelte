<script lang="ts">
  import {
    RowData,
    ImageCardSize,
    ImageCardTheme,
    ValidSizes,
    ValidThemes,
    ImageCard,
    LocalState,
  } from "../imageCard";
  import { createEventDispatcher } from "svelte";
  import ImageSearch from "$lib/util/components/imageSearch/imageSearch.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { Writable } from "svelte/store";

  const dispatch = createEventDispatcher();

  export let props: {
    imageCard: ImageCard;
    localState: Writable<LocalState | undefined>;
  };

  $: imageCard = props.imageCard;
  $: rowData = imageCard.SvelteState;
  $: localState = props.localState;

  let configEl: HTMLElement;
  let urlInput: HTMLInputElement;

  const openPicker = () => {
    const picker = new ModalDialog(
      ImageSearch,
      imageCard.editor,
      {
        title: "Select Image",
        buttons: [
          {
            type: "cancel",
            text: "Cancel",
          },
        ],
      },
      {},
      imageCard
    );
    const pickerInst = picker.open();
    pickerInst.$on("selectImage", ({ detail: url }) => {
      if (!$localState) return;
      $rowData.cards[$localState.selectedCard].image = url;
      picker.close();
    });
  };

  const deleteCard = (cardId?: number) => {
    let id = cardId || $localState?.selectedCard;
    if (id === undefined) return;
    $rowData.cards.splice(id, 1);
    if ($localState) {
      if ($localState.selectedCard > 0) $localState.selectedCard--;
      else $localState.selectedCard = 0;
    }
    $rowData.cards = $rowData.cards;
  };
  const addCard = () => {
    $rowData.cards.push({
      label: "Insert Label Here",
      link: "#",
      image: "",
    });
    if ($localState) $localState.selectedCard = $rowData.cards.length - 1;
    $rowData.cards = $rowData.cards;
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <button
    class="close"
    title="Close"
    on:click={() => {
      imageCard.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="rowTheme">
    <ButtonRadio
      title="Row Theme"
      choices={ValidThemes}
      labels={Object.keys(ImageCardTheme)}
      bind:value={$rowData.theme}
    />
    <ButtonRadio
      title="Row Size"
      choices={ValidSizes}
      labels={Object.keys(ImageCardSize)}
      bind:value={$rowData.size}
    />
  </div>
  {#if $localState && $rowData.cards[$localState.selectedCard]}
    <div class="cardSettings">
      <div class="flex gap-x-2 items-baseline">
        <div>
          <label for={`${imageCard.id}-text`}>Card Label:</label>
          <textarea
            class="cardName"
            id={`${imageCard.id}-text`}
            bind:value={$rowData.cards[$localState.selectedCard].label}
            rows="3"
            maxlength="100"
          />
        </div>
        <div>
          <div class="form-group">
            <label class="block" for={`${imageCard.id}-url`}
              >Card Link (URL):</label
            >
            <input
              type="url"
              placeholder="https://canvas.auckland.ac.nz/..."
              id={`${imageCard.id}-url`}
              bind:value={$rowData.cards[$localState.selectedCard].link}
              on:input={() => urlInput.reportValidity()}
              bind:this={urlInput}
            />
          </div>

          <button class="Button Button--block" on:click={() => openPicker()}
            >Select Image</button
          >
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button class="Button Button--danger" on:click={() => deleteCard()}>
          <i class="icon-trash" aria-hidden="true" />
          Remove
        </button>
        <button class="Button" on:click={() => addCard()}>
          <i class="icon-plus" aria-hidden="true" />
          Add Card</button
        >
      </div>
    </div>
  {:else}
    <div class="cardSettings">
      <p>
        Select a card to edit its settings. You can add a new card by clicking
        the "Add Card" button.
      </p>
      <button class="Button" on:click={() => addCard()}>
        <i class="icon-plus" aria-hidden="true" />
        Add Card</button
      >
    </div>
  {/if}
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 pt-5 shadow mb-2;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
    & > .close {
      @apply absolute top-0 right-0 p-1 z-20;
      @apply opacity-100;
      line-height: 0;
      & > i {
        @apply text-gray-600;
        line-height: 0;
      }
    }
    .rowTheme {
      @apply flex gap-x-2 items-center;
      @apply mb-2;
    }

    input[type="url"] {
      @apply py-3;
    }
  }
  .cardName {
    @apply w-full border border-gray-300 rounded p-2;
  }
</style>
