<script lang="ts">
  import {
    type Button,
    ValidThemes,
    ButtonTheme,
    ButtonSize,
    ValidSizes,
  } from "../button";
  import { fade, slide } from "svelte/transition";
  import ButtonRadio from "$lib/components/buttonRadio.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import ColourPicker from "$lib/components/colourPicker.svelte";
  import { colord } from "colord";
  import LinkInput from "$lib/components/contentSearch/linkEditor/linkInput.svelte";
  import { onDestroy } from "svelte";
  import writableDerived from "svelte-writable-derived";

  export let props: { button: Button };
  export let isModal: boolean = false;
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: button = props.button;
  $: buttonData = button.SvelteState;

  $: inGrid = props.button.node.closest(".cgb-col:not(.col-lg-12)") !== null;
  let configEl: HTMLElement;

  $: isNewTab = writableDerived(
    buttonData,
    ($buttonData) => {
      return $buttonData.target === "_blank";
    },
    (reflecting, $buttonData) => {
      if (!reflecting && $buttonData.target === "_blank") {
        $buttonData.target = "_self";
      }
      if (reflecting && $buttonData.target !== "_blank") {
        $buttonData.target = "_blank";
      }
      return $buttonData;
    }
  );

  const iconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: false },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    iconPicker.close();
    $buttonData.icon = {
      id: detail.icon.i,
      type: detail.type,
    };
  });
  onDestroy(() => {
    iconPicker.$destroy();
  });
  $: contrastLevel = $buttonData.color?.contrast(
    $buttonData.textColor || colord("#ffffff")
  );
  $: isReadable =
    contrastLevel === undefined || (contrastLevel && contrastLevel >= 7);
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
      button.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="grid grid-flow-col grid-cols-2 gap-4">
    <div class="col">
      <ButtonRadio
        title="Button Size"
        choices={ValidSizes}
        labels={Object.keys(ButtonSize)}
        bind:value={$buttonData.size}
      />
      <input
        type="text"
        bind:value={$buttonData.title}
        placeholder="Button Title..."
      />
      <input
        type="text"
        bind:value={$buttonData.label}
        placeholder="Button Label..."
      />
      <LinkInput
        link={$buttonData.url}
        text={$buttonData.label}
        on:save={({ detail }) => {
          $buttonData.url = detail.link;
          $buttonData.label = detail.text || "";
        }}
      />
    </div>
    <div class="col">
      <div>
        <ButtonRadio
          title="Text Colour"
          choices={[colord("#000"), colord("#fff")]}
          labels={["Dark", "Light"]}
          bind:value={$buttonData.textColor}
          comparator={(a, b) => a.toHex() === b.toHex()}
        />
      </div>
      <ColourPicker
        label="Button Colour"
        id={nanoid() + "-setting-background"}
        bind:colour={$buttonData.color}
        contrastColour={$buttonData?.textColor || colord("#ffffff")}
        showNone={false}
        asModal={isModal}
      />
      {#if !isReadable}
        <div class="colour-alert" transition:slide|global>
          <p class="alert-details">
            <span class="font-bold">Warning:</span> The text in this button may
            be hard to read for some students. {#if $buttonData.textColor?.isLight()}
              Consider using a darker colour to improve contrast against the
              light text.
            {:else}
              Consider using a lighter colour to improve contrast against the
              dark text.
            {/if}
          </p>
        </div>
      {/if}
      <div class="icon-picker-row">
        <button
                    class="btn btn-secondary px-4"
                    class:grow={!$buttonData.icon}
                    class:min-w-40={$buttonData.icon}
                on:click={() => {iconPicker.open();}}
        >
          Select Icon
        </button>
        {#if $buttonData.icon}
          <button
            class="btn btn-secondary aspect-square mt-0 grow-0"
            title="Remove icon"
            on:click={() => {$buttonData.icon = undefined;}}
          >
            <i class="cdb--icon" aria-hidden="true">Canvas.x</i>
          </button>
        {/if}
      </div>
      <!-- Select box for opening in new tab -->
      <label for="newTab" class="checkbox">
        <input type="checkbox" id="newTab" bind:checked={$isNewTab} />
        Open in new tab
      </label>
      <!-- Select box for full-width -->
      {#if inGrid}
        <label for="fullWidth" class="checkbox">
          <input
            type="checkbox"
            id="fullWidth"
            bind:checked={$buttonData.fullWidth}
          />
          Full Width
        </label>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded pt-6 p-2 shadow mb-2;
    @apply grid grid-cols-1 max-w-lg w-screen gap-4;
    & > .close {
      @apply absolute top-0 right-0 p-1 z-20;
      @apply opacity-100;
      line-height: 0;
      i {
        @apply text-gray-600;
        line-height: 0;
      }
    }
    .col {
      @apply flex flex-col gap-2;
    }
  }
  input[type="text"] {
    @apply border border-gray-300 rounded px-2 py-3 w-full mb-0;
    &:focus {
      @apply outline-none border-blue-500;
    }
  }
  .checkbox {
    @apply flex items-center gap-2;
    @apply text-gray-500;
    @apply cursor-pointer;
    @apply accent-primary;
    & input {
      @apply w-4 h-4;
    }
  }
  .colour-alert {
    @apply border-l-4 border-orange-300 bg-orange-100 text-orange-900 p-2 rounded transition text-xs;
    p {
      @apply m-0;
    }
  }
  .icon-picker-row {
    @apply flex flex-row gap-2;
  }
</style>
