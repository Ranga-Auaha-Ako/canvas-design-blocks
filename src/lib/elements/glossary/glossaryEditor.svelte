<script lang="ts">
  import {
    GlossaryClientManager,
    PAGE_CREATED,
    glossaryState,
    termDefinition,
  } from "./glossaryClientManager";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType, instClassToId } from "$lib/icons/svelte/iconPicker";
  import { courseEnv } from "$lib/util/courseEnv";
  import { fade, slide } from "svelte/transition";
  import Modal from "$lib/util/components/modalDialog/modal.svelte";

  export let glossaryData: string;
  export let manager: GlossaryClientManager;
  let parsedData: glossaryState = { terms: [], institutionDefaults: true };
  try {
    const oldPageData = JSON.parse(glossaryData);
    if (typeof oldPageData.terms === "undefined")
      throw new Error("Invalid JSON");
    if (typeof oldPageData.institutionDefaults === "undefined")
      throw new Error("Invalid JSON");
    parsedData = oldPageData;
  } catch (err) {
    parsedData = {
      terms: [],
      institutionDefaults: true,
    };
  }
  const instDefaults = manager.institutionTerms;
  let newTerm: termDefinition = { term: "", definition: "" };
  let saving = false;
  let saveNotice = false;
  let errorNotice: false | string = false;
  let needsSave = false;
  let hasCreated = false;
  $: if (needsSave) {
    window.onbeforeunload = () => {
      return "You have unsaved changes. Are you sure you want to leave?";
    };
  } else {
    window.onbeforeunload = null;
  }
  let showInstDefaults: () => void;
</script>

