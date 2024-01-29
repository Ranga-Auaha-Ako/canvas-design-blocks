<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { HeaderData, HeaderLevel, HeaderTheme } from "./courseHeader";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: HeaderData;
  // svelte-ignore unused-export-let
  export let localState: any;

  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="headerInner {cdbData.theme}"
  class:noImage={!cdbData.image}
  tabindex="0"
>
  {#if cdbData.theme === HeaderTheme["Modern"]}
    {#if cdbData.icon}
      <div class="iconComponent">
        <IconElement icon={cdbData.icon}></IconElement>
      </div>
      <div class="iconOverlay">
        <IconElement icon={cdbData.icon}></IconElement>
      </div>
    {/if}
    {#if cdbData.image}
      <div class="imageComponent">
        <img
          class="headerImage"
          src={cdbData.image}
          alt=""
          role="presentation"
        />
        <div class="imageOverlay">&nbsp;</div>
      </div>
    {/if}
  {:else if cdbData.image}
    <img class="headerImage" src={cdbData.image} alt="" role="presentation" />
    <div class="imageOverlay">&nbsp;</div>
  {/if}
  <div class="overlay">
    <!-- svelte-ignore a11y-missing-content -->
    {#if !cdbData.level || cdbData.level === HeaderLevel.h2}
      <h2
        class="headerTitle"
        contenteditable="true"
        bind:innerText={cdbData.title}
        on:input={() => {
          dispatch("update", cdbData);
        }}
      />
    {:else if cdbData.level === HeaderLevel.h3}
      <h3
        class="headerTitle"
        contenteditable="true"
        bind:innerText={cdbData.title}
        on:input={() => {
          dispatch("update", cdbData);
        }}
      />
    {:else}
      <h4
        class="headerTitle"
        contenteditable="true"
        bind:innerText={cdbData.title}
        on:input={() => {
          dispatch("update", cdbData);
        }}
      />
    {/if}
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
          target={link.target !== undefined ? link.target : "_blank"}
          rel="noopener noreferrer"
        >
          {link.title}
        </a>
      {/each}
    </div>
  </div>
</div>
