<script lang="ts">
  import Modal from "$lib/util/components/modalDialog/modal.svelte";
  import { createEventDispatcher } from "svelte";
  import type { termDefinition } from "../glossaryClientManager";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";

  export let originalTerms: termDefinition[];
  export let newTerms: termDefinition[];
  const dispatch = createEventDispatcher<{
    merged: termDefinition[];
    close: void;
  }>();

  /**
   * Filter function to remove terms from a that are in b
   */
  const termIn = (a: termDefinition, b: termDefinition[]) =>
    b.some((t) => t.term.toLocaleLowerCase() === a.term.toLocaleLowerCase());

  let mergeType: "keep" | "replace" | "overwrite" = "keep";
  interface annoatedTermDef extends termDefinition {
    from: "old" | "new";
    keep: boolean;
  }
  function previewMerge(type = mergeType): annoatedTermDef[] {
    const originalAnnotated = originalTerms
      .filter((t) => t.term.trim())
      .map<annoatedTermDef>((t) => ({ ...t, from: "old", keep: true }));
    const newAnnotated = newTerms
      .filter((t) => t.term.trim())
      .map<annoatedTermDef>((t) => ({
        ...t,
        from: "new",
        keep: true,
      }));
    switch (type) {
      case "keep":
        return [
          ...originalAnnotated,
          ...newAnnotated.map((t) => ({
            ...t,
            keep: !termIn(t, originalAnnotated),
          })),
        ];
      case "replace":
        return [
          ...originalAnnotated.map((t) => ({
            ...t,
            keep: !termIn(t, newAnnotated),
          })),
          ...newAnnotated,
        ];
      case "overwrite":
        return [
          ...originalAnnotated.map((t) => ({
            ...t,
            keep: false,
          })),
          ...newAnnotated,
        ];
    }
    return [];
  }
  function mergeTerms(type = mergeType): termDefinition[] {
    return previewMerge(type)
      .filter((t) => t.keep)
      .map((t) => ({ term: t.term, definition: t.definition }));
  }

  $: mergePreview = previewMerge(mergeType);
</script>

<Modal title="Import CSV" show={true} on:close showSave={false} size="large">
  <div class="grid grid-cols-3 gap-4 p-4">
    <div class="col-span-1">
      <!-- UI for choosing whether to merge/overwrite new terms -->
      <p>
        You have {newTerms.length} terms to import. How would you like to handle
        them?
      </p>

      <!-- Radio select for choices -->
      <div class="flex flex-col">
        <label>
          <input
            type="radio"
            bind:group={mergeType}
            name="merge"
            value="keep"
            checked
          />
          Add new terms to glossary without changing existing
        </label>
        <label>
          <input
            type="radio"
            bind:group={mergeType}
            name="merge"
            value="replace"
          />
          Add new terms and update existing terms
        </label>
        <label>
          <input
            type="radio"
            bind:group={mergeType}
            name="merge"
            value="overwrite"
          />
          Delete glossary and replace with new terms
        </label>
      </div>
      <button
        class="btn btn-primary"
        on:click={() => {
          dispatch(
            "merged",
            mergeTerms().filter((t) => t.term.trim())
          );
        }}>Merge</button
      >
    </div>
    <div class="col-span-2">
      <!-- Preview new terms -->
      <table class="mergeType--{mergeType}">
        <thead>
          <tr>
            <th class="state"></th>
            <th class="term">Term</th>
            <th class="definition">Definition</th>
          </tr>
        </thead>
        <tbody>
          {#each mergePreview as term}
            <tr
              class:deleting={!term.keep}
              class:adding={term.keep}
              class:new={term.from === "new"}
              class:old={term.from === "old"}
            >
              {#if !term.keep}
                {#if term.from === "old"}
                  <td title="Removing" class="state"> - </td>
                {:else}
                  <td title="Not added" class="state"> &times; </td>
                {/if}
              {:else if term.from === "new"}
                <td title="Adding" class="state"> + </td>
              {:else}
                <td title="Kept" class="state"> &nbsp; </td>
              {/if}
              <td class="term" title={term.term}>{term.term}</td>
              <td class="definition" title={term.definition}
                >{term.definition}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</Modal>

<style lang="postcss">
  .col-span-1,
  .col-span-2 {
    @apply m-0;
  }
  table {
    @apply border border-gray-300 rounded border-separate overflow-clip table-fixed w-full;
    thead {
      @apply bg-gray-100 border-b border-gray-300 h-8;
    }
    td,
    th {
      &.state {
        @apply w-8 text-center border-r;
      }
      &.term {
        @apply w-24 truncate px-2;
      }
      &.definition {
        @apply truncate px-2;
      }
    }
    tbody {
      tr {
        @apply h-8;
        &.adding.new {
          @apply bg-green-100;
        }
        &.adding.old {
        }
        &.deleting.old {
          @apply bg-red-100;
        }
        &.deleting.new {
          @apply text-gray-300;
        }
        td {
          @apply border-b border-gray-300;
        }
        &:last-child {
          td {
            @apply border-b-0;
          }
        }
      }
    }
  }
</style>
