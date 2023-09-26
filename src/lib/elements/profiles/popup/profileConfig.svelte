<script lang="ts">
  import type { ProfileData, ProfileGrid } from "../profileGrid";
  import { fade } from "svelte/transition";
  import { debounce } from "perfect-debounce";
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { nanoid } from "nanoid";

  export let props: { profileGrid: ProfileGrid };
  $: profileGrid = props.profileGrid;
  $: people = profileGrid.SvelteState;
  let configEl: HTMLElement;

  const allCanvasTeachers = fetch(
    `/api/v1/courses/${window.ENV.COURSE_ID}/users?enrollment_type[]=teacher&enrollment_type[]=ta&enrollment_type[]=designer&include[]=avatar_url&include[]=bio&per_page=100`
  ).then((res) => res.json());

  let searchQuery = "";

  $: results = allCanvasTeachers.then((teachers) => {
    return teachers.filter((teacher: any) => {
      return searchQuery
        ? teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
    });
  });

  type canvasUser = {
    id: number;
    name: string;
    last_name: string;
    first_name: string;
    short_name: string;
    avatar_url: string;
    email: string;
    bio: string;
  };

  const addPerson = (person: canvasUser) => {
    if (person) {
      profileGrid.SvelteState.update((people) => {
        const profile: ProfileData = {
          firstName: person.first_name,
          lastName: person.last_name,
          firstNameLastName: person.name,
          id: nanoid(),
          canvasId: person.id.toString(),
          overview: `<p>${
            person.bio
              ? person.bio
                  .split("\n")

                  .join("</p><p>")
              : "No bio available..."
          }</p>`,
          showOverview: true,
          emailAddress: {
            address: person.email,
          },
          thumbnail: person.avatar_url ? person.avatar_url : false,
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
      idKey="id"
      bind:items={$people}
      on:toggleOverview={({ detail: id }) => {
        profileGrid.SvelteState.update((people) => {
          const person = people.find((p) => p.id === id);
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
            on:click={() => addPerson(result)}>{result.name}</button
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
