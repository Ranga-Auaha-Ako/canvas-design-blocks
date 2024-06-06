<script lang="ts">
  import { unparse } from "papaparse";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { courseEnv } from "$lib/util/courseEnv";
  import { fade, slide } from "svelte/transition";
  import Modal from "$lib/components/modalDialog/modal.svelte";
  import { tick } from "svelte";
  import { nanoid } from "nanoid";
  import ImportMerger from "./components/importMerger.svelte";
  import { Glossary, termDefinition } from "./pageParser";

  type termDefinitionID = termDefinition & { id: string };
  type glossaryStateID = {
    terms: termDefinitionID[];
    institutionDefaults: boolean;
  };

  export let glossaryData: Glossary;
  export let frameless: boolean = false;
  let parsedData: glossaryStateID = {
    ...glossaryData,
    terms: glossaryData.terms.map((t) => ({ ...t, id: nanoid() })),
  };
  $: if (
    parsedData.terms[parsedData.terms.length - 1]?.definition !== "" ||
    parsedData.terms[parsedData.terms.length - 1]?.term !== ""
  ) {
    parsedData.terms = [
      ...parsedData.terms,
      { term: "", definition: "", id: nanoid() },
    ];
  }
  const instDefaults = glossaryData.institutionTerms;
  let newTerm: termDefinitionID = { term: "", definition: "", id: nanoid() };
  let saving = false;
  let saveNotice = false;
  let errorNotice: false | string = false;
  let needsSave = false;
  let hasCreated = false;
  $: needsSave, (parsedData.terms = parsedData.terms);
  $: if (needsSave) {
    window.onbeforeunload = () => {
      return "You have unsaved changes. Are you sure you want to leave?";
    };
  } else {
    window.onbeforeunload = null;
  }
  let showInstDefaults: () => void;

  const handleItemOrder = (
    event:
      | { oldIndex: number | undefined; newIndex: number | undefined }
      | undefined
  ) => {
    const { oldIndex, newIndex } = event || {};
    if (oldIndex !== undefined && newIndex !== undefined) {
      const input = [...parsedData.terms];
      const elm = input.splice(oldIndex, 1)[0];
      input.splice(newIndex, 0, elm);
      parsedData.terms = [...input];
    }
  };

  let itemList: HTMLDivElement;
  $: Sortable = import("sortablejs").then((S) => {
    return new S.default(itemList, {
      animation: 200,
      handle: ".rowNumber",
      direction: "vertical",
      onEnd: (event) => {
        handleItemOrder(event);
      },
    });
  });

  let newTerms: termDefinition[] | undefined;
</script>

