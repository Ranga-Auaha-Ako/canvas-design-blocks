<script lang="ts">
  import type { ProfileData, ProfileGrid } from "../profileGrid";
  import { fade } from "svelte/transition";
  import { debounce } from "perfect-debounce";
  import OrderableList from "$lib/util/components/orderableList.svelte";

  export let props: { profileGrid: ProfileGrid };
  $: profileGrid = props.profileGrid;
  $: people = profileGrid.SvelteState;
  let configEl: HTMLElement;

  let searchQuery = "";

  const search = debounce(
    async (query: string | undefined = undefined) => {
      const url = `https://profile-cors.c.raa.amazon.auckland.ac.nz/api/users`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          params: {
            by: "text",
            type: "user",
            text: query,
          },
        }),
      });
      const results = (await response.json()) as {
        resource: {
          discoveryUrlId: string;
          firstNameLastName: string;
        }[];
      };

      return results?.resource;
    },
    300,
    { trailing: false }
  );

  $: results = searchQuery.length > 2 ? search(searchQuery) : [];

  const getPerson = async (id: string) => {
    try {
      const res = await fetch(
        `https://profile-cors.c.raa.amazon.auckland.ac.nz/api/users/${id}`
      );
      const person = await res.json();
      return person as ProfileData & { hasThumbnail: boolean };
    } catch (error) {
      return false;
    }
  };

  const addPerson = async (id: string) => {
    const person = await getPerson(id);
    if (person) {
      profileGrid.SvelteState.update((people) => {
        const profile: ProfileData = {
          title: person.title,
          firstName: person.firstName,
          lastName: person.lastName,
          firstNameLastName: person.firstNameLastName,
          discoveryUrlId: person.discoveryUrlId,
          overview: `<p>${
            person.overview
              ? person.overview
                  .split("\n")

                  .join("</p><p>")
              : "No bio available..."
          }</p>`,
          showOverview: true,
          positions: person.positions,
          emailAddress: person.emailAddress,
          thumbnail: person.hasThumbnail
            ? `https://profiles.auckland.ac.nz/${person.discoveryUrlId}/photo`
            : false,
        };
        if (people) {
          return [...people, profile];
        } else {
          return [profile];
        }
      });
      searchQuery = "";
    }
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <div class="personList">
    <OrderableList
      labelKey="firstNameLastName"
      idKey="discoveryUrlId"
      bind:items={$people}
      on:toggleOverview={({ detail: id }) => {
        profileGrid.SvelteState.update((people) => {
          const person = people.find((p) => p.discoveryUrlId === id);
          if (person) {
            person.showOverview = !person.showOverview;
          }
          return people;
        });
      }}
      actions={(item) => [
        {
          title: "Show/Hide Overview",
          icon: item.showOverview
            ? "icon-Solid icon-syllabus"
            : "icon-Line icon-syllabus",
          event: "toggleOverview",
        },
      ]}
    />
  </div>
  <div class="searchBox">
    <input
      type="search"
      class="imageSearch"
      placeholder="Search for a person"
      bind:value={searchQuery}
    />
    <div class="results">
      {#await results then resultsAwaited}
        {#each resultsAwaited as result}
          <button
            in:fade|global={{ duration: 200 }}
            class="resultItem"
            on:click={() => addPerson(result.discoveryUrlId)}
            >{result.firstNameLastName}</button
          >
        {/each}
      {/await}
    </div>
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow mb-2;
    @apply flex gap-4;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
    .searchBox {
      .results {
        @apply flex flex-col gap-y-2 h-32 overflow-y-auto border rounded;
        .resultItem {
          @apply block;
        }
      }
    }
  }
</style>
