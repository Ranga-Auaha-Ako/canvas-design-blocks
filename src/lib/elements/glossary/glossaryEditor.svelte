<script lang="ts">
  import {
    GlossaryClientManager,
    glossaryState,
    termDefinition,
  } from "./glossaryClientManager";
  import Cookie from "js-cookie";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType, instClassToId } from "$lib/icons/svelte/iconPicker";
  import { courseEnv } from "$lib/util/courseEnv";
  import { fade, slide } from "svelte/transition";
  import Modal from "$lib/util/components/modalDialog/modal.svelte";

  const CSRF = Cookie.get("_csrf_token");

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
  let showInstDefaults: () => void;
</script>

<div class="cgb-component">
  <div
    class="shadow-lg rounded-lg bg-white border-primary border-2 m-4 p-4 transition"
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
    </div>
    <div class="glossary-table transition" class:opacity-60={saving}>
      {#each parsedData.terms as term, i}
        <div class="glossary-item">
          <label class="input-group term">
            <span>Term</span>
            <input disabled={saving} type="text" value={term.term} />
          </label>
          <label class="input-group definition">
            <span>Definition</span>
            <input disabled={saving} type="text" value={term.definition} />
          </label>
          <button
            class="button"
            title="Delete"
            on:click={() => {
              parsedData.terms = parsedData.terms.filter(
                (_, index) => index !== i
              );
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
          const file = await new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = () => {
              if (input.files?.length) {
                const reader = new FileReader();
                reader.onload = () => {
                  resolve(reader.result);
                };
                reader.readAsText(input.files[0]);
              }
            };
            input.click();
          });
          if (typeof file === "string") {
            try {
              const newData = JSON.parse(file);
              if (Array.isArray(newData)) {
                newData.every((term) => {
                  if (
                    typeof term.term !== "string" ||
                    typeof term.definition !== "string"
                  ) {
                    console.error("Invalid JSON file");
                    return false;
                  }
                  return true;
                });
                parsedData.terms = newData.map((term) => ({
                  term: term.term,
                  definition: term.definition,
                }));
              } else {
                console.error("Invalid JSON file");
              }
            } catch (error) {
              console.error("Invalid JSON file");
            }
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
          glossaryData = JSON.stringify(parsedData);
          // Post to API
          if (!CSRF) throw new Error("CSRF token not found");
          saving = true;
          await fetch(
            `/api/v1/courses/${courseEnv.COURSE_ID}/pages/cdb-glossary`,
            {
              method: "PUT",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "X-Csrf-Token": CSRF,
              },
              body: JSON.stringify({
                wiki_page: {
                  ...courseEnv.WIKI_PAGE,
                  body: glossaryData,
                  published: false,
                  notify_of_update: false,
                },
              }),
            }
          );
          saving = false;
          saveNotice = true;
          setTimeout(() => {
            saveNotice = false;
          }, 5000);
        }}
      >
        <IconElement
          icon={{ id: "Inst.Line.check-dark", type: 2 }}
          colorOverride="#fff"
        />
        Save
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
    @apply inline-block text-base rounded bg-primary text-white leading-4 py-2 px-4 align-middle;
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
  :global(body.cdb-glossary-editor-active) {
    :global(.edit-form),
    :global(.cgb-toolbar) {
      display: none !important;
    }
  }
</style>
