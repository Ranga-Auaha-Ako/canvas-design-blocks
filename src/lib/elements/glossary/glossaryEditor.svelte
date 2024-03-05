<script lang="ts">
  import { termDefinition } from "./glossaryClientManager";
  import Cookie from "js-cookie";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType, instClassToId } from "$lib/icons/svelte/iconPicker";

  const CSRF = Cookie.get("_csrf_token");

  export let glossaryData: string;
  let parsedData: termDefinition[] = [];
  try {
    parsedData = JSON.parse(glossaryData);
  } catch (error) {
    parsedData = [];
  }
  let newTerm: termDefinition = { term: "", definition: "" };
  let saving = false;
</script>

<div class="cgb-component">
  <div class="shadow-lg rounded-lg bg-white border-primary border-2 m-4 p-4">
    <div class="max-w-prose mx-auto">
      <h1 class="text-3xl text-center block">Glossary Editor</h1>
      <p>
        Edit glossary terms for your course here. Words defined here will be
        highlighted in the course content, and students can click on them to see
        the definition.
      </p>
    </div>
    <div class="glossary-table">
      {#each parsedData as term, i}
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
            title="Delete"
            on:click={() => {
              parsedData = parsedData.filter((_, index) => index !== i);
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
          parsedData = [...parsedData, { ...newTerm }];
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
        <button title="Add Term">
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
        download="glossary-course-{window.ENV.COURSE_ID}.json"
      >
        <IconElement
          icon={{ id: "Inst.Line.download", type: 2 }}
          colorOverride="#000"
        />
        Download
      </a>
      <button
        class="btn-secondary"
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
                parsedData = newData.map((term) => ({
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
        disabled={saving}
        on:click={async () => {
          glossaryData = JSON.stringify(parsedData);
          // Post to API
          if (!CSRF) throw new Error("CSRF token not found");
          saving = true;
          await fetch(
            `/api/v1/courses/${window.ENV.COURSE_ID}/pages/cdb-glossary`,
            {
              method: "PUT",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "X-Csrf-Token": CSRF,
              },
              body: JSON.stringify({
                wiki_page: {
                  ...window.ENV.WIKI_PAGE,
                  body: glossaryData,
                  published: false,
                  notify_of_update: false,
                },
              }),
            }
          );
          saving = false;
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
  button,
  a.button {
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
  :global(body.cdb-glossary-editor-active) {
    :global(.edit-form),
    :global(.cgb-toolbar) {
      display: none !important;
    }
  }
</style>
