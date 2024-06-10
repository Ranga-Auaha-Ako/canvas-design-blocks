<!-- This component helps teaching staff find or create a glossary page for their course -->
<script context="module" lang="ts">
  export enum stateStatus {
    CREATED = "Created",
    HIDDEN = "Hidden",
    UNLINKED = "Unlinked",
    NONE = "Not Found",
  }
</script>

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
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/canvas-icons/icons";
  import StateIndicator from "./subComponent/stateIndicator.svelte";
  import { debounce } from "perfect-debounce";
  export let glossaryState: UnResolvedGlossaryState;

  const dispatch = createEventDispatcher<{
    saved: ResolvedGlossaryState;
    close: void;
  }>();

  // Glossary.linkExisting({})

  let moduleID = glossaryState.module_id;

  let pageURL: string | undefined =
    glossaryState.state !== GlossaryStates.NO_GLOSSARY
      ? glossaryState.state === GlossaryStates.GLOSSARY_UNLINKED
        ? glossaryState.page_matches[0]?.url
        : glossaryState.url
      : undefined;
  let foundPages =
    glossaryState.state === GlossaryStates.GLOSSARY_UNLINKED
      ? glossaryState.page_matches
      : undefined;
  let pageTitle = Glossary.defaultTitle;
  let moduleTitle = Glossary.defaultModuleTitle;
  let loading = false;
  let error = "";
  let close: () => void;

  const pageStates = {
    Page: pageURL
      ? glossaryState.state === GlossaryStates.GLOSSARY_HIDDEN_PAGE
        ? stateStatus.HIDDEN
        : glossaryState.state === GlossaryStates.GLOSSARY_UNLINKED
          ? stateStatus.UNLINKED
          : stateStatus.CREATED
      : stateStatus.NONE,
    Module: moduleID
      ? glossaryState.state === GlossaryStates.GLOSSARY_HIDDEN_MODULE
        ? stateStatus.HIDDEN
        : stateStatus.CREATED
      : stateStatus.NONE,
  };

  let validGlossary: boolean | "loading" = true;
  const updateValidity = debounce(async (pageURL: string | undefined) => {
    validGlossary = "loading";
    if (!pageURL) {
      validGlossary = true;
      return;
    }
    const res = await Glossary.checkExisting(pageURL);
    validGlossary = res;
  });
  $: updateValidity(pageURL);
</script>

<Modal
  title="Connect Glossary"
  show={true}
  bind:close
  on:close
  showSave={false}
  showCancel={false}
