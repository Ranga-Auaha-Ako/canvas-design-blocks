<script lang="ts">
  import { ComponentProps, createEventDispatcher } from "svelte";
  import OrderableList from "../orderableList.svelte";
  import { nanoid } from "nanoid";

  export let items: Record<string, any>[] = [];
  export let idKey = "id";
  export let addDefaults: false | Record<any, any> = false;
  export let OrderableListOptions: Partial<
    Pick<
      ComponentProps<OrderableList>,
      | "labelKey"
      | "idKey"
      | "showEdit"
      | "canDelete"
      | "canReorder"
      | "actions"
      | "canDeselect"
    >
  >;

  export let selectedId: any | null = null;
  $: selectedIndex = items.findIndex((item) => item[idKey] === selectedId);
  const dispatch = createEventDispatcher<{
    edit: string;
    delete: string;
  }>();

  $: canDelete = OrderableListOptions.canDelete !== false && items.length > 1;

  const addItem = () => {
    items.push({
      ...addDefaults,
      [idKey]: nanoid(),
    });
    selectedId = items[items.length - 1].id;
    items = items;
  };
</script>

<div class="itemGrid">
  <div class="col">
    <OrderableList
      labelKey="label"
      {idKey}
      showEdit={true}
      {...OrderableListOptions}
      bind:items
      on:edit={({ detail: id }) => {
        dispatch("edit", id);
        selectedId = id;
      }}
      on:delete={({ detail: id }) => {
        dispatch("delete", id);
        const index = items.findIndex((i) => i[idKey] === id);
        if (selectedId === id) {
          if (index > 0) selectedId = items[index - 1].moduleID;
          else selectedId = items[0].moduleID;
        }
      }}
      activeId={selectedId}
      {canDelete}
    />
    {#if addDefaults}
      <button class="Button Button--small" on:click={() => addItem()}>
        <i class="icon-plus" aria-hidden="true" />
        Add Card</button
      >
    {/if}
  </div>
  <div class="col col-contents">
    <slot name="header" />
    {#if selectedIndex !== undefined}
      <slot itemIndex={selectedIndex} />
    {/if}
  </div>
</div>

<style lang="postcss">
  .itemGrid {
    @apply grid grid-flow-col grid-cols-3 gap-4;
  }
  .col {
    @apply flex flex-col gap-2;
  }
  .col-contents {
    @apply col-span-2;
  }
</style>
