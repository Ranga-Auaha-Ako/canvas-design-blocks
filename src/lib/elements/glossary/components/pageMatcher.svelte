<!-- This component helps teaching staff find or create a glossary page for their course -->
<!-- Created by pageManager.ts when the getResolvedGlossary() function is run -->
<script lang="ts">
  import Modal from "$lib/components/modalDialog/modal.svelte";
  import { type UnResolvedGlossaryState, GlossaryStates } from "../pageInfo";
  export let glossary: UnResolvedGlossaryState;
</script>

{#if glossary.state === GlossaryStates.NO_GLOSSARY}
  <Modal title="Create Glossary Page">
    <p>
      You do not have a glossary page for this course. Would you like to create
      one?
    </p>
    <div class="flex justify-end">
      <button class="btn btn-primary" on:click={() => glossary.createGlossary()}
        >Create</button
      >
    </div>
  </Modal>
{/if}
