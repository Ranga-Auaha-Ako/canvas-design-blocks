<script lang="ts">
  export let id: string;
  export let colour: string = "";
  export let label: string;
  export const options = [
    { code: "#00467F", name: "Dark blue" },
    { code: "#000000", name: "Black" },
    { code: "#4A4A4C", name: "Body Grey" },
    { code: "#8D9091", name: "Silver" },
    { code: "#A71930", name: "Arts" },
    { code: "#7D0063", name: "Business School" },
    { code: "#D2492A", name: "Creative Arts and Industries" },
    { code: "#55A51C", name: "Education and Social Work" },
    { code: "#4F2D7F", name: "Engineering" },
    { code: "#005B82", name: "Auckland Law School" },
    { code: "#00877C", name: "Medical Health Sciences" },
    { code: "#0039A6", name: "Science" },
    { code: "#BA4482", name: "Auckland Bioengineering Institute" },
    { code: "#006990", name: "Liggins Institute" },
    { code: "#ffffff", name: "White" },
    { code: "unset", name: "None" },
  ];

  const select = (c: string) => {
    colour = c;
    edit = false;
  };

  let edit = false;
</script>

<div class="cgb-component">
  <div class="container">
    <label for={id}> {label} </label>
    <button
      on:click={(e) => (edit = !edit)}
      class="colour"
      title="Click to change"
      style:background-color={colour || "unset"}
      class:unset={colour == "unset" || colour == ""}
      class:white={colour == "#ffffff"}
    />
    <div {id} class="colourPicker" class:edit>
      {#each options as option}
        <button
          class="colour colour-option"
          class:unset={option.code == "unset"}
          class:white={option.code == "#ffffff"}
          title={option.name}
          style:background-color={option.code}
          class:selected={colour == option.code}
          on:click={(e) => select(option.code)}
        />
      {/each}
    </div>
  </div>
</div>

<style lang="postcss">
  button {
    @apply border-0 block text-base;
  }
  .container {
    @apply flex items-center justify-start relative w-full;
    --size: 1.7em;
  }
  label {
    @apply pr-2;
  }
  .colour {
    @apply rounded;
    width: var(--size);
    height: var(--size);
    cursor: pointer;
    display: inline-block;
  }
  .colourPicker {
    @apply absolute top-full m-2 mr-0 p-4 z-10;
    @apply shadow bg-white rounded;
    @apply grid grid-cols-4 gap-1;
    /* @apply flex flex-wrap gap-1 shadow bg-white rounded; */
    @apply pointer-events-none opacity-0 transition-all;
    transform: translateY(-6px);
    &.edit {
      @apply visible opacity-100 pointer-events-auto;
      transform: translateY(0);
    }
    & .colour-option {
      @apply shadow-sm z-0;
      &.selected {
        @apply z-10;
      }
    }
  }
  .colour,
  .colour-option {
    &.unset {
      @apply relative border border-gray-600 border-solid;
      &:after {
        content: " ";
        @apply absolute top-0 left-0 right-0 mx-auto w-px bg-gray-600 h-full;
        transform: rotate(45deg);
      }
    }
    &.white {
      @apply relative border border-gray-200 border-solid;
    }
  }
</style>
