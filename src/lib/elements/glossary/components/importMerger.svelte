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
  const filterFunc = (a: termDefinition[], b: termDefinition[]) => {
    return a.filter(
      (term) =>
        !b.some(
          (t) => t.term.toLocaleLowerCase() === term.term.toLocaleLowerCase()
        )
    );
  };

  let mergeType: "append" | "replace" | "overwrite" = "append";
  function mergeTerms(): termDefinition[] {
    switch (mergeType) {
      case "append":
        return [...originalTerms, ...filterFunc(newTerms, originalTerms)];
      case "replace":
        return [...filterFunc(originalTerms, newTerms), ...newTerms];
      case "overwrite":
        return newTerms;
    }
  }

  $: actuallyNewTerms =
    mergeType === "overwrite"
      ? newTerms
      : newTerms.filter((term) => {
          let foundTerm = originalTerms.find(
            (t) => t.term.toLocaleLowerCase() === term.term.toLocaleLowerCase()
          );
          return (
            foundTerm === undefined ||
            foundTerm.definition.toLocaleLowerCase() !==
              term.definition.toLocaleLowerCase()
          );
        });
</script>

<Modal title="Import CSV" show={true} on:close showSave={false}>
  <div class="grid grid-cols-3">
    <div class="col-span-1">
      <!-- UI for choosing whether to merge/overwrite new terms -->
      <p>
        You have {actuallyNewTerms.length} new terms to import. How would you like
        to handle them?
      </p>

      <!-- Radio select for choices -->
      <div class="flex flex-col">
        <label>
          <input
            type="radio"
            bind:group={mergeType}
            name="merge"
            value="append"
            checked
          />
          Add new terms to glossary
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
            <th></th>
            <th>Term</th>
            <th>Definition</th>
          </tr>
        </thead>
        <tbody>
          {#each actuallyNewTerms as term}
            {@const hasOriginal = originalTerms.find(
              (t) => t.term === term.term
            )}
            {@const hasNew = newTerms.find((t) => t.term === term.term)}
            <tr>
              <td>
                {#if hasOriginal && hasNew && hasOriginal.definition !== hasNew.definition}
                  <IconElement
                    icon={{ id: "Inst.Line.warning", type: IconType.Custom }}
                  />
                {:else}
                  <IconElement
                    icon={{ id: "Inst.Line.plus", type: IconType.Custom }}
                  />
                {/if}
              </td>
              <td>{term.term}</td>
              <td>{term.definition}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</Modal>

<style lang="postcss">
</style>
