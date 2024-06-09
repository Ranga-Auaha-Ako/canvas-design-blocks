<script lang="ts">
  import { courseEnv } from "$lib/util/courseEnv";
  import { nanoid } from "nanoid";
  import { slide } from "svelte/transition";
  import { GLOSSARY_ENABLED } from "../glossaryClientManager";

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
      <h2 class="defList--header">
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
            <span
              class="cdb--icon transition"
              class:expanded
              aria-hidden="true"
            >
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
        <input
          type="checkbox"
          bind:checked={$GLOSSARY_ENABLED}
          id="GLOSSARY_ENABLED"
        />
        <label
          for="GLOSSARY_ENABLED"
          class="defList--enableCheck"
          title="Highlight Terms?"
        >
          <span class="defList--enableCheck--desc">
            {$GLOSSARY_ENABLED ? "Hide" : "Show"} Tooltips
          </span>
          <span class="cdb--icon" aria-hidden="true">
            {#if $GLOSSARY_ENABLED}
              Canvas.eye
            {:else}
              Canvas.off
            {/if}
          </span>
        </label>
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
    & .defList--header {
      @apply leading-none m-0 text-xl w-full flex items-center;
      & .defList--button {
        @apply text-lg text-left grow transition ring-primary rounded px-3 py-2;
        @apply focus:outline-none focus-visible:ring-2;
        & .icon {
          & .expanded {
            @apply -scale-y-100;
          }
        }
      }

      #GLOSSARY_ENABLED {
        @apply sr-only;
        &:focus-visible {
          @apply not-sr-only;
        }
      }
      & .defList--enableCheck {
        @apply text-gray-500 mx-2 cursor-pointer transition m-0 relative text-sm;
        line-height: 2rem;
        .cdb--icon {
          @apply w-8 h-8 text-center rounded-full bg-black bg-opacity-0;
          font-size: 1.25rem;
        }
        .defList--enableCheck--desc {
          @apply invisible w-0 h-0 opacity-0 transition-opacity overflow-hidden text-nowrap inline-block align-middle select-none;
          line-height: 2rem;
        }
        &:hover {
          .cdb--icon {
            @apply bg-opacity-5;
          }
          .defList--enableCheck--desc {
            @apply visible w-auto h-5 opacity-100 leading-none;
          }
        }
      }
      #GLOSSARY_ENABLED:focus-visible + .defList--enableCheck {
        @apply ring-2 ring-primary rounded-sm;
        .defList--enableCheck--desc {
          @apply visible w-auto h-5 opacity-100 leading-none;
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
        box-shadow:
          0 10px 2rem 0 #00000036,
          0 5px 8px 0 #0000005c;
        background: #f4f4f4e3;
        backdrop-filter: saturate(1.3) contrast(1.3) blur(1.3rem);
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
