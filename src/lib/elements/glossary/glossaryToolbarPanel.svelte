<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import { courseEnv, getCoursePermissions } from "$lib/util/courseEnv";
  import { onMount } from "svelte";
  import glossaryClientManager, {
    PAGE_CREATED,
    PAGE_URL,
  } from "./glossaryClientManager";
  import Modal from "$lib/util/components/modalDialog/modal.svelte";
  import GlossaryEditor from "./glossaryEditor.svelte";
  import Portal from "$lib/portal/portal.svelte";

  let openModal: () => void;
  let closeModal: () => void;
  let loadEditor = false;

  let CAN_EDIT = false;
  onMount(async () => {
    const permissions = await getCoursePermissions();
    CAN_EDIT = permissions.manage_wiki_create && permissions.manage_wiki_update;
  });
</script>

{#if CAN_EDIT}
  <Portal>
    <Modal
      showSave={false}
      showCancel={false}
      showClose={true}
      bind:open={openModal}
      bind:close={closeModal}
    >
      {#if loadEditor}
        {#await glossaryClientManager.loadData() then}
          <GlossaryEditor
            glossaryData={{
              terms: glossaryClientManager.terms,
              institutionDefaults: glossaryClientManager.institutionDefaults,
            }}
            manager={glossaryClientManager}
            frameless={true}
          />
        {/await}
      {/if}
    </Modal>
  </Portal>
  <ElementPanel
    title="Edit Glossary"
    on:add={async () => {
      loadEditor = true;
      openModal();
      // window
      //   .open(
      //     `/courses/${courseEnv.COURSE_ID}/pages/${await PAGE_URL}/edit`,
      //     "_blank"
      //   )
      //   ?.focus();
      // // window.location.href = `/courses/${courseEnv.COURSE_ID}/pages/cdb-glossary/edit`;
    }}
  >
    <svelte:fragment slot="name">
      {#await PAGE_CREATED then isCreated}
        {#if isCreated}
          Edit Glossary
        {:else}
          Create Glossary
        {/if}
      {/await}
    </svelte:fragment>
    <svelte:fragment slot="icon">
      {#await PAGE_CREATED then isCreated}
        {#if isCreated}
          <IconElement
            icon={{ id: "Inst.Line.arrow-right", type: IconType.Custom }}
          />
        {:else}
          <IconElement icon={{ id: "Inst.Line.add", type: IconType.Custom }} />
        {/if}
      {/await}
    </svelte:fragment>
  </ElementPanel>
{/if}
