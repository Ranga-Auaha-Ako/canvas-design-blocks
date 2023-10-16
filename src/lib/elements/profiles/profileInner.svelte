<script lang="ts">
  import theme from "$lib/util/theme";
  import { ProfileData } from "./profileGrid";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ProfileData[];
  // svelte-ignore unused-export-let
  export let localState: any;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
</script>

{#each cdbData as profile}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div class="profileItem" tabindex="0">
    <div
      class="card"
      style:background-color={profile.color?.toHex() || theme.primary}
    >
      {#if profile.thumbnail}
        <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
        <img
          class="profile-photo"
          src={profile.thumbnail}
          alt="Photo of {profile.firstNameLastName}"
          on:click={() => {
            dispatch("changePhoto", profile);
          }}
          on:keydown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              dispatch("changePhoto", profile);
            }
          }}
          tabindex="0"
          role="button"
        />
      {/if}
      <div class="details">
        <!-- svelte-ignore a11y-missing-content -->
        <h4
          class="name"
          contenteditable="true"
          bind:innerText={profile.firstNameLastName}
          on:input={() => {
            dispatch("update", cdbData);
          }}
        />
        {#if profile.positions && profile.positions.length > 0}
          <div class="position">
            <p
              class="title"
              contenteditable="true"
              bind:innerText={profile.positions[0]}
              on:input={() => {
                dispatch("update", cdbData);
              }}
            />
          </div>
        {/if}
        {#if profile.emailAddress}
          <div class="email">
            <p
              contenteditable="true"
              bind:innerText={profile.emailAddress.address}
              on:input={() => {
                dispatch("update", cdbData);
              }}
            />
          </div>
        {/if}
      </div>
    </div>
    {#if profile.showOverview}
      <div class="bio">
        <h4>Bio</h4>
        <div
          contenteditable="true"
          class="bioContent"
          bind:innerHTML={profile.overview}
          on:input={() => {
            dispatch("update", cdbData);
          }}
        />
      </div>
    {/if}
  </div>
{:else}
  <button data-mce-bogus="all" class="no-people">
    Click to add a person...
  </button>
{/each}
