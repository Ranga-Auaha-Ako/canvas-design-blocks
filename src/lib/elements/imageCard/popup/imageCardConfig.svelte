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
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/util/components/iconSearch/iconPicker";

  const dispatch = createEventDispatcher();

  export let props: {
    imageCard: ImageCard;
    localState: Writable<LocalState | undefined>;
  };

  $: imageCard = props.imageCard;
  $: rowData = imageCard.SvelteState;
  $: localState = props.localState;
  $: cardIndex =
    $localState && ImageCard.getCardIndex($rowData, $localState.selectedCard);
  $: currentCard =
    cardIndex !== undefined ? $rowData.cards[cardIndex] : undefined;

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
      const index = ImageCard.getCardIndex($rowData, $localState.selectedCard);
      $rowData.cards[index].image = url;
      picker.close();
    });
  };
  const addCard = () => {
    $rowData.cards.push({
      label: "Insert Label Here",
      link: "#",
      image: "",
      id: nanoid(),
    });
    if ($localState)
      $localState.selectedCard = $rowData.cards[$rowData.cards.length - 1].id;
    $rowData.cards = $rowData.cards;
  };
  // https://stackoverflow.com/a/52323412/3902950
  const shallowCompare = (obj1: Record<any, any>, obj2: Record<any, any>) =>
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every((key) => obj1[key] === obj2[key]);

  let iconPicker: IconPicker;
  $: if (currentCard) {
    iconPicker = new IconPicker(imageCard.editor, currentCard.icon, imageCard, {
      editColor: true,
    });
    iconPicker.subscribe((icon) => {
      console.log(icon, currentCard?.icon);
      if (
        currentCard &&
        currentCard?.icon &&
        icon &&
        !shallowCompare(currentCard.icon, icon)
      ) {
        currentCard.icon = icon;
        $rowData = $rowData;
      } else if (
        currentCard &&
        ((currentCard?.icon && !icon) || (!currentCard?.icon && icon))
      ) {
        currentCard.icon = icon;
        $rowData = $rowData;
      }
    });
  }
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
  <div class="flex gap-4">
    <div class="ImageCard--elements">
      <div class="ImageCard--list">
        <OrderableList
          labelKey="label"
          idKey="id"
          bind:items={$rowData.cards}
          on:edit={({ detail: id }) => {
            if ($localState) $localState.selectedCard = id;
          }}
          on:delete={({ detail: id }) => {
            const index = ImageCard.getCardIndex($rowData, id);
            if ($localState && $localState.selectedCard === id) {
              if (index > 0)
                $localState.selectedCard = $rowData.cards[index - 1].id;
              else $localState.selectedCard = $rowData.cards[0].id;
            }
          }}
          showEdit={true}
          canDelete={$rowData.cards.length > 1}
          activeClass="ImageCard--active"
          activeId={$localState?.selectedCard}
        />
      </div>
      <button class="Button Button--small" on:click={() => addCard()}>
        <i class="icon-plus" aria-hidden="true" />
        Add Card</button
      >
    </div>
    <div class="config flex-grow">
      {#if $localState && cardIndex !== undefined && cardIndex >= 0 && $rowData.cards[cardIndex]}
        <div class="cardSettings">
          <div class="flex gap-x-2 items-baseline">
            <div>
              <label for={`${imageCard.id}-text`}>Card Label:</label>
              <textarea
                class="cardName"
                id={`${imageCard.id}-text`}
                bind:value={$rowData.cards[cardIndex].label}
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
                  bind:value={$rowData.cards[cardIndex].link}
                  on:input={() => urlInput.reportValidity()}
                  bind:this={urlInput}
                />
              </div>

              {#if $rowData.theme === ImageCardTheme.Icon}
                <button
                  class="Button Button--block"
                  on:click={() => {
                    iconPicker.pick();
                  }}>Select Icon</button
                >
              {:else}
                <button
                  class="Button Button--block"
                  on:click={() => openPicker()}>Select Image</button
                >
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="cardSettings">
          <p class="max-w-sm italic">
            Select a card to edit its settings. You can add a new card by
            clicking the "Add Card" button.
          </p>
          <button class="Button" on:click={() => addCard()}>
            <i class="icon-plus" aria-hidden="true" />
            Add Card</button
          >
        </div>
      {/if}
    </div>
  </div>
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

    .ImageCard--elements {
      @apply flex flex-col rounded shadow-inner bg-gray-100 p-2 gap-4;
    }

    .ImageCard--list {
      max-width: 20ch;
      max-height: 20ch;
      @apply overflow-y-auto overflow-x-clip p-1;
      margin: 0 -0.25rem;
      & :global(.ImageCard--active) {
        @apply bg-primary text-white rounded;
        padding: 0.25rem;
        margin: -0.25rem 0;
      }
    }
  }
  .cardName {
    @apply w-full border border-gray-300 rounded p-2;
  }
</style>
