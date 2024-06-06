<!-- This component helps teaching staff find or create a glossary page for their course -->
<!-- Created by pageManager.ts when the getResolvedGlossary() function is run -->
<script lang="ts">
  import Modal from "$lib/components/modalDialog/modal.svelte";
  import { createEventDispatcher } from "svelte";
  import {
    type UnResolvedGlossaryState,
    GlossaryStates,
    getGlossaryState,
    RichGlossaryState,
    ResolvedGlossaryState,
  } from "../pageInfo";
  import { Glossary } from "../pageParser";
  import { slide } from "svelte/transition";
  export let glossary: UnResolvedGlossaryState;

  const dispatch = createEventDispatcher<{
    saved: ResolvedGlossaryState;
    close: void;
  }>();

  let loading = false;
  let error = "";
  async function createGlossary() {
    loading = true;
    // Create glossary
    const emptyGlossary = new Glossary();
    await emptyGlossary.save();
    // Check to see if the glossary was created
    const newState = await getGlossaryState();
    if (newState.state === GlossaryStates.GLOSSARY_LINKED) {
      dispatch("saved", newState);
      loading = false;
      return;
    }
    loading = false;
    error = "Failed to create glossary page.";
  }
</script>

{#if glossary.state === GlossaryStates.NO_GLOSSARY}
  <Modal
    title="Create Glossary Page"
    show={true}
    showSave="Create"
    showClose={true}
    on:save={() => createGlossary()}
    on:close
  >
    {#if error}
      <div
        transition:slide
        class="bg-yellow-100 text-black rounded border-l-2 border-yellow-500"
      >
        <p>{error}</p>
      </div>
    {/if}
    <p>
      You do not have a glossary page for this course. Would you like to create
      one?
    </p>
  </Modal>
{/if}
