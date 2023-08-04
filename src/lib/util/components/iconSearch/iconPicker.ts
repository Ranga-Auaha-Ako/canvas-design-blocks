import type { Category } from "inst-icons-meta";
import builtinIcons from "inst-icons-meta";
import { writable, type Writable } from "svelte/store";
import { ModalDialog } from "../modalDialog/modal";
import IconPickerModalInner from "./iconPickerModalInner.svelte";
import type { Editor } from "tinymce";
import type { SelectableElement } from "$lib/elements/generic/selectableElement";

const choices = __USES_CANVAS_ICONS__ ? [] : builtinIcons;

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
  public choices: typeof builtinIcons = choices;
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
