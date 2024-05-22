<script lang="ts">
  import { courseEnv } from "$lib/util/courseEnv";
  import { nanoid } from "nanoid";
  import { slide } from "svelte/transition";

  export let terms: { term: string; definition: string }[] = [];
  export let termNodes: HTMLElement[] = [];
  $: foundTerms = terms.filter((t) =>
    termNodes.some(
      (node) => node.dataset.cdbTerm?.toLowerCase() === t.term.toLowerCase()
    )
  );
  let id = nanoid();
  let expanded = false;
  let isMobile = import.meta.env.MODE.includes("mobile");
</script>

{#if foundTerms.length > 0}
  <div class="cgb-component">
    {#if isMobile}
      <div class="mobileSpacer">&nbsp;</div>
    {/if}
    <div
      class="definitionList"
      class:defList--mobile={isMobile}
      class:defList--expanded={expanded}
    >
      <h2 class="leading-none m-0 text-xl">
        <button
          class="defList--button"
          {id}
          aria-expanded={expanded}
          aria-controls="{id}-details"
          on:click={() => {
            expanded = !expanded;
          }}
        >
          <span class="icon pr-2">
            <span class="cdb--icon transition" class:expanded>
              Canvas.arrow-open-up
            </span>
          </span>
          {#if expanded}
            Hide
          {:else}
            Show
          {/if}
          Page Glossary
        </button>
      </h2>

      <div
        class="defList--details"
        role="region"
        aria-labelledby={id}
        id="{id}-details"
      >
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

<style lang="postcss">
  .definitionList {
    @apply mt-4 border-t border-gray-100;
    &.defList--expanded {
      @apply transition border border-gray-200 rounded-md mb-4;
      & h2 {
        @apply border-b border-gray-100;
      }
    }
    & .defList--button {
      @apply text-lg text-left w-full transition ring-primary rounded px-3 py-2;
      @apply focus:outline-none focus-visible:ring-2;
      & .icon {
        & .expanded {
          @apply -scale-y-100;
        }
      }
    }
    & .defList--details {
      @apply overflow-hidden px-3;
    }
    dl {
      @apply mb-0 pb-3;
    }

    &.defList--mobile {
      @apply fixed bottom-0 inset-x-0 w-full z-50 bg-[#F4F4F4] border-none rounded-t-xl;
      & .defList--button {
        @apply py-3;
        & .icon {
          @apply float-right;
        }
      }
      &.defList--expanded {
        @apply mb-0 rounded-b-none border-none;
      }
      dt {
        @apply text-lg font-bold;
      }
      dd {
        @apply text-base mx-0;
      }
    }
  }
  .mobileSpacer {
    @apply h-12;
  }
</style>
