<script lang="ts">
  import { ProfileData } from "./profileGrid";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ProfileData[];
  // svelte-ignore unused-export-let
  export let localState: any;
</script>

{#each cdbData as profile}
  <div class="profileItem">
    <div class="card">
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
  <div data-mce-bogus="all" class="no-people">
    <p>Click to add a person...</p>
  </div>
{/each}
