<script lang="ts">
  import writableDerived from "svelte-writable-derived";
  import type { Writable } from "svelte/store";
  import type { ImageCard } from "../imageCard";
  import ImageSearch from "$lib/util/components/imageSearch/imageSearch.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";

  export let props: { imageCard: ImageCard };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: imageCard = props.imageCard;
  $: innerText = imageCard.childLabel.innerText;
  let configEl: HTMLElement;

  const openPicker = () => () => {
    const picker = new ModalDialog(
      ImageSearch,
      imageCard.editor,
      {
        title: "Select Image",
        buttons: [],
      },
      {}
    );
    const pickerInst = picker.open();
    // const picker = new ImageSearch({
    //   target: document.body,
    // });
    pickerInst.$on("selectImage", ({ detail }) => {
      imageCard.setImage(detail);
      picker.close();
    });
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div bind:this={configEl} class="cgb-component">
  <p>Image Card Text:</p>
  <textarea
    class="cardName"
    id={`${imageCard.id}-text`}
    bind:value={$innerText}
    rows="3"
  />

  <p>Image Card Image:</p>
  <button class="Button" on:click={openPicker()}>Select Image</button>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow;
  }
  .cardName {
    @apply w-full border border-gray-300 rounded p-2;
  }
</style>
