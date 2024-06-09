<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import { courseEnv, getCoursePermissions } from "$lib/util/courseEnv";
  import { onMount } from "svelte";
  import Modal from "$lib/components/modalDialog/modal.svelte";
  import GlossaryEditor from "./glossaryEditor.svelte";
  import Portal from "$lib/portal/portal.svelte";
  import {
    GlossaryStates,
    RichGlossaryState,
    getResolvedGlossary,
    glossaryState,
  } from "./pageInfo";
  import { Glossary } from "./pageParser";
  import { resolve } from "path";

  let openModal: () => void;
  let closeModal: () => void;
  let loadEditor: false | RichGlossaryState = false;
  let internalGlossaryState = glossaryState;

  let loading = false;

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
        {@const glossary = Glossary.fromHTML(loadEditor)}
        <GlossaryEditor glossaryData={glossary} frameless={true} />
      {/if}
    </Modal>
  </Portal>
  <ElementPanel
    title="Edit Glossary"
    on:add={async () => {
      loading = true;
      loadEditor = await getResolvedGlossary().catch((e) => {
        return false;
      });
      loading = false;
      if (loadEditor) internalGlossaryState = Promise.resolve(loadEditor);
      if (loadEditor) openModal();
    }}
  >
    <svelte:fragment slot="name">
      {#await internalGlossaryState then glossaryStateRes}
        {#if loading}
          Loading...
        {:else if glossaryStateRes.state === GlossaryStates.GLOSSARY_LINKED}
          Edit Glossary
        {:else if glossaryStateRes.state === GlossaryStates.NO_GLOSSARY}
          Create Glossary
        {:else}
          Manage Glossary
        {/if}
      {/await}
    </svelte:fragment>
    <svelte:fragment slot="icon">
      {#await internalGlossaryState then glossaryStateRes}
        {#if loading}
          <div class="animate-spin">
            <IconElement
              icon={{ id: "Inst.Line.refresh", type: IconType.Custom }}
            />
          </div>
        {:else if glossaryStateRes.state === GlossaryStates.NO_GLOSSARY}
          <IconElement icon={{ id: "Inst.Line.add", type: IconType.Custom }} />
        {:else}
          <IconElement
            icon={{ id: "Inst.Line.arrow-right", type: IconType.Custom }}
          />
        {/if}
      {/await}
    </svelte:fragment>
  </ElementPanel>
{/if}
