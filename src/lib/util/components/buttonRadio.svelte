<script lang="ts">
  import { nanoid } from "nanoid";

  export let title: string;
  export let choices: any[];
  export let labels = choices;
  export let value: any;
  export let id = nanoid();
  export let fullWidth: boolean = false;
  export let axis: "horizontal" | "vertical" = "horizontal";
  export let comparator: (a: any, b: any) => boolean = (a, b) => a === b;
  export let disabled: boolean = false;
</script>

<span class="label-text">{title}</span>
<div
  class="btn-group btn-{axis}"
  style:--btn-items={choices.length}
  class:fullWidth
  class:disabled
>
  {#each choices as choice, index}
    <label class="btn" class:active={comparator(value, choice)}>
      <slot {index}>
        <span>{labels[index]}</span>
      </slot>
      <input
        name={id}
        type="radio"
        value={choice}
        bind:group={value}
        on:change
      />
    </label>
  {/each}
</div>

<style lang="postcss">
  .btn {
    @apply flex justify-center items-center gap-2 px-2 py-1 bg-primary text-white rounded border-none cursor-pointer;
  }
  .btn-group {
    @apply flex flex-wrap overflow-clip rounded transition w-fit;
    &:has(:focus-visible) {
      @apply ring-2 ring-primary;
    }
    & .btn {
      @apply bg-gray-200 text-black rounded-none;
      &.active {
        @apply bg-primary text-white font-bold;
      }
      & input {
        @apply absolute opacity-0;
      }
    }
    &.btn-vertical {
      @apply flex-col;
      & .btn {
        @apply w-full;
      }
    }
    &.disabled {
      @apply opacity-50 pointer-events-none;
    }
  }
  .fullWidth {
    @apply w-full;
    & .btn {
      @apply grow;
    }
  }
</style>
