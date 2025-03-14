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
import { stateObject } from "src/desktop";
import { Editor } from "tinymce";
import { nanoid } from "nanoid";
import { ProfilesManager } from "./profilesManager";
import { SvelteElement, SvelteState } from "../generic/svelteElement";
import ProfileConfig from "./popup/profileConfig.svelte";
import type { McePopover } from "../generic/popover/popover";
import ImageSearch from "$lib/components/contentSearch/imageSearch/imageSearch.svelte";
import { ModalDialog } from "$lib/components/modalDialog/modal";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { type Colord, colord } from "colord";
import theme from "$lib/util/theme";

export interface ProfileData {
  id: string;
  canvasId?: string;
  firstName: string;
  lastName: string;
  firstNameLastName: string;
  thumbnail: false | string;
  overview: string;
  positions?: string[];
  emailAddress?: {
    address: string;
  };
  showOverview: boolean;
  showBioTitle: boolean;
  color?: Colord;
}

const getColorOrDefault = (color?: Colord | string) => {
  if (color === undefined) return colord(theme.primary);
  let c = colord(color);
  if (c.isValid()) return c;
  return colord(theme.primary);
};

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
        id: p?.id || nanoid(),
        canvasId: p?.canvasId || "",
        firstName: p?.firstName || "",
        lastName: p?.lastName || "",
        firstNameLastName: p?.firstNameLastName || "",
        thumbnail: "",
        positions: (
          p?.positions as
            | string[]
            | undefined
            | {
                position: string;
                department: string;
              }[]
        )?.map((pos) => (typeof pos === "string" ? pos : pos.position)) || [""],
        emailAddress: {
          address: p?.emailAddress?.address || "",
        },
        overview: "",
        showOverview: p?.showOverview === undefined ? true : p?.showOverview,
        showBioTitle: p?.showBioTitle === undefined ? true : p?.showBioTitle,
        color: getColorOrDefault(p?.color),
      })) || [];
    const personNodes =
      node?.querySelectorAll<HTMLDivElement>("div.profileItem");
    personNodes?.forEach((pNode, index) => {
      if (state.length - 1 < index) return;
      state[index].overview =
        pNode.querySelector(".bioContent")?.innerHTML || "";
      const profileThumbnail =
        pNode?.querySelector<HTMLImageElement>("img.profile-photo");
      state[index].thumbnail = profileThumbnail?.src || "";
    });
    this.state.set(state);
  }
  get stateString() {
    const state = get(this.state);
    const safeState = state.map((s) => {
      const { overview: _, thumbnail: __, color, ...person } = s;
      return { ...person, color: color?.toHex() };
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

  public async changePhoto({ detail: profile }: { detail: ProfileData }) {
    const picker = new ModalDialog(
      ImageSearch,
      this.editor,
      {
        title: "Select Image",
        buttons: [
          {
            type: "cancel",
            text: "Cancel",
          },
        ],
      },
      {}
    );
    const pickerInst = picker.open();
    pickerInst.$on("selectImage", ({ detail: url }) => {
      profile.thumbnail = url;
      this.SvelteState.update((state) => state);
      picker.close();
    });
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
    this.customEvents = new Map([["changePhoto", this.changePhoto.bind(this)]]);
    if (get(this.SvelteState) === undefined) {
      this.SvelteState.set([]);
    } else {
      this.SvelteState.update((state) => state);
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
