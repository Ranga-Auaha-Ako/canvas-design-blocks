<!-- This component helps teaching staff find or create a glossary page for their course -->
<!-- Created by pageManager.ts when the getResolvedGlossary() function is run -->
<script lang="ts">
  import Modal from "$lib/components/modalDialog/modal.svelte";
  import { createEventDispatcher } from "svelte";
  import {
    type UnResolvedGlossaryState,
    GlossaryStates,
    ResolvedGlossaryState,
  } from "../pageInfo";
  import { Glossary } from "../pageParser";
  import { slide } from "svelte/transition";
  export let glossaryState: UnResolvedGlossaryState;

  const dispatch = createEventDispatcher<{
    saved: ResolvedGlossaryState;
    close: void;
  }>();

  // Glossary.linkExisting({})

  let moduleID =
    glossaryState.state !== GlossaryStates.NO_GLOSSARY
      ? glossaryState.module_id
      : undefined;

  let pageURL: string | undefined =
    glossaryState.state === GlossaryStates.GLOSSARY_HIDDEN_MODULE ||
    glossaryState.state === GlossaryStates.GLOSSARY_HIDDEN_PAGE
      ? glossaryState.page_url
      : glossaryState.state === GlossaryStates.GLOSSARY_UNLINKED
        ? glossaryState.page_matches[0]
        : undefined;
  let foundPages =
    glossaryState.state === GlossaryStates.GLOSSARY_UNLINKED
      ? glossaryState.page_matches
      : undefined;

  let pageTitle = Glossary.defaultTitle;
  let moduleTitle = Glossary.defaultModuleTitle;
  let loading = false;
  let error = "";
</script>

<Modal
  title="Create Glossary Page"
  show={true}
  showSave="Create"
  showClose={true}
  on:save={() =>
    Glossary.linkExisting({
      existingModuleId: moduleID,
      existingPageUrl: pageURL,
      pageTitle: pageURL ? undefined : pageTitle,
      moduleTitle: moduleID ? undefined : moduleTitle,
    })}
  on:close
>
  <pre>

  {JSON.stringify(GlossaryStates)}
  
  {JSON.stringify(glossaryState)}
</pre>
  {#if error}
    <div
      transition:slide
      class="bg-yellow-100 text-black rounded border-l-2 border-yellow-500"
    >
      <p>{error}</p>
    </div>
  {/if}
  {#if !pageURL}
    <input
      type="text"
      placeholder="Page Title"
      bind:value={pageURL}
      class="w-full"
    />
  {:else if pageURL && foundPages}
    <select bind:value={pageURL}>
      {#each foundPages as url}
        <option value={url}>{url}</option>
      {/each}
    </select>
  {:else}
    <p>Found page: {pageURL}</p>
  {/if}
  {#if !moduleID}
    <input
      type="text"
      placeholder="Page Title"
      bind:value={moduleTitle}
      class="w-full"
    />
  {/if}
</Modal>
