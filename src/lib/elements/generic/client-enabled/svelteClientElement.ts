import { nanoid } from "nanoid";
import node from "postcss/lib/node";
import type { ComponentType } from "svelte";
import type { Editor } from "tinymce";
import type ElementManager from "../elementManager";
import {
  type ElementComponent,
  SvelteElement,
  type SvelteStateClass,
} from "../svelteElement";
import { type Writable, writable } from "svelte/store";
import { MceElementStatics } from "../mceElement";

export interface ClientElementStatics {}

export abstract class SvelteClientElement<
    stateDataType,
    localState = Record<string, string> | undefined
  >
  extends SvelteElement<stateDataType, localState>
  implements ClientElementStatics
{
  constructor(
    public editor: Editor = window.tinymce.activeEditor,
    public manager: ElementManager,
    public node: HTMLElement,
    public svelteComponent: ComponentType<
      ElementComponent<stateDataType, localState>
    >,
    public stateClass: SvelteStateClass<stateDataType>,
    public readonly id = nanoid(),
    highlight = false,
    defaultState?: Partial<stateDataType>,
    public localState: Writable<localState> = writable<localState>(
      {} as localState
    )
  ) {
    super(
      editor,
      manager,
      node,
      svelteComponent,
      stateClass,
      id,
      highlight,
      defaultState,
      localState
    );
    // Check to see if element exists in the DOM
    document.querySelectorAll(manager.selector).forEach((el) => {
      //TODO: implement this
    });
  }
}
