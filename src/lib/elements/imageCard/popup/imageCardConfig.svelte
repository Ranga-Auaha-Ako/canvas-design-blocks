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
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import LinkInput from "$lib/util/components/contentSearch/linkEditor/linkInput.svelte";
  import { persisted } from "svelte-persisted-store";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { colord } from "colord";

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
    ImageCardTheme.Dark
  );

  export const DefaultSize = persisted(
    "cdb-imageCardSize",
    ImageCardSize["5 Cols"]
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
      options: {
        editColor: true,
      },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    if (cardIndex === undefined) return;
    iconPicker.close();
    $rowData.cards[cardIndex].icon = {
      id: detail.icon.i,
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
  <div class="rowTheme"></div>
  <div class="cardPanel">
    <div class="ImageCard--rowSettings">
      <ButtonRadio
        fullWidth={true}
        title="Graphic Type"
        choices={[false, true]}
        labels={["Image", "Icon"]}
        bind:value={$rowData.usesIcon}
      />
      <ButtonRadio
        fullWidth={true}
        title="Row Layout"
        axis="vertical"
        choices={ValidSizes}
        labels={Object.keys(ImageCardSize)}
        bind:value={$rowData.size}
        on:change={() => {
          $DefaultSize = $rowData.size;
        }}
        let:index
      >
        <span class="icon-dot" style:--dot--size={index}></span>
        <span class="grow">{Object.keys(ImageCardSize)[index]}</span>
      </ButtonRadio>
      <ButtonRadio
        fullWidth={true}
        title="Row Theme"
        choices={ValidThemes}
        labels={Object.keys(ImageCardTheme)}
        bind:value={$rowData.theme}
        on:change={() => {
          $DefaultTheme = $rowData.theme;
        }}
      />
      <ButtonRadio
        fullWidth={true}
        title="Label Position"
        choices={[false, true]}
        labels={["Below", "Overlay"]}
        disabled={$rowData.usesIcon}
        bind:value={$rowData.labelOverlaid}
      />
    </div>
    <div class="ImageCard--elementContainer">
      <div class="ImageCard--elements">
        <button class="Button Button--small" on:click={() => addCard()}>
          <i class="icon-plus" aria-hidden="true" />
          Add Card</button
        >
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
      </div>
      <div class="ImageCard--elementConfig">
        {#if $localState && cardIndex !== undefined && cardIndex >= 0 && $rowData.cards[cardIndex]}
          {#key $localState.selectedCard}
            <div
              class="cardSettings"
              in:fade={{ duration: 300, delay: 100 }}
              out:fade={{ duration: 150 }}
            >
              <label for={`${imageCard.id}-text`}>Card Label:</label>
              <textarea
                class="cardName"
                id={`${imageCard.id}-text`}
                bind:value={$rowData.cards[cardIndex].label}
                rows="3"
                maxlength="100"
              />
              <div class="form-group">
                <p class="block text-sm my-0 mb-1">Card Link (URL):</p>
                <LinkInput
                  fullWidth={true}
                  link={$rowData.cards[cardIndex].link}
                  on:save={({ detail }) => {
                    if (cardIndex === undefined) return;
                    $rowData.cards[cardIndex].link = detail.link;
                  }}
                />
              </div>

              {#if $rowData.usesIcon}
                <div class="mt-2">
                  <button
                    class="Button Button--block"
                    on:click={() => {
                      iconPicker.open();
                    }}>Select Icon</button
                  >
                </div>
                <!-- Colour picker for icon -->
                {#if $rowData.cards[cardIndex].icon}
                  <div class="mt-2">
                    <ColourPicker
                      colour={colord(
                        $rowData.cards[cardIndex].icon?.color ?? ""
                      )}
                      on:select={({ detail: colour }) => {
                        const icon = $rowData.cards[cardIndex].icon;
                        if (cardIndex === undefined || !icon || !colour) return;
                        icon.color = colour.toHex();
                        $rowData.cards[cardIndex] = $rowData.cards[cardIndex];
                      }}
                      contrastColour={colord("#fff")}
                      label="Icon Colour"
                      showNone={false}
                    />
                  </div>
                {/if}
              {:else}
                <button
                  class="Button Button--block"
                  on:click={() => openPicker()}>Select Image</button
                >
              {/if}
            </div>
          {/key}
        {:else}
          <div class="config cardSettings">
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

    .cardName {
      @apply w-full border border-gray-300 rounded p-2;
    }
    .cardPanel {
      @apply flex flex-wrap gap-4 w-screen max-w-3xl;
      .ImageCard--rowSettings {
        h2 {
          @apply text-lg leading-none m-0;
        }
      }

      .ImageCard--elementContainer {
        @apply flex flex-1 shrink grow rounded overflow-clip border;
        .ImageCard--elements {
          @apply flex flex-col shadow-inner bg-gray-100 p-2 gap-2 shrink-0 col-span-1;
          .ImageCard--list {
            @apply overflow-y-auto overflow-x-clip p-1;
            max-width: 20ch;
            max-height: 20ch;
            margin: 0 -0.25rem;
          }
        }
        .ImageCard--elementConfig {
          @apply grid w-full flex-1 min-w-48 p-2;
          grid-template-areas: "cardSettings";
          .cardSettings {
            @apply overflow-auto;
            grid-area: cardSettings;
          }
        }
      }
    }

    .icon-dot {
      @apply w-4 h-4 rounded-full bg-primary;
      transform: scale(calc((var(--dot--size) + 1) / 6));
    }
  }
  :global(.active) > .icon-dot {
    @apply bg-white;
  }
</style>
