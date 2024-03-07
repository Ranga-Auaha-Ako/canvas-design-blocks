<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import { courseEnv } from "$lib/util/courseEnv";
  import { PAGE_URL } from "./glossaryClientManager";
</script>

<ElementPanel
  name="Glossary"
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
    <IconElement icon={{ id: "General.icon1-83", type: IconType.Custom }}
    ></IconElement>
    Edit Glossary
  </svelte:fragment>
  <svelte:fragment slot="icon">
    <IconElement icon={{ id: "Inst.Line.arrow-right", type: IconType.Custom }}
    ></IconElement>
  </svelte:fragment>
</ElementPanel>
