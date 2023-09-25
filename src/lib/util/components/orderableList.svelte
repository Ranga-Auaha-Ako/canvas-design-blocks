<script lang="ts">
  import Sortable from "sortablejs";
  import { createEventDispatcher } from "svelte";

  export let labelKey: string;
  export let idKey: string;
  export let items: Record<any, any>[];
  export let showEdit: boolean = false;
  export let canDelete: boolean = true;
  export let actions: (item: any) => {
    title: string;
    icon: string;
    event: string;
  }[] = () => [];
  export let activeClass: string = "active";
  export let activeId: string | undefined = undefined;
  let itemList: HTMLElement;

  const dispatch = createEventDispatcher();

  const deleteItem = (item: any) => {
    items = items.filter((p) => p !== item);
    dispatch("update");
    dispatch("delete", item[idKey]);
  };

  const handleItemOrder = (
    event:
      | { oldIndex: number | undefined; newIndex: number | undefined }
      | undefined
  ) => {
    const { oldIndex, newIndex } = event || {};
    if (oldIndex !== undefined && newIndex !== undefined) {
      const input = [...items];
      const elm = input.splice(oldIndex, 1)[0];
      input.splice(newIndex, 0, elm);
      items = [...input];
    }
  };

  $: sortable =
    itemList &&
    new Sortable(itemList, {
      animation: 200,
      handle: ".dragHandle",
      onEnd: (event) => {
        handleItemOrder(event);
      },
    });
</script>

<div
  class="itemList"
  class:emptyitemList={items.length === 0}
  bind:this={itemList}
>
  {#if items}
    {#each items as item, _ (item[idKey])}
      <div
        class="item {activeId !== undefined && item[idKey] === activeId
          ? activeClass
          : ''}"
      >
        <div class="dragHandle">
          <i class="icon-solid icon-drag-handle" />
        </div>
        {#if showEdit}
          <button
            class="itemlabel"
            on:click|stopPropagation={() => {
              dispatch("edit", item[idKey]);
            }}
          >
            {item[labelKey]}
          </button>
        {:else}
          <div class="itemlabel">
            {item[labelKey]}
          </div>
        {/if}
        <div class="actions">
          {#if showEdit}
            <button
              title="Edit {item[labelKey]}"
              on:click|stopPropagation={() => {
                dispatch("edit", item[idKey]);
              }}
            >
              <i
                class:icon-Solid={activeId !== undefined &&
                  item[idKey] === activeId}
                class="icon-edit"
              />
            </button>
          {/if}
          {#each actions(item) as action}
            <button
              title={action.title}
              on:click|stopPropagation={() => {
                dispatch(action.event, item[idKey]);
              }}
            >
              <i class={action.icon} />
            </button>
          {/each}
          {#if canDelete}
            <button
              title="Delete {item[labelKey]}"
              on:click={() => {
                deleteItem(item);
              }}
            >
              <i class="icon-trash" />
            </button>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style lang="postcss">
  .itemList {
    @apply flex flex-col gap-y-2;
    width: 100%;
    &.emptyitemList {
      @apply hidden;
    }
    .item {
      @apply flex items-center gap-x-2;
      @apply transition;
      transition-property: background-color, padding, margin;
      .dragHandle {
        @apply cursor-pointer;
      }
      .itemlabel {
        @apply flex-1 truncate text-base;
      }
      .actions {
        @apply flex gap-x-2;
      }
    }
  }
</style>
