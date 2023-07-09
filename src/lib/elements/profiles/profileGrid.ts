import { Writable, get, writable } from "svelte/store";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import ProfileInner from "./profileInner.svelte";
import { stateObject } from "src/main";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ProfilesManager } from "./profilesManager";
import { SafeState, SvelteElement } from "../generic/svelteElement";
import ProfileConfig from "./popup/profileConfig.svelte";
import type { McePopover } from "../generic/popover/popover";

export interface ProfileData {
  title?: string;
  firstName: string;
  lastName: string;
  firstNameLastName: string;
  thumbnail: false | string;
  positions?: {
    position: string;
    department: string;
  }[];
  emailAddress?: {
    address: string;
  };
  discoveryUrlId: string;
}

export interface ProfileGridState extends SafeState {
  profiles: ProfileData[];
}

export class ProfileGrid extends SvelteElement<ProfileData[]> {
  get safeState(): Record<any, any> {
    throw new Error("Method not implemented.");
  }
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
    super(editor, manager, node, ProfileInner, id, highlight);
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
