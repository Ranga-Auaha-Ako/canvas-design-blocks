<script lang="ts">
  import { courseEnv } from "$lib/util/courseEnv";
  import type {
    GlossaryClientManager,
    glossaryState,
  } from "./glossaryClientManager";

  // This loads on the client side on the glossary page
  export let manager: GlossaryClientManager;
  export let glossaryData: string;
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
    {#each parsedData.terms.sort( (a, b) => a.term.localeCompare(b.term) ) as { term, definition }, i}
      <dt>
        {term}
      </dt>
      <dd class="mb-4">
        {definition}
      </dd>
    {/each}
  </dl>

  <h2 class="">Institution-Provided Terms</h2>
  <dl class="mx-4">
    {#if parsedData.institutionDefaults}
      {#each manager.institutionTerms.sort( (a, b) => a.term.localeCompare(b.term) ) as { term, definition }, i}
        <dt>
          {term}
        </dt>
        <dd class="mb-4">
          {definition}
        </dd>
      {/each}
    {:else}
      <p>No institution-provided terms are enabled.</p>
    {/if}
  </dl>
</div>
