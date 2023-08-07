import { writable, type Writable } from "svelte/store";
import { ModalDialog } from "../modalDialog/modal";
import IconPickerModalInner from "./iconPickerModalInner.svelte";
import type { Editor } from "tinymce";
import type { SelectableElement } from "$lib/elements/generic/selectableElement";
const icons = import.meta.glob(
  "/node_modules/@instructure/ui-icons/svg/**/*.svg",
  {
    as: "url",
    eager: true,
  }
);
// This is not a good way to do this, but Instructure does not provide the icon list in a way that can be imported at compile time or by accessing global variables.
const canvasStyles = Array.from(document.styleSheets).filter((e) =>
  e.href?.includes(window.ENV.ASSET_HOST)
);

console.log(choices);
// if (__USES_CANVAS_ICONS__) {
//   const icons = fetch(`https://${__USES_CANVAS_ICONS__}/meta.json`).then(
//     (r) => r.json()
//   );
//   icons.then((icons) => {
//     choices.push(...icons);
//   });
// }

export default class IconPicker implements Writable<string | undefined> {
  public icon: Writable<string | undefined> = writable();
  public choices: Awaited<ReturnType<typeof builtinIcons>> = choices;
  public modal: ModalDialog<typeof IconPickerModalInner>;
  public static getUrl(path: string, color = "000000") {
    return `https://${
      import.meta.env.CANVAS_BLOCKS_ICONS_ASSET_HOST
    }/colour/${path.replace(/.svg$/, `.${color}.svg`)}`;
  }
  constructor(editor: Editor, icon?: string, parent?: SelectableElement) {
    if (icon) this.icon.set(icon);
    this.modal = new ModalDialog(
      IconPickerModalInner,
      editor,
      {
        title: "Choose an icon",
        buttons: [
          {
            type: "cancel",
            text: "Cancel",
          },
        ],
      },
      {
        iconPicker: this,
      },
      parent
    );
  }
  public pick() {
    const pickerInst = this.modal.open();
    pickerInst.$on("selectIcon", ({ detail }) => {
      this.set(detail);
      this.modal.close();
    });
  }
  public set = this.icon.set;
  public update = this.icon.update;
  public subscribe = this.icon.subscribe;
}