{#if newTerms}
  <ImportMerger
    originalTerms={parsedData.terms}
    {newTerms}
    on:merged={({ detail }) => {
      parsedData.terms = detail.map((term) => ({
        term: term.term,
        definition: term.definition,
        id: nanoid(),
      }));
      needsSave = true;
      newTerms = undefined;
    }}
    on:close={() => {
      newTerms = undefined;
    }}
  ></ImportMerger>
{/if}
<div class="cgb-component">
  <div
    class:editor-frame={!frameless}
    class="glossaryEditor transition"
    in:slide|global
  >
    <div>
      <h1 class="text-3xl block">Glossary Editor</h1>
      <p>
        Define terms and definitions for
        {#if courseEnv.COURSE_ID}
          <a
            target="_blank"
            href={`/courses/${courseEnv.COURSE_ID}/pages/${glossaryData.state.url}`}
            >your course glossary</a
          >.
        {:else}
          course glossary.
        {/if}
        These will appear wherever the term is used in the course content - in pages
        and discussions. Students can click on the term to see the definition.
      </p>
      {#if instDefaults.length > 0}
        <p>
          You can also enable institution-provided terms. These terms are
          provided by your institution, and can be added to your course
          glossary. You can enable or disable these terms at any time. You have {instDefaults.length}
          terms available.
          <label class="block">
            <input
              type="checkbox"
              bind:checked={parsedData.institutionDefaults}
            />
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
        </p>
      {/if}
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
    </div>
    <div class="glossary-table transition" class:opacity-60={saving}>
      <div class="glossary-table--header">
        <div class="number"></div>
        <div class="term">Term</div>
        <div class="definition">Definition</div>
        <div class="actions"></div>
      </div>
      <div class="glossary-table--body" bind:this={itemList}>
        {#each parsedData.terms as term, i (term.id)}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="glossary-item"
            class:hasError={term.term.trim() === "" &&
              i !== parsedData.terms.length - 1}
            on:keydown={async (e) => {
              newTerm = { term: "", definition: "", id: nanoid() };
              if (e.key === "Enter") {
                parsedData.terms.splice(i + 1, 0, newTerm);
                parsedData.terms = parsedData.terms;
                await tick();
                const input = document.querySelector(
                  `.glossary-item:nth-child(${i + 2}) input`
                );
                if (input) {
                  //@ts-ignore
                  input.focus();
                }
              }
            }}
          >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span
              class="rowNumber"
              on:click|stopPropagation={(e) => {
                // Refocus if user clicks here
                e.currentTarget.parentElement?.querySelector("input")?.focus();
              }}
            >
              {#if i === parsedData.terms.length - 1}
                +
              {:else}
                {i + 1}
              {/if}
            </span>
            <input
              disabled={saving}
              type="text"
              bind:value={term.term}
              on:input={() => (needsSave = true)}
              on:keydown={(e) => {
                if (e.key === "Backspace" && term.term === "") {
                  parsedData.terms = parsedData.terms.filter(
                    (_, index) => index !== i
                  );
                  needsSave = true;
                }
              }}
            />
            <input
              disabled={saving}
              type="text"
              bind:value={term.definition}
              on:input={() => (needsSave = true)}
              on:keydown={(e) => {
                if (e.key === "Backspace" && term.definition === "") {
                  // Focus on the term input
                  const input = document.querySelector(
                    `.glossary-item:nth-child(${i + 1}) input`
                  );
                  if (input) {
                    //@ts-ignore
                    input.focus();
                  }
                }
              }}
            />
            <div class="glossary-table--item-actions">
              {#if i === parsedData.terms.length - 1}
                <button
                  class="button"
                  title="Add Term"
                  on:click={() => {
                    parsedData.terms = [
                      ...parsedData.terms,
                      { term: "", definition: "", id: nanoid() },
                    ];
                    needsSave = true;
                  }}
                >
                  <IconElement
                    icon={{ id: "Inst.Line.add", type: 2 }}
                    colorOverride="#333"
                  />
                </button>
              {:else}
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
                    colorOverride="#333"
                  />
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="glossary-actions">
      <a
        class="button btn-secondary"
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(
          unparse(
            [
              ["Term", "Definition"],
              ...parsedData.terms.map(({ term, definition }) => [
                term,
                definition,
              ]),
            ],
            {
              skipEmptyLines: "greedy",
            }
          )
        )}`}
        download="glossary-course-{courseEnv.COURSE_ID}.csv"
      >
        <IconElement
          icon={{ id: "Inst.Line.download", type: 2 }}
          colorOverride="#000"
        />
        Download CSV
      </a>
      <button
        class="button btn-secondary"
        disabled={saving}
        on:click={async () => {
          try {
            newTerms = await glossaryData.parseCSV();
          } catch (err) {
            //@ts-ignore
            errorNotice = err.message;
          }
        }}
      >
        <IconElement
          icon={{ id: "Inst.Line.upload", type: 2 }}
          colorOverride="#000"
        />
        Import
      </button>
      <div class="float-end">
        <button
          class="button"
          disabled={saving}
          on:click={async () => {
            saving = true;
            glossaryData.terms = parsedData.terms;
            glossaryData.institutionDefaults = parsedData.institutionDefaults;
            try {
              await glossaryData.save();
            } catch (err) {
              console.error(err);
              //@ts-ignore
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
          <IconElement
            icon={{ id: "Inst.Line.check-dark", type: 2 }}
            colorOverride="#fff"
          />
          Save
        </button>
        <!-- {#await PAGE_URL then url}
          <a
            class="button btn-secondary"
            href={`/courses/${courseEnv.COURSE_ID}/pages/${url}`}
          >
            <IconElement
              icon={{ id: "Inst.Line.eye", type: 2 }}
              colorOverride="#000"
            />
            View Page
          </a>
        {/await} -->
      </div>
    </div>
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
</div>

<style lang="postcss">
  .glossaryEditor {
    @apply -mt-8;
  }
  .editor-frame {
    @apply rounded-lg bg-white border-primary border-2 p-4;
    @apply max-w-screen-md;
  }
  .glossary-table {
    @apply mb-8 border border-gray-200;
    .glossary-table--header,
    .glossary-table--body,
    .glossary-item {
      @apply grid;
      grid-template-columns: 2rem 1fr 1fr 2rem;
      grid-auto-rows: 2rem;
    }
    .glossary-table--header {
      @apply font-bold leading-none border-b border-gray-200;
      .term,
      .definition {
        @apply leading-8 pl-2 border-l border-gray-200;
      }
    }
    .glossary-item {
      @apply col-span-4 m-0;
      @apply transition;
      @apply border-y border-solid border-transparent;
      .rowNumber {
        @apply text-center self-center font-mono font-light text-xs;
        @apply cursor-move transition;
        &:hover {
          @apply text-primary scale-125;
        }
      }
      input,
      div[contenteditable] {
        @apply w-full h-full m-0 py-0 px-2;
        @apply border-0 shadow-none bg-transparent rounded-none border-l border-transparent;
        @apply leading-8;
        &:focus {
          @apply outline-none;
        }
      }
      .glossary-table--item-actions {
        @apply pointer-events-none opacity-0 transition;
        .button {
          @apply text-gray-800 h-full;
        }
      }
      &:hover {
        @apply border-gray-100;
      }
      &:first-child {
        @apply border-t-0;
      }
      &:last-child {
        @apply border-b-0;
      }
      &:focus-within {
        @apply bg-white;
        @apply border-gray-200;
        input {
          @apply border-gray-200;
        }
      }
      &.hasError {
        @apply border-red-200 bg-red-50;
      }

      &:hover,
      &:focus-within {
        .glossary-table--item-actions {
          @apply pointer-events-auto opacity-100;
        }
      }
    }
  }
  .btn-text {
    @apply bg-none text-inherit border-none inline align-baseline;
    line-height: inherit;
  }
  .glossary-actions {
    .button {
      @apply inline-block text-sm text-center rounded bg-primary text-white leading-3 py-2.5 px-3 align-middle;
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
      :global(.cdb--icon) {
        @apply align-middle;
      }
    }
  }
</style>
