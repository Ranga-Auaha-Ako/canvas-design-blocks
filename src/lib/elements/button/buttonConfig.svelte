<script lang="ts">
  import writableDerived from "svelte-writable-derived";
  import type { Writable } from "svelte/store";
  import { Button } from "./button";

  export let props: { button: Button };
  $: button = props.button;

  let configEl: HTMLElement;

  $: href = button.attributes.get("href");
  $: target = button.attributes.get("target");
  $: title = button.attributes.get("title");
  $: innerText = button.innerText;

  const classPicker = (
    classWritable: Writable<DOMTokenList>,
    options: string[]
  ) => {
    const derive = (classes: DOMTokenList) => {
      return Array.from(classes).filter((c) => options.includes(c))[0] || "";
    };
    const reflect = (choice: string, existing: DOMTokenList) => {
      options.forEach((v) => v && existing.remove(v));
      choice && existing.add(choice);
      return existing;
    };
    return writableDerived(classWritable, derive, reflect);
  };

  const validClasses = [
    ["", "Default"],
    ["Button--primary", "Primary"],
    ["Button--secondary", "Secondary"],
    ["Button--warning", "Warning"],
    ["Button--danger", "Danger"],
    ["Button--success", "Success"],
  ];
  $: styleClass = classPicker(
    button.classList,
    validClasses.map((v) => v[0])
  );
  $: sizeClasses = classPicker(button.classList, [
    "Button--small",
    "Button--large",
  ]);
  $: isBlock = classPicker(button.classList, ["Button--block"]);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  on:focusin={() => button.select("ButtonConfig")}
  on:focusout={() => button.deselect("ButtonConfig")}
>
  <p class="text-xs">
    To configure the button text and link, use the built-in Canvas link options.
  </p>
  <hr class="my-1" />
  <!-- <div class="input-group">
    <label for="buttonTextConfig">Button Text</label>
    <input type="text" id="buttonTextConfig" bind:value={$innerText} />
  </div>
  <div class="input-group">
    <label for="buttonLinkConfig">Button Link</label>
    <input type="url" id="buttonLinkConfig" bind:value={$href} />
  </div> -->
  <div class="input-group">
    <label for="buttonTargetConfig">Button Target</label>
    <select id="buttonTargetConfig" bind:value={$target}>
      <option value="">Same Window</option>
      <option value="_blank">New Window</option>
    </select>
  </div>
  <div class="input-group">
    <label for="buttonTitleConfig">Button Title (hover)</label>
    <input type="text" id="buttonTitleConfig" bind:value={$title} />
  </div>
  <div class="input-group">
    <label for="buttonStyleConfig">Button Style</label>
    <select id="buttonStyleConfig" bind:value={$styleClass}>
      {#each validClasses as [classVal, name]}
        <option value={classVal}>{name}</option>
      {/each}
    </select>
  </div>
  <div class="input-group">
    <label for="buttonSizeConfig">Button Size</label>
    <select id="buttonSizeConfig" bind:value={$sizeClasses}>
      <option value="Button--small">Small</option>
      <option value="">Default</option>
      <option value="Button--large">Large</option>
    </select>
  </div>
  <div class="input-group">
    <label for="buttonBlockConfig">Full-Width?</label>
    <input
      type="checkbox"
      id="buttonBlockConfig"
      value="Button--block"
      bind:group={$isBlock}
    />
  </div>
  <!-- <div class="input-group">
    <label for="buttonIconSelect">Button Icon</label>
    <button id="buttonIconSelect" class="Button">No Icon</button>
  </div> -->
</div>

<style lang="postcss">
  .input-group {
    @apply mb-2;
  }
  label {
    @apply block text-sm;
  }
  input {
    @apply block w-full h-auto px-2 py-1 text-sm;
  }
  button.Button {
    @apply border w-full block;
  }
  select {
    @apply block w-full h-auto px-2 py-1 text-sm border border-[#c7cdd1];
  }
</style>
