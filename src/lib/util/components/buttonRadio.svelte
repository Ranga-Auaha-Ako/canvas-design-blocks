<script lang="ts">
  import { nanoid } from "nanoid";

  export let title: string;
  export let choices: string[];
  export let labels = choices;
  export let value: string;
  export let id = nanoid();
</script>

<span class="label-text">{title}</span>
<div class="btn-group">
  {#each choices as choice, index}
    <label class="btn" class:active={value === choice}>
      <span>{labels[index]}</span>
      <input name={id} type="radio" value={choice} bind:group={value} />
    </label>
  {/each}
</div>

<style lang="postcss">
  .btn {
    @apply flex items-center gap-2 px-2 py-1 bg-uni-blue text-white rounded border-none cursor-pointer;
  }
  .btn-group {
    @apply flex;
    & .btn {
      @apply bg-gray-200 text-black rounded-none;
      &.active {
        @apply bg-uni-blue text-white font-bold;
      }
      &:first-child {
        @apply rounded-l;
      }
      &:last-child {
        @apply rounded-r;
      }
      & input {
        @apply invisible absolute;
      }
    }
  }
</style>
