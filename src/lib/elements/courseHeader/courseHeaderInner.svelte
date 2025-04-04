<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { colord } from "colord";
  import {
    type CourseHeader,
    HeaderData,
    HeaderLevel,
    HeaderTheme,
  } from "./courseHeader";
  import { createEventDispatcher, onDestroy } from "svelte";
  import theme from "$lib/util/theme";

  const dispatch = createEventDispatcher();

  export let cdbData: HeaderData;
  // svelte-ignore unused-export-let
  export let localState: any;
  export let instance: CourseHeader;

  export let destroyHandler: () => void;

  $: contrastColor = cdbData.color?.isDark() ? "#fff" : "#000";
  onDestroy(() => {
    destroyHandler();
  });

  $: transparentColor = colord(cdbData.color?.toHex() || "#fff").alpha(0.3);

  function setupMutationObserver(node: HTMLElement) {
    let observer: MutationObserver | undefined;

    setTimeout(() => {
      observer = new MutationObserver(() => {
        // Simply update the state with current innerHTML
        cdbData.title = node.innerHTML;
        dispatch("update", cdbData);
      });

      observer.observe(node, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }, 0);

    return {
      destroy() {
        if (observer) {
          observer.disconnect();
        }
      }
    };
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="headerInner {cdbData.theme}"
  class:noImage={!cdbData.image}
  class:hasColor={cdbData.color}
  style:background-color={cdbData.theme === HeaderTheme["Modern"]
    ? cdbData.color?.toHex()
    : undefined}
  style:color={cdbData.color && cdbData.theme === HeaderTheme["Modern"]
    ? contrastColor
    : undefined}
  data-mce-style={cdbData.color && cdbData.theme === HeaderTheme["Modern"]
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
    {#if !cdbData.level || cdbData.level === HeaderLevel.h2}
      <h2
        class="headerTitle"
        contenteditable="true"
        bind:innerHTML={cdbData.title}
        style:color={cdbData.color ? cdbData.color.toHex() : undefined}
        style:background-color={cdbData.backgroundColor ? cdbData.backgroundColor.toHex() : undefined}
        use:setupMutationObserver

        on:keydown|capture={(e) => {
          e.stopPropagation();
        }}

        on:paste|stopPropagation|preventDefault={(e) => {
          const text = e.clipboardData?.getData("text/plain");
          if (text) {
            const win = instance.window;
            const doc = win.document;
            const sel = win.getSelection();
            if (sel?.rangeCount) {
              const range = sel.getRangeAt(0);
              range.deleteContents();
              const textNode = doc.createTextNode(text);
              range.insertNode(textNode);

              // Update the state with the new content
              const container = range.commonAncestorContainer;
              if (container instanceof HTMLElement) {
                cdbData.title = container.innerHTML;
              } else if (container.parentElement) {
                cdbData.title = container.parentElement.innerHTML;
              }

              dispatch("update", cdbData);
            }
            sel?.collapseToEnd();
          }
        }}

      on:input={() => {
        dispatch("update", cdbData);
      }}
    />

    {:else if cdbData.level === HeaderLevel.h3}
      <h3
        class="headerTitle"
        contenteditable="true"
        bind:innerHTML={cdbData.title}
        style:color={cdbData.color ? cdbData.color.toHex() : undefined}
        style:background-color={cdbData.backgroundColor ? cdbData.backgroundColor.toHex() : undefined}
        on:keydown|capture={(e) => {
          e.stopPropagation();
        }}
        on:paste|stopPropagation|preventDefault={(e) => {
          const text = e.clipboardData?.getData("text/plain");
          if (text) {
            const win = instance.window;
            const doc = win.document;
            const sel = win.getSelection();
            if (sel?.rangeCount) {
              const range = sel.getRangeAt(0);
              range.deleteContents();
              const textNode = doc.createTextNode(text);
              range.insertNode(textNode);
            }
            sel?.collapseToEnd();
          }
          dispatch("update", cdbData);
        }}
        on:input={() => {
          dispatch("update", cdbData);
        }}
      />
    {:else}
      <h4
        class="headerTitle"
        contenteditable="true"
        bind:innerHTML={cdbData.title}
        style:color={cdbData.color ? cdbData.color.toHex() : undefined}
        style:background-color={cdbData.backgroundColor ? cdbData.backgroundColor.toHex() : undefined}
        on:keydown|capture={(e) => {
          e.stopPropagation();
        }}
        on:paste|stopPropagation|preventDefault={(e) => {
          const text = e.clipboardData?.getData("text/plain");
          if (text) {
            const win = instance.window;
            const doc = win.document;
            const sel = win.getSelection();
            if (sel?.rangeCount) {
              const range = sel.getRangeAt(0);
              range.deleteContents();
              const textNode = doc.createTextNode(text);
              range.insertNode(textNode);
            }
            sel?.collapseToEnd();
          }
          dispatch("update", cdbData);
        }}
        on:input={() => {
          dispatch("update", cdbData);
        }}
      />
    {/if}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="headerOverview"
      contenteditable="true"
      on:keydown|capture={(e) => {
        e.stopPropagation();
      }}
      on:paste|stopPropagation|preventDefault={(e) => {
        // Strip formatting from pasted text
        const text = e.clipboardData?.getData("text/plain");
        const html = e.clipboardData?.getData("text/html");
        const tinymce = false && e.clipboardData?.getData("x-tinymce/html");
        const content = tinymce || html || text;
        if (content) {
          const win = instance.window;
          const doc = win.document;
          const sel = win.getSelection();
          if (sel?.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const newContent = doc
              .createRange()
              .createContextualFragment(content);
            // Strip colour formatting
            newContent.querySelectorAll("[style]").forEach((el) => {
              if (el instanceof win.HTMLElement) {
                el.style.color = "";
                el.style.backgroundColor = "";
              }
            });
            range.insertNode(newContent);
          }
          sel?.collapseToEnd();
        }
      }}
      bind:innerHTML={cdbData.overview}
      on:input={() => {
        dispatch("update", cdbData);
      }}
    ></div>
    {#if [HeaderTheme.Dark, HeaderTheme.Light, HeaderTheme.Blur].includes(cdbData.theme)}
      <div class="headerLinks">
        {#each cdbData.links as link}
          <a
            class="headerLink"
            href={link.url}
            target={link.target !== undefined ? link.target : "_blank"}
            rel="noopener noreferrer"
            style:background-color={cdbData.color &&
            cdbData.theme === HeaderTheme["Modern"]
              ? contrastColor
              : undefined}
            style:color={cdbData.theme === HeaderTheme["Modern"]
              ? cdbData.color?.toHex()
              : undefined}
            data-mce-style={cdbData.color &&
            cdbData.theme === HeaderTheme["Modern"]
              ? `color: ${cdbData.color?.toHex()}; background-color: ${contrastColor}`
              : undefined}
          >
            {#if link.icon}
              <IconElement
                icon={link.icon}
                colorOverride={cdbData.theme === HeaderTheme["Modern"]
                  ? cdbData.color?.toHex()
                  : "#fff"}
              />
            {/if}
            {link.title}
          </a>
        {/each}
      </div>
    {/if}
  </div>
  {#if cdbData.theme === HeaderTheme.Modern && cdbData.links.length > 0}
    <div
      class="headerLinks headerLinkTray"
      style:color={cdbData.color ? contrastColor : undefined}
      data-mce-style={cdbData.color ? `color: ${contrastColor}` : undefined}
    >
      {#each cdbData.links as link}
        <a
          class="headerLink"
          href={link.url}
          target={link.target !== undefined ? link.target : "_blank"}
          rel="noopener noreferrer"
        >
          {#if link.icon}
            <IconElement
              icon={link.icon}
              colorOverride={cdbData.color ? contrastColor : theme.primary}
            />
          {/if}
          <span class="headerLink--titles">
            {#each link.title.split("\n") as title, index}
              <span class="headerLink--title">{title}</span>
              {#if index !== link.title.split("\n").length - 1}
                <br />
              {/if}
            {/each}
          </span>
        </a>
      {/each}
    </div>
  {/if}
</div>
