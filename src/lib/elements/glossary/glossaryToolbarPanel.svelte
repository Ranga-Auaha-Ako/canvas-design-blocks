<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import { courseEnv } from "$lib/util/courseEnv";
  import { PAGE_CREATED, PAGE_URL } from "./glossaryClientManager";
</script>

<ElementPanel
  title="Edit Glossary"
  on:add={async () => {
    window
      .open(
        `/courses/${courseEnv.COURSE_ID}/pages/${await PAGE_URL}/edit`,
        "_blank"
      )
      ?.focus();
    // window.location.href = `/courses/${courseEnv.COURSE_ID}/pages/cdb-glossary/edit`;
  }}
>
  <svelte:fragment slot="name">
    {#await PAGE_CREATED then isCreated}
      {#if isCreated}
        Edit Glossary
      {:else}
        Create Glossary
      {/if}
    {/await}
  </svelte:fragment>
  <svelte:fragment slot="icon">
    {#await PAGE_CREATED then isCreated}
      {#if isCreated}
        <IconElement
          icon={{ id: "Inst.Line.arrow-right", type: IconType.Custom }}
        />
      {:else}
        <IconElement icon={{ id: "Inst.Line.add", type: IconType.Custom }} />
      {/if}
    {/await}
  </svelte:fragment>
</ElementPanel>
