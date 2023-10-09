<script lang="ts">
  import { debounce } from "perfect-debounce";
  import IconPicker, {
    IconPickerOptions,
    IconType,
    icons,
    loadCustomIcons,
  } from "./iconPicker";
  import { createEventDispatcher } from "svelte";
  import { customIcon, instIcon } from "./canvas-icons/icons";
  import IconList from "./canvas-icons/iconList.svelte";
  import Modal from "../modalDialog/modal.svelte";

  const dispatch = createEventDispatcher<{
    selectIcon: {
      icon: instIcon | customIcon;
      color?: string;
      type: IconType;
    };
  }>();

  export let options: IconPickerOptions;
  let modal: Modal;
  export const open = () => modal.open();
  export const close = () => modal.close();
</script>

<Modal title="Choose an icon" showSave={false} bind:this={modal}>
  <div class="modal-wrap">
    {#await loadCustomIcons()}
      <IconList {icons} {options} on:selectIcon asModal={true} />
    {:then allIcons}
      <IconList icons={allIcons} {options} on:selectIcon asModal={true} />
    {/await}
  </div>
</Modal>
