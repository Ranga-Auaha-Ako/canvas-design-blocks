<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  const dispatch = createEventDispatcher<{ save: void; close: void }>();

  export const open = () => {
    dialog.showModal();
  };
  export const close = () => {
    dialog.close();
  };
  onDestroy(() => {
    dialog.close();
  });
  export let show: boolean = false;
  export let showSave: boolean | string = true;
  export let showCancel: boolean | string = true;
  export let showClose: boolean = false;
  export let size: "small" | "large" = "small";

  $: if (dialog) show ? dialog.showModal() : dialog.close();
  export let title: string = "";
  let dialog: HTMLDialogElement;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="cgb-component">
  <dialog
    class:size-large={size === "large"}
    bind:this={dialog}
    on:click|stopPropagation={(e) => {
      if (e.target === dialog) {
        dialog.close();
        dispatch("close");
      }
    }}
    on:keydown={(e) => {
      if (e.key === "Escape") {
        dispatch("close");
      }
    }}
  >
    <div class="dialogBody">
      <slot name="title">
        <div class="flex">
          {#if title}
            <h4 class="grow">
              {title}
            </h4>
          {:else}
            <div class="grow"></div>
          {/if}
          {#if showClose}
            <button
              class="text-xl mr-1"
              title="Close {title || 'Dialog'}"
              on:click={() => {
                dispatch("close");
                dialog.close();
              }}
            >
              <IconElement icon={{ id: "Inst.Line.x", type: IconType.Custom }}
              ></IconElement>
            </button>
          {/if}
        </div>
      </slot>
      <slot />

      <div class="actions">
        <slot name="actions">
          {#if showSave}
            <button
              on:click={() => {
                dispatch("save");
              }}
              class="Button Button--success save"
              >{showSave === true ? "Save" : showSave}</button
            >
          {/if}
          {#if showCancel}
            <button
              on:click={() => {
                dispatch("close");
                dialog.close();
              }}
              class="Button cancel"
              >{showCancel === true ? "Cancel" : showCancel}</button
            >
          {/if}
        </slot>
      </div>
    </div>
  </dialog>
</div>

<style lang="postcss">
  dialog {
    @apply p-0 rounded-lg shadow-lg w-full max-w-screen-md border-t-4 border-solid border-primary;
    .dialogBody {
      @apply p-4;
      @apply grid grid-cols-1 gap-4;
    }
    &::backdrop {
      @apply bg-black bg-opacity-50;
    }
    &.size-large {
      @apply max-w-screen-lg;
    }
  }
  .actions {
    @apply flex flex-row gap-2;
    justify-content: flex-end;
  }
</style>
