<script lang="ts">
  import writableDerived from "svelte-writable-derived";
  import { Button } from "./button";

  export let props: { button: Button };
  $: button = props.button;

  let configEl: HTMLElement;

  $: href = button.attributes.get("href");
  $: target = button.attributes.get("target");
  $: title = button.attributes.get("title");
  $: innerText = button.innerText;

  const validClasses = [
    ["", "Default"],
    ["Button--primary", "Primary"],
    ["Button--secondary", "Secondary"],
    ["Button--warning", "Warning"],
    ["Button--danger", "Danger"],
    ["Button--success", "Success"],
  ];
  $: styleClass = writableDerived<typeof button.classList, string>(
    button.classList,
    (classes) => {
      return (
        Array.from(classes).filter((c) =>
          validClasses.map((v) => v[0]).includes(c)
        )[0] || ""
      );
    },
    {
      withOld: (choice, existing) => {
        validClasses.forEach((v) => v[0] && existing.remove(v[0]));
        choice && existing.add(choice);
        return existing;
      },
    }
  );
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  on:focusin={() => button.select("ButtonConfig")}
  on:focusout={() => button.deselect("ButtonConfig")}
>
  <label for="buttonTextConfig">Button Text</label>
  <input type="text" id="buttonTextConfig" bind:value={$innerText} />
  <label for="buttonLinkConfig">Button Link</label>
  <input type="url" id="buttonLinkConfig" bind:value={$href} />
  <label for="buttonTargetConfig">Button Target</label>
  <select id="buttonTargetConfig" bind:value={$target}>
    <option value="">Same Window</option>
    <option value="_blank">New Window</option>
  </select>
  <label for="buttonTitleConfig">Button Title (hover)</label>
  <input type="text" id="buttonTitleConfig" bind:value={$title} />
  <label for="buttonStyleConfig">Button Style</label>
  <select id="buttonStyleConfig" bind:value={$styleClass}>
    {#each validClasses as [classVal, name]}
      <option value={classVal}>{name}</option>
    {/each}
  </select>
</div>

<style lang="postcss">
  .mock-button {
    @apply truncate px-2;
  }
  label {
    @apply block text-sm;
  }
  input {
    @apply block w-full h-auto px-2 py-1 text-sm;
  }
  select {
    @apply block w-full h-auto px-2 py-1 text-sm border border-[#c7cdd1];
  }
</style>
