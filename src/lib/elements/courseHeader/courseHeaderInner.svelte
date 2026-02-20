<script lang="ts">
    import IconElement from "$lib/icons/svelte/iconElement.svelte";
    import {colord} from "colord";
    import {
        type CourseHeader,
        HeaderData,
        HeaderLevel,
        HeaderTheme,
    } from "./courseHeader";
    import {createEventDispatcher, onDestroy} from "svelte";
    import theme from "$lib/util/theme";


    const dispatch = createEventDispatcher();

    export let cdbData: HeaderData;
    // svelte-ignore unused-export-let
    export let localState: any;
    export let instance: CourseHeader;
    export let destroyHandler: () => void;

    $: contrastColor = cdbData.backgroundColor?.isDark() ? "#fff" : "#000";
    onDestroy(() => {
        destroyHandler();
    });

    $: transparentColor = colord(cdbData.backgroundColor?.toHex() || "#fff").alpha(0.3);

    // Add state tracking for previous theme
    let previousTheme = cdbData.theme;
    $: {
        if (previousTheme !== cdbData.theme) {
            // Theme has changed
            previousTheme = cdbData.theme;
        }
    }

    $: titleContent = cdbData.theme === previousTheme
        ? cdbData.title
        : cdbData.title.includes('<span') || cdbData.title.includes('style=')
            ? extractTextOnly(cdbData.title)
            : cdbData.title;


    function extractTextOnly(html: string): string {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || html;
    }


    // Update to handle both title and overview
    function setupMutationObserver(node: HTMLElement, field: 'title' | 'overview') {
        let observer: MutationObserver | undefined;

        setTimeout(() => {
            observer = new MutationObserver(() => {
                if (field === 'title') {
                    cdbData.title = node.innerHTML;
                } else {
                    cdbData.overview = node.innerHTML;
                }
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


    // Reusable paste handler for title and overview
    function handlePaste(e: ClipboardEvent, field: 'title' | 'overview') {
        const text = e.clipboardData?.getData("text/plain");
        if (!text) return;

        const win = instance.window;
        const doc = win.document;
        const sel = win.getSelection();
        const target = e.currentTarget;

        if (sel?.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();

            if (field === 'overview') {
                // Convert line breaks to <br> for overview
                const lines = text.split(/\r?\n/);
                const fragment = doc.createDocumentFragment();
                lines.forEach((line, index) => {
                    if (index > 0) fragment.appendChild(doc.createElement("br"));
                    fragment.appendChild(doc.createTextNode(line));
                });
                range.insertNode(fragment);
            } else {
                range.insertNode(doc.createTextNode(text));
            }

            // Sync DOM back to store
            if (target instanceof HTMLElement) {
                if (field === 'title') {
                    cdbData.title = target.innerHTML;
                } else {
                    cdbData.overview = target.innerHTML;
                }
            }
        }
        sel?.collapseToEnd();
        dispatch("update", cdbData);
    }


    function getAppropriateTextColor(data: HeaderData): string {
        // For non-Modern themes, use theme-specific colors
        if (data.theme !== HeaderTheme.Modern) {
            return [HeaderTheme.Dark, HeaderTheme.Blur].includes(data.theme)
                ? '#ffffff'
                : '#000000';
        }

        // For Modern theme with background color, use contrast
        if (data.backgroundColor) {
            return data.backgroundColor.isDark() ? '#ffffff' : '#000000';
        }

        // For Modern theme with explicit text color
        if (data.textColor) {
            return data.textColor.toHex();
        }

        // Default for Modern theme without any colors set
        return '#000000';
    }

</script>


<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="headerInner {cdbData.theme}"
  class:noImage={!cdbData.image}
  class:hasColor={cdbData.backgroundColor}
  class:phpally-ignore={cdbData.backgroundColor && cdbData.theme === HeaderTheme.Modern}
  style:background-color={cdbData.theme === HeaderTheme["Modern"]
    ? cdbData.backgroundColor?.toHex()
    : undefined}
  style:color={cdbData.backgroundColor && cdbData.theme === HeaderTheme["Modern"]
    ? contrastColor
    : undefined}
  data-mce-style={cdbData.backgroundColor && cdbData.theme === HeaderTheme["Modern"]
    ? `background: ${cdbData.backgroundColor?.toHex()}; color: ${contrastColor}`
    : undefined}
  class:isDark={cdbData.theme === HeaderTheme.Modern
    ? cdbData.backgroundColor?.isDark()
    : cdbData.theme === HeaderTheme.Dark}
  role="region"
  aria-label="Header"
  tabindex="0"
>
  {#if cdbData.theme === HeaderTheme["Modern"]}
    {#if cdbData.icon}
      <div class="iconComponent">
        <IconElement
          icon={cdbData.icon}
          colorOverride={cdbData.backgroundColor ? contrastColor : undefined}
        ></IconElement>
      </div>
      <div class="iconOverlay">
        <IconElement
          icon={cdbData.icon}
          colorOverride={cdbData.backgroundColor ? contrastColor : undefined}
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
    <img class="headerImage" src={cdbData.image} alt="" role="presentation"/>
    <div class="imageOverlay">&nbsp;</div>
  {/if}

  <div class="overlay">
    <!-- Reusable element for h2, h3, h4-->
    <svelte:element
      this={cdbData.level || HeaderLevel.h2}
      class="headerTitle"
      class:phpally-ignore={true}
      contenteditable="true"
      role="textbox"
      tabindex="0"
      use:setupMutationObserver={'title'}
      bind:innerHTML={cdbData.title}
      style:color={getAppropriateTextColor(cdbData)}
      style:background-color={cdbData.theme === HeaderTheme.Modern && cdbData.backgroundColor ?
          cdbData.backgroundColor.toHex() : undefined}
      on:keydown|capture={(e) => {
          e.stopPropagation();
        }}
      on:paste|stopPropagation|preventDefault={(e) => handlePaste(e, 'title')}
      on:input={() => {
          // If theme has changed and title contains HTML styling, extract plain text
          if (previousTheme !== cdbData.theme &&
              (cdbData.title.includes('<span') || cdbData.title.includes('style='))) {
            cdbData.title = extractTextOnly(cdbData.title);
          }
          dispatch("update", cdbData);
        }}
    />

    <div
      class="headerOverview"
      contenteditable="true"
      use:setupMutationObserver={'overview'}
      bind:innerHTML={cdbData.overview}
      role="textbox"
      aria-multiline="true"
      tabindex="0"
      on:keydown|capture={(e) => {
        e.stopPropagation();
      }}
      on:paste|stopPropagation|preventDefault={(e) => handlePaste(e, 'overview')}
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
            style:background-color={cdbData.backgroundColor &&
            cdbData.theme === HeaderTheme["Modern"]
              ? contrastColor
              : undefined}
            style:color={cdbData.theme === HeaderTheme["Modern"]
              ? cdbData.backgroundColor?.toHex()
              : undefined}
            data-mce-style={cdbData.backgroundColor &&
            cdbData.theme === HeaderTheme["Modern"]
              ? `color: ${cdbData.backgroundColor?.toHex()}; background-color: ${contrastColor}`
              : undefined}
          >
            {#if link.icon}
              <IconElement
                icon={link.icon}
                colorOverride={cdbData.theme === HeaderTheme["Modern"]
                ? cdbData.backgroundColor?.toHex()
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
      style:color={cdbData.backgroundColor ? contrastColor : undefined}
      data-mce-style={cdbData.backgroundColor ? `color: ${contrastColor}` : undefined}
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
              colorOverride={cdbData.backgroundColor ? contrastColor : theme.primary}
            />
          {/if}
          <span class="headerLink--titles">
            {#each link.title.split("\n") as title, index}
              <span class="headerLink--title">{title}</span>
              {#if index !== link.title.split("\n").length - 1}
                <br/>
              {/if}
            {/each}
          </span>
        </a>
      {/each}
    </div>
  {/if}

</div>
