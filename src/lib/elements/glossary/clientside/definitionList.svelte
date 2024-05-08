<script lang="ts">
  import { nanoid } from "nanoid";
  import { slide } from "svelte/transition";

  export let terms: { term: string; definition: string }[] = [];
  export let termNodes: HTMLElement[] = [];
  export let mode: "desktop" | "mobile" = "desktop";
  $: foundTerms = terms.filter((t) =>
    termNodes.some(
      (node) => node.dataset.cdbTerm?.toLowerCase() === t.term.toLowerCase()
    )
  );
  let id = nanoid();
  let expanded = false;
</script>

{#if foundTerms.length > 0}
  <div class="cgb-component">
    <div class="mt-4 border-t border-gray-100 px-3 py-3">
      <h2 class="leading-none text-xl">
        <button
          class=" text-xl w-full"
          {id}
          aria-expanded={expanded}
          aria-controls="{id}-details"
          on:click={() => {
            expanded = !expanded;
          }}
        >
          {#if expanded}
            Hide
          {:else}
            Show
          {/if}
          Glossary
        </button>
      </h2>

      <div role="region" aria-labelledby={id} id="{id}-details">
        {#if expanded}
          <div transition:slide>
            {#if foundTerms.length > 0}
              <dl>
                {#each foundTerms as { term, definition }, i}
                  <dt>
                    {term}
                  </dt>
                  <dd>
                    {definition}
                  </dd>
                {/each}
              </dl>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
