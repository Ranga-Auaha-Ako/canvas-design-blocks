<script lang="ts">
  import type { ProfileData, ProfileGrid } from "../profileGrid";
  import { fade, slide } from "svelte/transition";
  import { debounce } from "perfect-debounce";
  import OrderableList from "$lib/components/orderableList.svelte";
  import { nanoid } from "nanoid";
  import blankImg from "../blank-user.png";
  import ColourPicker from "$lib/components/colourPicker.svelte";
  import { colord } from "colord";
  import { courseEnv } from "$lib/util/courseEnv";

  export let props: { profileGrid: ProfileGrid };
  export let isModal: boolean = false;
  $: profileGrid = props.profileGrid;
  $: people = profileGrid.SvelteState;
  let configEl: HTMLElement;

  const allCanvasTeachers = courseEnv.COURSE_ID
    ? fetch(
        (import.meta.env.DEV && window.location.hostname === "localhost"
          ? "https://canvas.auckland.ac.nz/"
          : "") +
          `/api/v1/courses/${courseEnv.COURSE_ID}/users?enrollment_type[]=teacher&enrollment_type[]=ta&enrollment_type[]=designer&include[]=avatar_url&include[]=bio&per_page=100`
      ).then((res) => res.json())
    : Promise.resolve([]);

  let searchQuery = "";

  $: results = allCanvasTeachers.then((teachers) => {
    return teachers.filter((teacher: any) => {
      return searchQuery
        ? teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
    });
  });

  type canvasUser = {
    id?: number;
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
          canvasId: person.id?.toString(),
          overview: `<p>${
            person.bio
              ? person.bio
                  .split("\n")

                  .join("</p><p>")
              : "No bio available..."
          }</p>`,
          showOverview: true,
          showBioTitle: true,
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

  let activeId: string | undefined;
  $: activeIndex = activeId
    ? $people.findIndex((p) => p.id === activeId)
    : undefined;

  $: contrastColor =
    activeIndex !== undefined
      ? $people[activeIndex].color?.isDark()
        ? "#fff"
        : "#000"
      : "#fff";

  $: contrastLevel =
    activeIndex !== undefined
      ? $people[activeIndex].color?.contrast(colord(contrastColor))
      : true;
  $: isReadable =
    contrastLevel === true ||
    contrastLevel === undefined ||
    (contrastLevel && contrastLevel >= 7);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  {#if $people.length}
    <div class="personList">
      <OrderableList
        labelKey="firstNameLastName"
        idKey="id"
        bind:activeId
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
        on:edit={({ detail: id }) => {
          activeId = id;
        }}
        showEdit={true}
      />
    </div>
  {/if}
  {#if activeIndex !== undefined && $people[activeIndex]}
    <div class="editPerson">
      <div class="editActions">
        <button
          title="Finish editing Person"
          on:click={() => {
            activeId = undefined;
          }}
        >
          Done
          <i class="icon-solid icon-check pl-1" aria-hidden="true" />
        </button>
      </div>
      <div class="options">
        <label for="showOverview" class="checkbox-fullwidth">
          <input
            type="checkbox"
            id="showOverview"
            bind:checked={$people[activeIndex].showOverview}
          />
          Show Overview
        </label>
        {#if $people[activeIndex].showOverview}
          <label for="showBioTitle" class="checkbox-fullwidth">
            <input
              type="checkbox"
              id="showBioTitle"
              bind:checked={$people[activeIndex].showBioTitle}
            />
            Show "Bio" title above overview
          </label>
        {/if}
        <ColourPicker
          label="Colour"
          id={nanoid() + "-setting-background"}
          bind:colour={$people[activeIndex].color}
          contrastColour={colord("#ffffff")}
          showNone={false}
          asModal={isModal}
        />
        {#if !isReadable}
          <div class="colour-alert" transition:slide|global>
            <p class="alert-details">
              <span class="font-bold">Warning:</span> The text in this profile may
              be hard to read for some students. Consider using a darker colour to
              improve contrast against the white text.
            </p>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="searchBox">
      <input
        type="search"
        class="imageSearch"
        placeholder="Search for a person"
        bind:value={searchQuery}
      />
      <div class="results">
        {#await results}
          <div class="loading animate-pulse">Loading...</div>
        {:then resultsAwaited}
          {#each resultsAwaited as result}
            <button
              in:fade|global={{ duration: 200 }}
              class="resultItem"
              on:click={() => addPerson(result)}>{result.name}</button
            >
          {:else}
            <button
              class="no-results"
              on:click={() =>
                addPerson({
                  id: -1,
                  name: searchQuery || `New Person ${$people.length + 1}`,
                  last_name: "",
                  first_name: searchQuery || `New Person ${$people.length + 1}`,
                  short_name: searchQuery || `New Person ${$people.length + 1}`,
                  avatar_url: blankImg,
                  email: "email@example.com",
                  bio: "",
                })}
            >
              No results found. Click here to add a blank person.
            </button>
          {/each}
        {/await}
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow mb-2;
    @apply flex gap-2;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
    .personList {
      @apply py-1;
    }
    .editPerson {
      @apply rounded border border-gray-300 overflow-clip w-52;
      .editActions {
        @apply flex gap-2 justify-end;
        @apply bg-gray-100 border-b p-1 px-2;
      }
      & .options {
        @apply p-2;
      }
    }
    .searchBox {
      .results {
        @apply flex flex-col gap-y-2 h-32 overflow-y-auto border rounded;
        .resultItem {
          @apply block;
        }
        .no-results {
          @apply block text-gray-400 break-normal w-48 text-center mx-auto my-4;
        }
      }
    }

    .checkbox-fullwidth {
      @apply flex items-center gap-2;
      @apply text-gray-500;
      @apply cursor-pointer;
      @apply accent-primary;
      & input {
        @apply w-4 h-4;
      }
    }
  }
  .colour-alert {
    @apply mt-2 border-l-4 border-orange-300 bg-orange-100 text-orange-900 p-2 rounded text-xs transition;
    p {
      @apply m-0;
    }
  }
</style>
