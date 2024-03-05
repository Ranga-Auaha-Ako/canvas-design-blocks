<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
</script>

<ElementPanel
  name="Glossary"
  on:add={() => {
    window
      .open(
        `/courses/${window.ENV.COURSE_ID}/pages/cdb-glossary/edit`,
        "_blank"
      )
      ?.focus();
    // window.location.href = `/courses/${window.ENV.COURSE_ID}/pages/cdb-glossary/edit`;
  }}
>
  <svelte:fragment slot="name">Edit Glossary</svelte:fragment>
  <svelte:fragment slot="icon">
    <IconElement icon={{ id: "Inst.Line.arrow-right", type: 2 }}></IconElement>
  </svelte:fragment>
</ElementPanel>
