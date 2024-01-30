<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { colord } from "colord";
  import { HeaderData, HeaderLevel, HeaderTheme } from "./courseHeader";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: HeaderData;
  // svelte-ignore unused-export-let
  export let localState: any;

  export let destroyHandler: () => void;

  $: contrastColor = cdbData.color?.isDark() ? "#fff" : "#000";
  onDestroy(() => {
    destroyHandler();
  });

  $: transparentColor = colord(cdbData.color?.toHex() || "#fff").alpha(0.5);
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="headerInner {cdbData.theme}"
  class:noImage={!cdbData.image}
  style:background-color={cdbData.color?.toHex()}
  style:color={cdbData.color ? contrastColor : undefined}
  data-mce-style={cdbData.color
    ? `background: ${cdbData.color?.toHex()}; color: ${contrastColor}`
    : undefined}
  class:isDark={cdbData.theme === HeaderTheme.Modern
    ? cdbData.color?.isDark()
    : cdbData.theme === HeaderTheme.Dark}
  tabindex="0"
>
  {#if cdbData.theme === HeaderTheme["Modern"]}
    {#if cdbData.icon}
      <div class="iconComponent">
        <IconElement
          icon={cdbData.icon}
          colorOverride={cdbData.color ? contrastColor : undefined}
        ></IconElement>
      </div>
      <div class="iconOverlay">
        <IconElement
          icon={cdbData.icon}
          colorOverride={cdbData.color ? contrastColor : undefined}
        ></IconElement>
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
        <div
          class="imageOverlay--blur"
          style:background-color={transparentColor.toHex()}
          style:color={transparentColor ? contrastColor : undefined}
          data-mce-style={transparentColor
            ? `background: ${transparentColor.toHex()}; color: ${contrastColor}`
            : undefined}
        >
          &nbsp;
        </div>
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