<div class="cgb-component">
  <div
    class="shadow-lg rounded-lg bg-white border-primary border-2 m-4 p-4 transition"
    in:fade|global
  >
    <div class="max-w-prose mx-auto">
      <h1 class="text-3xl text-center block">Glossary Editor</h1>
      <p>
        Edit glossary terms for your course here. Words defined here will be
        highlighted in the course content, and students can click on them to see
        the definition.
      </p>
      <label>
        <input type="checkbox" bind:checked={parsedData.institutionDefaults} />
        Enable {instDefaults.length} institution-provided glossary terms.
        <button
          class="btn-text font-bold"
          on:click={() => {
            showInstDefaults();
          }}
        >
          (View)
        </button>
      </label>
      <Modal
        title="Institution-Provided Terms"
        showSave={false}
        showCancel={false}
        showClose={true}
        bind:open={showInstDefaults}
      >
        <dl class="mx-4">
          {#each instDefaults.sort( (a, b) => a.term.localeCompare(b.term) ) as { term, definition }, i}
            <dt>
              {term}
            </dt>
            <dd class="mb-4">
              {definition}
            </dd>
          {/each}
        </dl>
      </Modal>
      {#if saveNotice}
        <div
          class="bg-green-100 border-green-400 border rounded px-4 py-2 mt-4 flex gap-4 items-center"
          in:slide
          out:fade
        >
          <div class="text-xl">
            <IconElement
              icon={{ id: "Inst.Line.check-dark", type: 2 }}
              colorOverride="#15803D"
            />
          </div>
          <p class="text-green-700">Saved successfully</p>
        </div>
      {/if}
      {#if needsSave}
        <div
          class="bg-yellow-100 border-yellow-400 border rounded px-4 py-2 mt-4 flex gap-4 items-center"
          in:slide
          out:fade
        >
          <div class="text-xl">
            <IconElement
              icon={{ id: "Inst.Line.warning", type: 2 }}
              colorOverride="#FFA500"
            />
          </div>
          <p class="text-yellow-700">Unsaved changes</p>
        </div>
      {/if}
      {#if errorNotice}
        <button
          class="bg-red-100 border-red-400 border rounded px-4 py-2 mt-4 flex gap-4 items-center text-left"
          in:slide
          out:fade
          title="Click to dismiss"
          on:click={() => {
            errorNotice = false;
          }}
        >
          <div class="text-xl">
            <IconElement
              icon={{ id: "Inst.Line.warning", type: 2 }}
              colorOverride="rgb(248,113,113)"
            />
          </div>
          <p class="text-red-700">{errorNotice}</p>
        </button>
      {/if}
    </div>
    <div class="glossary-table transition" class:opacity-60={saving}>
      {#each parsedData.terms as term, i}
        <div class="glossary-item">
          <label class="input-group term">
            <span>Term</span>
            <input
              disabled={saving}
              type="text"
              value={term.term}
              on:input={() => (needsSave = true)}
            />
          </label>
          <label class="input-group definition">
            <span>Definition</span>
            <input
              disabled={saving}
              type="text"
              value={term.definition}
              on:input={() => (needsSave = true)}
            />
          </label>
          <button
            class="button"
            title="Delete"
            on:click={() => {
              parsedData.terms = parsedData.terms.filter(
                (_, index) => index !== i
              );
              needsSave = true;
            }}
          >
            <IconElement
              icon={{ id: "Inst.Line.trash", type: 2 }}
              colorOverride="#fff"
            />
          </button>
        </div>
      {/each}
      <form
        class="glossary-item"
        on:submit|preventDefault={(e) => {
          parsedData.terms = [...parsedData.terms, { ...newTerm }];
          newTerm.term = "";
          newTerm.definition = "";
          needsSave = true;
        }}
      >
        <label class="input-group term">
          <span>Term</span>
          <input
            disabled={saving}
            type="text"
            bind:value={newTerm.term}
            required
          />
        </label>
        <label class="input-group definition">
          <span>Definition</span>
          <input
            disabled={saving}
            type="text"
            bind:value={newTerm.definition}
            required
          />
        </label>
        <button class="button" title="Add Term">
          <IconElement
            icon={{ id: "Inst.Line.add", type: 2 }}
            colorOverride="#fff"
          />
        </button>
      </form>
    </div>
    <div class="glossary-actions">
      <a
        class="button btn-secondary"
        href={`data:application/json;charset=utf-8,${encodeURIComponent(
          glossaryData
        )}`}
        download="glossary-course-{courseEnv.COURSE_ID}.json"
      >
        <IconElement
          icon={{ id: "Inst.Line.download", type: 2 }}
          colorOverride="#000"
        />
        Download
      </a>
      <button
        class="button btn-secondary"
        disabled={saving}
        on:click={async () => {
          let newTerms;
          try {
            newTerms = await manager.loadFile();
          } catch (err) {
            errorNotice = err.message;
          }
          if (newTerms) {
            parsedData.terms = manager.terms;
            needsSave = true;
          }
        }}
      >
        <IconElement
          icon={{ id: "Inst.Line.upload", type: 2 }}
          colorOverride="#000"
        />
        Import
      </button>
      <button
        class="button"
        disabled={saving}
        on:click={async () => {
          saving = true;
          manager.terms = parsedData.terms;
          manager.institutionDefaults = parsedData.institutionDefaults;
          try {
            await manager.save();
          } catch (err) {
            console.error(err);
            errorNotice = err.message;
            saving = false;
            return;
          }
          saving = false;
          saveNotice = true;
          setTimeout(() => {
            saveNotice = false;
          }, 5000);
          needsSave = false;
          hasCreated = true;
        }}
      >
        {#await PAGE_CREATED then isCreated}
          {#if isCreated || hasCreated}
            <IconElement
              icon={{ id: "Inst.Line.check-dark", type: 2 }}
              colorOverride="#fff"
            />
            Save
          {:else}
            <IconElement
              icon={{ id: "Inst.Line.plus", type: 2 }}
              colorOverride="#fff"
            />
            Create
          {/if}
        {/await}
      </button>
    </div>
  </div>
</div>

<style lang="postcss">
  .glossary-table {
    @apply flex flex-col gap-2 mt-8;
    .glossary-item {
      @apply p-3 pt-1 border rounded;
      @apply flex mx-8 gap-2 justify-items-center items-end;
      .input-group {
        @apply flex flex-col m-0 p-0;
        &.term {
          flex-grow: 1;
        }
        &.definition {
          flex-grow: 3;
        }
        span {
          @apply font-bold m-0 p-0;
        }
        input {
          @apply w-full m-0 h-8;
          &:invalid {
            color: inherit;
            border-color: #ccc;
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
          }
        }
      }
    }
  }
  .glossary-actions {
    @apply flex justify-end gap-2 mx-8;
  }
  .button {
    @apply inline-block text-base text-center rounded bg-primary text-white leading-6 py-2 px-4 align-middle;
    @apply transition;
    &:hover {
      @apply bg-black;
      text-decoration: none;
    }
    &:disabled {
      @apply bg-gray-400 opacity-50;
    }
    &.btn-secondary {
      @apply bg-white text-black border border-primary;
      &:hover {
        @apply bg-gray-100;
      }
    }
  }
  .btn-text {
    @apply bg-none text-inherit border-none inline align-baseline;
    line-height: inherit;
  }
</style>
