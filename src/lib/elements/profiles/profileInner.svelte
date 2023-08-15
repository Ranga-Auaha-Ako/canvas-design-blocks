<script lang="ts">
  import { ProfileData } from "./profileGrid";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ProfileData[];
</script>

{#each cdbData as profile}
  <div class="profileItem">
    <div class="card">
      {#if profile.thumbnail}
        <img
          class="profile-photo"
          src={profile.thumbnail}
          alt="Photo of {profile.firstName}"
        />
      {/if}
      <div class="details">
        <p
          class="title"
          contenteditable="true"
          bind:innerText={profile.title}
          on:input={() => {
            dispatch("update", cdbData);
          }}
        />
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
              bind:innerText={profile.positions[0].position}
              on:input={() => {
                dispatch("update", cdbData);
              }}
            />
            <p
              class="department"
              contenteditable="true"
              bind:innerText={profile.positions[0].department}
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
