<script lang="ts">
  import { courseEnv } from "$lib/util/courseEnv";
  import type {
    GlossaryClientManager,
    glossaryState,
  } from "./glossaryClientManager";

  // This loads on the client side on the glossary page
  export let manager: GlossaryClientManager;
  export let glossaryData: glossaryState;
</script>

<div class="cgb-component">
  <h1 class="text-3xl block">Course Glossary</h1>
  <p>
    This course defines the following terms. Words defined here will be
    highlighted in the course content,
    {#if courseEnv.current_user_is_student}
      and you can click on them to see the definition.
    {:else}
      and students can click on them to see the definition. You can edit this
      glossary by clicking the "Edit" button.
    {/if}
  </p>
  <dl class="mx-4">
    {#each glossaryData.terms.sort( (a, b) => a.term.localeCompare(b.term) ) as { term, definition }, i}
      <dt>
        {term}
      </dt>
      <dd class="mb-4">
        {@html definition}
      </dd>
    {/each}
  </dl>

  {#if glossaryData.institutionDefaults}
    <h2 class="">Institution-Provided Terms</h2>
    <dl class="mx-4">
      {#each manager.institutionTerms.sort( (a, b) => a.term.localeCompare(b.term) ) as { term, definition }, i}
        <dt>
          {term}
        </dt>
        <dd class="mb-4">
          {@html definition}
        </dd>
      {/each}
    </dl>
  {/if}
</div>
