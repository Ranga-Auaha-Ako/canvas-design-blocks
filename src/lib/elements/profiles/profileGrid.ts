import {
  Invalidator,
  Subscriber,
  Unsubscriber,
  Updater,
  Writable,
  get,
  writable,
} from "svelte/store";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import ProfileInner from "./profileInner.svelte";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ProfilesManager } from "./profilesManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import ProfileConfig from "./popup/profileConfig.svelte";
import type { McePopover } from "../generic/popover/popover";

export interface ProfileData {
  title?: string;
  firstName: string;
  lastName: string;
  firstNameLastName: string;
  thumbnail: false | string;
  overview: string;
  positions?: {
    position: string;
    department: string;
  }[];
  emailAddress?: {
    address: string;
  };
  discoveryUrlId: string;
  showOverview: boolean;
}

class ProfileState implements SvelteState<ProfileData[]> {
  state: Writable<ProfileData[]> = writable();
  public set = this.state.set;
  public update = this.state.update;
  public subscribe = this.state.subscribe;
  constructor(
    unsafeState: Partial<ProfileData[]> | undefined,
    node?: HTMLElement
  ) {
    let state: ProfileData[] =
      unsafeState?.map((p) => ({
        // Import strings from unsafe state
        firstName: p?.firstName || "",
        lastName: p?.lastName || "",
        firstNameLastName: p?.firstNameLastName || "",
        thumbnail: p?.thumbnail || "",
        discoveryUrlId: p?.discoveryUrlId || "",
        title: p?.title || "",
        positions:
          p?.positions?.map((pos) => ({
            position: pos.position || "",
            department: pos.department || "",
          })) || [],
        emailAddress: {
          address: p?.emailAddress?.address || "",
        },
        overview: "",
        showOverview: p?.showOverview === undefined ? true : p?.showOverview,
      })) || [];
    const personNodes = node?.querySelectorAll(".profileItem");
    personNodes?.forEach((pNode, index) => {
      if (state.length - 1 < index) return;
      state[index].overview =
        pNode.querySelector(".bioContent")?.innerHTML || "";
    });
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const safeState = state.map((s) => {
      const { overview: _, ...person } = s;
      return person;
    });
    return JSON.stringify(safeState);
  }
}

export class ProfileGrid extends SvelteElement<ProfileData[]> {
  attributes: MceElement["attributes"] = new Map([]);
  defaultClasses = new Set(["Profiles"]);
  public popover: McePopover;

  public static import(
    state: stateObject,
    node: HTMLElement,
    manager: any,
    editor: Editor
  ) {
    return new this(state, editor, manager, node);
  }
  public static create(
    state: stateObject,
    manager: any,
    atCursor: boolean,
    editor: Editor,
    highlight: boolean
  ) {
    const node = this.createInsertNode(atCursor, editor);
    return new this(state, editor, manager, node);
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public manager: ProfilesManager,
    public node: HTMLElement,
    public readonly id = nanoid(),
    highlight = false
  ) {
    super(editor, manager, node, ProfileInner, ProfileState, id, highlight);
    if (get(this.SvelteState) === undefined) {
      this.SvelteState.set([]);
    }

    // Set up popover
    this.popover = this.setupPopover(
      ProfileConfig,
      {
        profileGrid: this,
      },
      "top",
      {
        shift: {
          crossAxis: true,
        },
      }
    );
    this.isSelected.subscribe((selected) => {
      if (selected) {
        !this.popover.isActive && this.popover.show();
      } else {
        if (this.popover.isActive) {
          this.popover.hide();
        }
      }
    });
    this.setupObserver();
  }
}
