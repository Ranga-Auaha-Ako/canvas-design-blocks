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
</script>

<div class="DesignBlocks--ProgressNav {cdbData.size}">
  {#each cdbData.items as item, index}
    <a class="Module-container" href={item.url}>
      <span
        class="ProgressNav--Card"
        class:moduleProgress--before={cdbData.position !== undefined &&
          index < cdbData.position}
        class:moduleProgress--after={cdbData.position === undefined ||
          index > cdbData.position}
        class:moduleProgress--current={cdbData.position !== undefined &&
          index === cdbData.position}
        style:background-color={cdbData.color?.toHex()}
        style:color="#fff"
      >
        <span
          class="module-bg"
          style:background-position="{(index / cdbData.items.length) * 100}% 50%"
        >
          &nbsp;
        </span>
        {#if cdbData.position !== undefined && index < cdbData.position}
          <span class="Module--checkmark Checkmark--completed"> ✓ </span>
        {/if}
      </span>
      <span class="Module--info">
        <span class="Module--icon">
          {#if item.icon}
            <IconElement icon={item.icon} colorOverride={"#fff"} />
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
