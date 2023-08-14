<script lang="ts">
  import Sortable from "sortablejs";
  import { createEventDispatcher } from "svelte";

  export let labelKey: string;
  export let idKey: string;
  export let items: Record<any, any>[];
  export let showEdit: boolean = false;
  let itemList: HTMLElement;

  const dispatch = createEventDispatcher();

  const deleteItem = (item: any) => {
    items = items.filter((p) => p !== item);
    dispatch("update");
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
      <div class="item">
        <div class="dragHandle">
          <i class="icon-solid icon-drag-handle" />
        </div>
        <div class="itemlabel">
          {item[labelKey]}
        </div>
        <div class="actions">
          {#if showEdit}
            <button
              title="Edit {item[labelKey]}"
              on:click|stopPropagation={() => {
                dispatch("edit", item[idKey]);
              }}
            >
              <i class="icon-edit" />
            </button>
          {/if}
          <button
            title="Delete {item[labelKey]}"
            on:click={() => {
              deleteItem(item);
            }}
          >
            <i class="icon-trash" />
          </button>
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
      .dragHandle {
        @apply cursor-pointer;
      }
      .itemlabel {
        @apply flex-1 truncate;
      }
      .actions {
        @apply flex gap-x-2;
      }
    }
  }
</style>
