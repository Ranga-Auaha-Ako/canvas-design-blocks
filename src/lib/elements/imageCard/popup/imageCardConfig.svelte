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
  import { createEventDispatcher, onDestroy } from "svelte";
  import ImageSearch from "$lib/util/components/contentSearch/imageSearch/imageSearch.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { Writable } from "svelte/store";
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/util/components/iconSearch/iconPicker.svelte";
  import LinkInput from "$lib/util/components/contentSearch/linkEditor/linkInput.svelte";
  import { persisted } from "svelte-persisted-store";

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

  export const DefaultTheme = persisted(
    "cdb-imageCardTheme",
    ImageCardTheme.Overlay
  );

  export const DefaultSize = persisted(
    "cdb-imageCardSize",
    ImageCardSize["Grid-5"]
  );

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

  const iconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: true },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    if (cardIndex === undefined) return;
    iconPicker.close();
    $rowData.cards[cardIndex].icon = {
      id: detail.icon.id,
      color: detail.color,
      type: detail.type,
    };
  });
  onDestroy(() => {
    iconPicker.$destroy();
  });
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
      on:change={() => {
        $DefaultTheme = $rowData.theme;
      }}
    />
    <ButtonRadio
      title="Row Size"
      choices={ValidSizes}
      labels={Object.keys(ImageCardSize)}
      bind:value={$rowData.size}
      on:change={() => {
        $DefaultSize = $rowData.size;
      }}
    />
  </div>
  <div class="cardPanel">
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
    {#if $localState && cardIndex !== undefined && cardIndex >= 0 && $rowData.cards[cardIndex]}
      {#key $localState.selectedCard}
        <div
          class="cardSettings"
          in:fade={{ duration: 300, delay: 100 }}
          out:fade={{ duration: 150 }}
        >
          <div class="flex gap-x-2 items-baseline">
            <div class="grow">
              <label for={`${imageCard.id}-text`}>Card Label:</label>
              <textarea
                class="cardName"
                id={`${imageCard.id}-text`}
                bind:value={$rowData.cards[cardIndex].label}
                rows="3"
                maxlength="100"
              />
            </div>
            <div class="grow">
              <div class="form-group">
                <label class="block">Card Link (URL):</label>
                <LinkInput
                  link={$rowData.cards[cardIndex].link}
                  on:save={({ detail }) => {
                    if (cardIndex === undefined) return;
                    $rowData.cards[cardIndex].link = detail.link;
                  }}
                />
              </div>

              {#if $rowData.theme === ImageCardTheme.Icon}
                <button
                  class="Button Button--block"
                  on:click={() => {
                    iconPicker.open();
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
      {/key}
    {:else}
      <div class="config cardSettings">
        <p class="max-w-sm italic">
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
    }
    .cardName {
      @apply w-full border border-gray-300 rounded p-2;
    }
    .cardPanel {
      @apply grid gap-4;
      grid-template-columns: auto 1fr;
      grid-template-areas: "list config";
      .ImageCard--elements {
        grid-area: list;
      }
      .cardSettings {
        grid-area: config;
      }
    }
  }
</style>
