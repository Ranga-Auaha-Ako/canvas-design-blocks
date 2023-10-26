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
    if (cdbData.position) {
      visiblePosition = 0;
      cdbData.items.forEach((item, index) => {
        if (item.hide !== true && index < cdbData.position!) {
          visiblePosition!++;
        }
      });
    }
  }
</script>

<div class="DesignBlocks--ProgressNav {cdbData.size}">
  <div class="ProgressNav--Bar">
    <!-- Progress Bar -->
    <div
      class="ProgressNav--Bar--Progress"
      style:width={visiblePosition !== undefined
        ? `${Math.min(
            ((visiblePosition + 0.5) / cdbData.items.length) * 100,
            100
          )}%`
        : "0%"}
      style:background-color={cdbData.color?.toHex()}
      style:color={"#fff"}
    >
      &nbsp;
    </div>
    {#each visibleItems as item, index}
      <div class="ProgressNav--Bar--Step">
        {#if visiblePosition !== undefined && index < visiblePosition}
          <span
            class="Module--checkmark Checkmark--completed"
            style:background-color={cdbData.color?.toHex()}
            style:color={"#fff"}
          >
            ✓
          </span>
        {:else if index === visiblePosition}
          <span class="Module--checkmark Checkmark--current"> &#8963; </span>
        {:else}
          &nbsp;
        {/if}
      </div>
    {/each}
  </div>
  <div class="ProgressNav--Steps">
    {#each visibleItems as item, index}
      <a
        class="Module-container"
        class:moduleProgress--before={visiblePosition !== undefined &&
          index < visiblePosition}
        class:moduleProgress--after={visiblePosition === undefined ||
          index > visiblePosition}
        class:moduleProgress--current={visiblePosition !== undefined &&
          index === visiblePosition}
        href={item.url}
      >
        <span class="Module--info">
          <span class="Module--icon">
            {#if item.icon}
              <IconElement icon={item.icon} colorOverride={"#000"} />
            {:else}
              <span class="icon">
                <i class="icon-Line icon-module" />
              </span>
            {/if}
          </span>
          <span class="Module--label">{item.label}</span>
        </span>
      </a>
    {:else}
      <!-- No items -->
      <p class="no-published">
        No Published Modules Found! Try adding some to your course to see this.
      </p>
    {/each}
  </div>
</div>
