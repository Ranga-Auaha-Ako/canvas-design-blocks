<script lang="ts">
  import { HeaderData } from "./courseHeader";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: HeaderData;
</script>

<div
  class="headerInner {cdbData.theme}"
  style:background-image="url('{cdbData.image}')"
>
  <div class="overlay">
    <!-- svelte-ignore a11y-missing-content -->
    <h3
      class="headerTitle"
      contenteditable="true"
      bind:innerText={cdbData.title}
      on:input={() => {
        dispatch("update", cdbData);
      }}
    />
    <div
      class="headerOverview"
      contenteditable="true"
      bind:innerHTML={cdbData.overview}
      on:input={() => {
        dispatch("update", cdbData);
      }}
    />
    <div class="headerLinks">
      {#each cdbData.links as link}
        <a
          class="headerLink"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.title}
        </a>
      {/each}
    </div>
  </div>
</div>
