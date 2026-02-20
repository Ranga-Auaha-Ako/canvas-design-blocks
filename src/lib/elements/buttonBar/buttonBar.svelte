<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType, instClassToId } from "$lib/icons/svelte/iconPicker";
  import { ButtonBarData, ButtonBarTheme } from "./buttonBar";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ButtonBarData;
  // svelte-ignore unused-export-let
  export let localState: any;
  // svelte-ignore unused-export-let
  export let instance: any;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });

  $: visibleItems = cdbData.items.filter((item) => item.hide !== true);
  let visiblePosition: number | undefined;
  $: {
    if (cdbData.position !== undefined) {
      visiblePosition = visibleItems.findIndex(
        (item) => item === cdbData.items[cdbData.position!]
      );
    } else {
      visiblePosition = -1;
    }
  }
  $: itemLocations = visibleItems.map(
    (item, index) => index / visibleItems.length
  );
  const showSm = 1;

  $: contrastColor = cdbData.color?.isDark() ? "#fff" : "#000";
</script>

<div class="DesignBlocks--ButtonBar">
  {#if visiblePosition !== undefined && visibleItems.length > 0}
    <div
      class="buttonBar buttonBar--{cdbData.theme}"
      class:buttonBar--overflowing={visibleItems.length > 5}
      style:background-color={cdbData.theme === ButtonBarTheme.ButtonGroup
        ? cdbData.color?.toHex()
        : undefined}
      style:color={cdbData.theme === ButtonBarTheme.ButtonGroup
        ? contrastColor
        : undefined}
    >
      {#each itemLocations as loc, index}
        {@const item = visibleItems[index]}
        <a
          href={item.url}
          class="buttonBar--step"
          class:moduleProgress--before={cdbData.theme ===
            ButtonBarTheme.Progress && index < visiblePosition}
          class:moduleProgress--after={cdbData.theme ===
            ButtonBarTheme.Progress && index > visiblePosition}
          class:moduleProgress--current={index === visiblePosition &&
            cdbData.theme === ButtonBarTheme.Progress}
          style:background-color={index <= visiblePosition ||
          cdbData.theme !== ButtonBarTheme.Progress
            ? cdbData.color?.toHex()
            : undefined}
          style:color={index <= visiblePosition ||
          cdbData.theme !== ButtonBarTheme.Progress
            ? contrastColor
            : "#000"}
          title={item.label}
        >
          <span
            class="buttonBar--label"
            style:color={index <= visiblePosition ||
            cdbData.theme !== ButtonBarTheme.Progress
              ? contrastColor
              : undefined}
          >
            <span class="Module--info">
              <span class="Module--icon">
                {#if item.icon}
                  <IconElement
                    icon={item.icon}
                    colorOverride={index <= visiblePosition ||
                    cdbData.theme !== ButtonBarTheme.Progress
                      ? contrastColor
                      : "#000"}
                  />
                {:else}
                  <IconElement
                    icon={{
                      type: IconType.Line,
                      id: instClassToId("module", IconType.Line),
                    }}
                    colorOverride={index <= visiblePosition ||
                    cdbData.theme !== ButtonBarTheme.Progress
                      ? contrastColor
                      : "#000"}
                  />
                {/if}
              </span>
              <span class="Module--label">{item.label}</span>
            </span>
          </span>
        </a>
      {/each}
    </div>
  {:else if visibleItems.length > 0}
    <!-- Current position is hidden -->
    <p class="no-published">
      The module you are currently on is hidden. Try making it visible or adding
      some buttons here.
    </p>
  {:else}
    <!-- No items -->
    <p class="no-published">
      No buttons are visible. Try adding some by clicking here!
    </p>
  {/if}
</div>
