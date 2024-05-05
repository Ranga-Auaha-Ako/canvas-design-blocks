<script lang="ts">
  import { debounce } from "perfect-debounce";
  import { IconPickerOptions, IconType, type icon, icons } from "./iconPicker";
  import { createEventDispatcher } from "svelte";
  import { customIcon, instIcon } from "./canvas-icons/icons";
  import IconList from "./canvas-icons/iconList.svelte";
  import Modal from "$lib/util/components/modalDialog/modal.svelte";

  const dispatch = createEventDispatcher<{
    selectIcon: {
      icon: icon;
      color?: string;
      type: IconType.Custom;
    };
  }>();

  export let options: IconPickerOptions;
  export let targetNode: HTMLElement | undefined = undefined;
  export let contrastColor: string | undefined = undefined;
  let modal: Modal;
  export const open = () => modal.open();
  export const close = () => modal.close();
</script>

<Modal title="Choose an icon" showSave={false} bind:this={modal}>
  <div class="modal-wrap">
    {#await icons}
      <!-- Loading -->
    {:then allIcons}
      <IconList
        {targetNode}
        {contrastColor}
        icons={allIcons}
        {options}
        on:selectIcon
        asModal={true}
      />
    {/await}
  </div>
</Modal>
