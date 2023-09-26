import { writable, type Writable } from "svelte/store";
import { ModalDialog } from "../modalDialog/modal";
import IconPickerModalInner from "./iconPickerModalInner.svelte";
import type { Editor } from "tinymce";
import type { SelectableElement } from "$lib/elements/generic/selectableElement";
import { icons as InstIcons } from "virtual:inst-icons";
import type {
  customIcon,
  customIconsMeta,
  iconData,
  instCategory,
  instIcon,
} from "./canvas-icons/icons";
import { IconType } from "./canvas-icons/icons";
import { colord } from "colord";

export { IconType };

interface InstIconState {
  class: string;
  type: IconType.Solid | IconType.Line;
  color?: string;
}
interface CustomIconState {
  id: string;
  type: IconType.Custom;
  color?: string;
}
export type IconState = InstIconState | CustomIconState;

export const isCustomIcon = (
  icon: Pick<IconState, "type">
): icon is CustomIconState => icon.type === IconType.Custom;
export const isInstIcon = (
  icon: Pick<IconState, "type">
): icon is InstIconState => !isCustomIcon(icon);

let icons: iconData = [];

Object.entries(InstIcons).forEach(([iconPath, url]) => {
  const [type, ...nameArr] = iconPath.split(".");
  const name = nameArr.join(".");
  if (!type || !name) return;
  let typeEnum: IconType.Solid | IconType.Line;
  if (type === "Solid") typeEnum = IconType.Solid;
  else if (type === "Line") typeEnum = IconType.Line;
  else return;
  // Create/get category
  const catName = `Instructure ${type} Icons`;
  let category = icons.find(
    (c): c is instCategory => c.name === catName && c.type === typeEnum
  );
  if (!category) {
    category = {
      name: catName,
      type: typeEnum,
      icons: [],
    };
    icons.push(category);
  }
  // Add icon
  category.icons.push({
    id: `Inst.${name}.${typeEnum}`,
    url,
    term: name,
  } as instIcon);
});

export { icons };

export function getIconData(
  icon:
    | Pick<InstIconState, "type" | "class">
    | Pick<CustomIconState, "type" | "id">
): instIcon | customIcon | undefined {
  if (isCustomIcon(icon)) {
    let found: customIcon | undefined;
    for (const cat of icons) {
      if (cat.type !== IconType.Custom) continue;
      found = cat.icons.find((ic) => ic.id === icon.id);
      if (found) break;
    }
    return found;
  } else if (isInstIcon(icon)) {
    let found: instIcon | undefined;
    for (const cat of icons) {
      if (cat.type !== icon.type) continue;
      found = cat.icons.find((ic) => ic.term === icon.class);
      if (found) break;
    }
    return found;
  }
}

export function getIconState(
  unsafeState?: Partial<IconState>
): IconState | undefined {
  if (!unsafeState || typeof unsafeState !== "object") return undefined;
  let iconType = IconType.Line;
  if (unsafeState?.type !== undefined) {
    if (unsafeState.type === IconType.Solid) iconType = IconType.Solid;
    else if (unsafeState.type === IconType.Custom) iconType = IconType.Custom;
  }
  const formedIcon = {
    type: iconType,
    id: "id" in unsafeState ? unsafeState.id : undefined,
    class: "class" in unsafeState ? unsafeState.class : "#000000",
    color:
      "color" in unsafeState &&
      unsafeState.color &&
      colord(unsafeState.color).isValid()
        ? unsafeState.color
        : undefined,
  };
  if (isInstIcon(formedIcon)) {
    const icon = {
      type: formedIcon.type,
      class: formedIcon.class,
    };
    if (!formedIcon.color) {
      return icon;
    }
    return { ...icon, color: formedIcon.color };
  } else if (isCustomIcon(formedIcon)) {
    const icon = {
      type: formedIcon.type,
      id: formedIcon.id,
    };
    if (!formedIcon.color) {
      return icon;
    }
    return { ...icon, color: formedIcon.color };
  }
}

export interface IconPickerOptions {
  editColor?: boolean;
}

let hasLoadedCustomIcons = false;
const loadCustomIcons = async () => {
  if (hasLoadedCustomIcons) return;
  hasLoadedCustomIcons = true;
  const data = (await fetch(
    `https://${import.meta.env.CANVAS_BLOCKS_USE_CANVAS_ICONS}/meta.json`
  ).then((r) => r.json())) as customIconsMeta;
  data.forEach((cat) => {
    icons.push({
      name: cat.name,
      type: IconType.Custom,
      icons: cat.icons,
    });
  });
};

export default class IconPicker implements Writable<IconState | undefined> {
  public icon: Writable<IconState> = writable();
  public choices: iconData = icons;
  public modal: ModalDialog<typeof IconPickerModalInner>;
  constructor(
    editor: Editor,
    icon?: IconState,
    parent?: SelectableElement,
    options: IconPickerOptions = {}
  ) {
    if (icon) this.icon.set(icon);
    if (import.meta.env.CANVAS_BLOCKS_USE_CANVAS_ICONS) {
      // Only load this if the icon picker launches to save on load time
      loadCustomIcons();
    }
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
    pickerInst.$on("selectIcon", ({ detail: { icon, color, type } }) => {
      let iconState: IconState;
      if (type === IconType.Custom) {
        iconState = {
          type,
          id: icon.id,
          color,
        } as CustomIconState;
      } else {
        iconState = {
          type,
          class: icon.term,
          color,
        } as InstIconState;
      }
      this.set(iconState);
      this.modal.close();
    });
  }
  public set = this.icon.set;
  public update = this.icon.update;
  public subscribe = this.icon.subscribe;
}
