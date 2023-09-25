import { writable, type Writable } from "svelte/store";
import { ModalDialog } from "../modalDialog/modal";
import IconPickerModalInner from "./iconPickerModalInner.svelte";
import type { Editor } from "tinymce";
import type { SelectableElement } from "$lib/elements/generic/selectableElement";
import { IconState } from "./iconElement.svelte";
import { icons as InstIcons } from "virtual:inst-icons";

export enum IconType {
  Solid = 0,
  Line = 1,
}

export function getIconState(
  unsafeState?: Partial<IconState>
): IconState | undefined {
  let icon: IconState | undefined;
  const foundIcon = unsafeState?.class
    ? icons.get(unsafeState?.class)
    : undefined;
  let iconType = unsafeState?.type || IconType.Line;
  let iconClass = unsafeState?.class;
  let iconUrl = foundIcon ? foundIcon[iconType] : undefined;
  let iconColor = unsafeState?.color;
  if (foundIcon && iconType && iconClass && iconUrl) {
    icon = {
      url: iconUrl,
      class: iconClass,
      type: iconType,
    };
    if (iconColor) icon.color = iconColor;
  } else {
    icon = undefined;
  }
  return icon;
}

let icons: Map<string, Record<IconType, string>> = new Map();
const allIcons = InstIcons as Record<string, string>;
Object.entries(allIcons).forEach(([iconPath, url]) => {
  const [type, ...nameArr] = iconPath.split(".");
  const name = nameArr.join(".");
  if (!type || !name) return;
  let typeEnum: IconType;
  if (type === "Solid") typeEnum = IconType.Solid;
  else if (type === "Line") typeEnum = IconType.Line;
  else return;
  const icon = icons.get(name);
  if (!icon) {
    icons.set(name, {
      [typeEnum]: url,
    } as Record<IconType, string>);
  } else {
    icon[typeEnum] = url;
  }
});

export { icons };

export interface IconPickerOptions {
  editColor?: boolean;
}

export default class IconPicker implements Writable<IconState | undefined> {
  public icon: Writable<IconState> = writable();
  public choices = icons;
  public modal: ModalDialog<typeof IconPickerModalInner>;
  constructor(
    editor: Editor,
    icon?: IconState,
    parent?: SelectableElement,
    options: IconPickerOptions = {}
  ) {
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
        size: "medium",
      },
      {
        iconPicker: this,
        options,
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
