<script lang="ts">
  import type { Writable } from "svelte/store";
  import type { ProfileData, ProfileGrid } from "../profileGrid";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import { fade } from "svelte/transition";
  import { debounce } from "perfect-debounce";
  import Sortable from "sortablejs";

  export let props: { profileGrid: ProfileGrid };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
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

  const deletePerson = (person: ProfileData) => {
    profileGrid.SvelteState.update((people) => {
      if (people) {
        return people.filter((p) => p !== person);
      } else {
        return [];
      }
    });
  };

  const handlePersonOrder = (
    event:
      | { oldIndex: number | undefined; newIndex: number | undefined }
      | undefined
  ) => {
    const { oldIndex, newIndex } = event || {};
    if (oldIndex !== undefined && newIndex !== undefined) {
      profileGrid.SvelteState.update((people) => {
        const input = [...people];
        const elm = input.splice(oldIndex, 1)[0];
        input.splice(newIndex, 0, elm);
        return [...input];
      });
    }
  };

  let personList: HTMLElement;

  $: sortable =
    personList &&
    new Sortable(personList, {
      animation: 200,
      handle: ".dragHandle",
      onEnd: (event) => {
        handlePersonOrder(event);
      },
    });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <div
    class="personList"
    class:emptyPersonList={$people.length === 0}
    bind:this={personList}
  >
    {#if $people}
      {#each $people as person, _ (person.discoveryUrlId)}
        <div class="person">
          <div class="dragHandle">
            <i class="icon-solid icon-drag-handle" />
          </div>
          <div class="name">
            {person.firstNameLastName}
          </div>
          <div class="actions">
            <button
              aria-label="Delete {person.firstNameLastName}"
              on:click={() => {
                deletePerson(person);
              }}
            >
              <i class="icon-trash" />
            </button>
          </div>
        </div>
      {/each}
    {/if}
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
    .personList {
      @apply flex flex-col gap-y-2;
      width: 100%;
      &.emptyPersonList {
        @apply hidden;
      }
      .person {
        @apply flex items-center gap-x-2;
        .dragHandle {
          @apply cursor-pointer;
        }
        .name {
          @apply flex-1;
        }
        .actions {
          @apply flex gap-x-2;
        }
      }
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