>
  {#if error}
    <div
      transition:slide
      class="bg-yellow-100 text-black rounded border-l-2 border-yellow-500"
    >
      <p>{error}</p>
    </div>
  {/if}
  {#if !validGlossary}
    <div
      transition:slide
      class="bg-red-100 border-red-400 border rounded px-4 py-2 mt-4 flex gap-4 items-center"
    >
      <div class="text-xl">
        <IconElement
          icon={{ id: "Inst.Line.warning", type: 2 }}
          colorOverride="rgb(248,113,113)"
        />
      </div>
      <p class="text-red-700">
        <strong>Heads up!</strong>
        The page you have selected is not a valid Design Blocks glossary page. Please
        select a valid glossary page or create a new one.
      </p>
    </div>
  {/if}
  <div class="detailsRow">
    <div class="moduleInfo">
      <StateIndicator type="Page" state={pageStates.Page}>
        {#if pageStates.Page === stateStatus.NONE}
          To get started, create a new page to be your course glossary.
        {:else if pageStates.Page === stateStatus.UNLINKED}
          You have {foundPages && foundPages.length > 1
            ? "some pages"
            : "a page"}
          which might be your glossary page. Please select the correct page from
          the dropdown, or create a new page.
          <strong
            >Note: only Design Blocks created pages will work with the glossary
            tool. Please do not link manually-created glossaries.</strong
          >
        {:else if pageStates.Page === stateStatus.CREATED}
          You have already created a glossary page.
        {:else if pageStates.Page === stateStatus.HIDDEN}
          You have created a glossary page, but it is currently hidden. You will
          need to publish the page to make it visible to students.
        {/if}
      </StateIndicator>
      <div class="input-group">
        {#if !pageURL}
          <label for="pageTitle">Enter new Glossary page title</label>
          <input
            type="text"
            placeholder="Page Title"
            bind:value={pageTitle}
            class="w-full"
            id="pageTitle"
          />
          {#if foundPages && foundPages.length >= 1}
            <button
              class="btn btn-sm float-right"
              on:click={() => {
                pageURL = foundPages[0].url;
              }}
            >
              Use existing page
            </button>
          {/if}
        {:else if pageURL && foundPages}
          <label for="pageURL">Select existing glossary or create new:</label>
          <select bind:value={pageURL}>
            {#each foundPages as url}
              <option value={url.url}>
                {url.title}
                {url.title.includes(Glossary.magicToken)
                  ? "(Design Blocks Glossary Page)"
                  : "(Similar Name)"}
              </option>
            {/each}
            <option value={undefined}>Create New Page</option>
          </select>
        {/if}
      </div>
    </div>
    <div class="pageInfo">
      <StateIndicator type="Module" state={pageStates.Module}>
        {#if pageStates.Module !== stateStatus.CREATED}
          {#if pageStates.Page !== stateStatus.CREATED}
            You will also
          {:else}
            You will
          {/if}
          {#if pageStates.Module === stateStatus.NONE}
            need to create a module to hold your glossary page.
            <strong>This will immediately be published to students.</strong>
          {:else if pageStates.Module === stateStatus.HIDDEN}
            need to publish the module to make the glossary visible to students.
            The Glossary module is currently hidden.
          {/if}
        {/if}
      </StateIndicator>
      <div class="input-group">
        {#if !moduleID}
          <label for="moduleTitle">Enter new Module title</label>
          <input
            type="text"
            placeholder="Page Title"
            bind:value={moduleTitle}
            class="w-full"
            id="moduleTitle"
          />
        {/if}
      </div>
    </div>
  </div>
  <p>
    This glossary feature will use invisible characters to identify the glossary
    page. Please take care with editing the module or page titles. If the page
    or module is disconnected, you will be prompted to reconnect it here.
  </p>

  <div class="actionMenu">
    <button
      class="btn"
      on:click={() => {
        close();
        dispatch("close");
      }}
    >
      <IconElement icon={{ id: "Inst.Line.x", type: IconType.Custom }} />
      Cancel
    </button>
    <button
      class="btn btn-primary"
      disabled={loading}
      on:click={async () => {
        loading = true;
        const res = await Glossary.linkExisting({
          existingModuleId: moduleID,
          existingPageUrl: pageURL,
          pageTitle: pageURL ? undefined : pageTitle,
          moduleTitle: moduleID ? undefined : moduleTitle,
        }).catch((e) => {
          error = e.message;
        });
        if (res) {
          close();
          dispatch("saved", res);
        }
        loading = false;
      }}
    >
      {#if loading}
        <div class="animate-spin inline-block mr-2">
          <IconElement
            icon={{ id: "Inst.Line.refresh", type: IconType.Custom }}
          />
        </div>
      {:else}
        <IconElement icon={{ id: "Inst.Line.check", type: IconType.Custom }}
        ></IconElement>
      {/if}
      {#if pageURL}
        {#if pageStates.Page === stateStatus.HIDDEN}
          Publish page
        {:else}
          Link Page
        {/if}
      {:else}
        Create Page
      {/if}
      {#if moduleID}
        {#if pageStates.Module === stateStatus.HIDDEN}
          and {pageStates.Page === stateStatus.HIDDEN ? "" : "Publish"} Module
        {:else}
          and {pageStates.Page === stateStatus.HIDDEN ? "Link" : ""} Module
        {/if}
      {:else if pageStates.Module !== stateStatus.CREATED}
        and Module
      {/if}
      {#if loading}
        ...
      {/if}
    </button>
  </div>
</Modal>

<style lang="postcss">
  .detailsRow {
    @apply grid items-start gap-4 grid-cols-1 md:grid-cols-2 auto-rows-auto;
    .moduleInfo,
    .pageInfo {
      @apply shadow-md p-4 rounded-lg;
    }
    .input-group {
      @apply mx-2;
      label {
        @apply block w-full text-base mb-0 mt-3 text-gray-700 italic;
      }
      input[type="text"],
      select {
        @apply px-3 leading-10 h-12 align-middle w-full block;
      }
    }
  }
  .actionMenu {
    @apply flex flex-row-reverse gap-4;
  }
</style>
