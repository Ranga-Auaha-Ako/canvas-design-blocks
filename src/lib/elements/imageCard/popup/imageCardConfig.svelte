<script lang="ts">
  import writableDerived from "svelte-writable-derived";
  import type { Writable } from "svelte/store";
  import type { ImageCard } from "../imageCard";
  import ImageSearch from "$lib/util/components/imageSearch/imageSearch.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import { fade } from "svelte/transition";

  export let props: { imageCard: ImageCard };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: imageCard = props.imageCard;
  $: innerText = imageCard.childLabel.innerText;
  $: cardLink = imageCard.attributes.get("href") as
    | Writable<string>
    | undefined;
  let configEl: HTMLElement;

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
      {}
    );
    const pickerInst = picker.open();
    pickerInst.$on("selectImage", ({ detail }) => {
      imageCard.setImage(detail);
      picker.close();
    });
  };

  const deleteCard = () => {
    imageCard.delete();
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <div>
    <label for={`${imageCard.id}-text`}>Card Label:</label>
    <textarea
      class="cardName"
      id={`${imageCard.id}-text`}
      bind:value={$innerText}
      rows="3"
      maxlength="100"
    />
  </div>
  <div>
    <div class="form-group">
      <label class="block" for={`${imageCard.id}-url`}>Card Link (URL):</label>
      <input
        type="url"
        placeholder="https://canvas.auckland.ac.nz/..."
        id={`${imageCard.id}-url`}
        bind:value={$cardLink}
      />
    </div>

    <button class="Button" on:click={() => openPicker()}>Select Image</button>
    <button class="Button Button--danger" on:click={() => deleteCard()}
      >Remove</button
    >
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow mb-2;
    @apply flex gap-x-2;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }

    input[type="url"] {
      @apply py-3;
    }
  }
  .cardName {
    @apply w-full border border-gray-300 rounded p-2;
  }
</style>
