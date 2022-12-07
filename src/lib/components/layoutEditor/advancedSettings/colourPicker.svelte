<script lang="ts">
  export let id: string;
  export let colour: string | undefined;
  export let label: string;
</script>

<label for={id}>
  <span class="label-text">{label} ({colour || "none"})</span>
  <div class="input-group">
    <input {id} type="color" bind:value={colour} />
    <button
      class="btn"
      on:click={() => {
        colour = undefined;
      }}>Reset</button
    >
  </div>
</label>
