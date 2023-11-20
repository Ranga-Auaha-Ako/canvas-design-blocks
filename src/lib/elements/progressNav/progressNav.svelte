<script lang="ts">
  import IconElement from "$lib/util/components/iconSearch/iconElement.svelte";
  import { ProgressNavData } from "./progressNav";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ProgressNavData;
  // svelte-ignore unused-export-let
  export let localState: any;
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
</script>

<div class="DesignBlocks--ProgressNav {cdbData.size}">
  {#if visiblePosition !== undefined && visibleItems.length > 0}
    <div
      class="progressBar"
      class:progressBar--overflowing={visibleItems.length > 5}
    >
      {#each itemLocations as loc, index}
        {@const item = visibleItems[index]}
        <a
          href={item.url}
          class="progressBar--step"
          class:moduleProgress--before={index < visiblePosition}
          class:moduleProgress--after={index > visiblePosition}
          class:moduleProgress--current={index === visiblePosition}
          class:moduleProgress--small-hide={visibleItems.length > showSm &&
            Math.abs(index - visiblePosition) >= showSm / 2}
          style:background-color={index <= visiblePosition
            ? cdbData.color?.toHex()
            : undefined}
        >
          <span
            class="progressBar--label"
            style:color={index <= visiblePosition ? "#fff" : undefined}
          >
            <span class="Module--info">
              <span class="Module--icon">
                {#if item.icon}
                  <IconElement
                    icon={item.icon}
                    colorOverride={index <= visiblePosition ? "#fff" : "#000"}
                  />
                {:else}
                  <span class="icon">
                    <i class="icon-Line icon-module" />
                  </span>
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
      The module you are currently on is hidden. Try adding some to your course!
    </p>
  {:else}
    <!-- No items -->
    <p class="no-published">
      No Published Modules Found! Try adding some to your course to see this.
    </p>
  {/if}
</div>
