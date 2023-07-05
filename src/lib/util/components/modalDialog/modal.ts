import { nanoid } from "nanoid";
import type { SvelteComponent, ComponentType } from "svelte";
import type { Editor, WindowManager } from "tinymce";

type DialogSpec = Parameters<WindowManager["open"]>[0];

export class ModalDialog<T extends ComponentType> {
  options: DialogSpec;
  id = nanoid();
  componentInstance?: InstanceType<T>;
  openDialog?: ReturnType<WindowManager["open"]>;
  submitHandlers: ((modal: this) => void)[] = [];
  actionHandlers: ((modal: this) => void)[] = [];
  constructor(
    public component: T,
    public editor: Editor,
    options: Omit<DialogSpec, "body">,
    public props: ConstructorParameters<T>[0]["props"]
  ) {
    this.options = {
      ...options,
      body: {
        type: "panel",
        items: [
          {
            type: "htmlpanel",
            html: `<div id="svelte-modal-dialog-${this.id}"></div>`,
          },
        ],
      },
      onSubmit: (api) => {
        this.submitHandlers.forEach((handler) => handler(this));
        options.onSubmit?.(api);
      },
      onAction: (api, details) => {
        this.actionHandlers.forEach((handler) => handler(this));
        options.onAction?.(api, details);
      },
    };
  }
  open(): InstanceType<T> {
    this.openDialog = this.editor.windowManager.open(this.options);
    const target = document.getElementById(`svelte-modal-dialog-${this.id}`);
    if (!target) {
      throw new Error("Could not find target element");
    }
    this.componentInstance = new this.component({
      target,
      props: this.props,
    }) as InstanceType<T>;

    return this.componentInstance;
  }

  close() {
    this.componentInstance?.$destroy();
    this.openDialog?.close();
  }

  onSubmit(callback: (modal: this) => void) {
    this.submitHandlers.push(callback);
  }
  onAction(callback: (modal: this) => void) {
    this.actionHandlers.push(callback);
  }
}
