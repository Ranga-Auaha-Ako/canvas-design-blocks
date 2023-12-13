import { writable, type Writable } from "svelte/store";
import { ModalDialog } from "$lib/util/components/modalDialog/modal";
import IconPickerModalInner from "./iconPickerModalInner.svelte";
import type { Editor } from "tinymce";
import type { SelectableElement } from "$lib/elements/generic/selectableElement";
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

export interface InstIconState {
  class: string;
  type: IconType.Solid | IconType.Line;
  color?: string;
}
export interface CustomIconState {
  id: string;
  type: IconType.Custom;
  color?: string;
}

export interface universalIconState {
  id: string;
  type: IconType;
  color?: string;
}

export type IconState = InstIconState | CustomIconState | universalIconState;

export const isUniversalIcon = (
  icon: Partial<IconState>
): icon is universalIconState => "id" in icon;
export const isCustomIcon = (
  icon: Pick<IconState, "type">
): icon is CustomIconState => icon.type === IconType.Custom;
export const isInstIcon = (
  icon: Pick<IconState, "type">
): icon is InstIconState => !isCustomIcon(icon);

let icons: iconData = [];
// import { icons as InstIcons } from "virtual:inst-icons";
const InstIcons = import("virtual:inst-icons");

InstIcons.then((i) =>
  Object.entries(i.icons).forEach(([iconPath, url]) => {
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
      id: instClassToId(name, typeEnum),
      url,
      term: name,
    } as instIcon);
  })
);

export const instClassToId = (
  classStr: string,
  type: IconType.Solid | IconType.Line
) => `Inst.${classStr}.${type}`;

export { icons };

export async function getIconData(
  icon:
    | Pick<InstIconState, "type" | "class">
    | Pick<CustomIconState, "type" | "id">
    | Pick<universalIconState, "type" | "id">
): Promise<instIcon | customIcon | undefined> {
  const ics = await loadCustomIcons();
  if (isCustomIcon(icon) || isUniversalIcon(icon)) {
    let found: customIcon | instIcon | undefined;
    for (const cat of ics) {
      if (cat.type !== icon.type) continue;
      found = cat.icons.find((ic) => ic.id === icon.id);
      if (found) break;
    }
    return found;
  } else if (isInstIcon(icon)) {
    let found: instIcon | undefined;
    for (const cat of ics) {
      if (cat.type !== icon.type) continue;
      found = cat.icons.find((ic) => ic.term === icon.class);
      if (found) break;
    }
    return found;
  }
}

export function getIconState(
  unsafeState?: Partial<IconState>
): universalIconState | undefined {
  if (!unsafeState || typeof unsafeState !== "object") return undefined;
  let iconType = IconType.Line;
  if (unsafeState?.type !== undefined) {
    if (unsafeState.type === IconType.Solid) iconType = IconType.Solid;
    else if (unsafeState.type === IconType.Custom) iconType = IconType.Custom;
  }
  const formedIcon = {
    type: iconType,
    id: "id" in unsafeState ? unsafeState.id : undefined,
    class: "class" in unsafeState ? unsafeState.class : undefined,
    color:
      "color" in unsafeState &&
      unsafeState.color &&
      colord(unsafeState.color).isValid()
        ? unsafeState.color
        : undefined,
  };
  if (isUniversalIcon(formedIcon) || isCustomIcon(formedIcon)) {
    const icon = {
      type: formedIcon.type,
      id: formedIcon.id,
    };
    if (!formedIcon.color) {
      return icon;
    }
    return { ...icon, color: formedIcon.color };
  } else if (isInstIcon(formedIcon)) {
    const icon = {
      type: formedIcon.type,
      id: instClassToId(formedIcon.class, formedIcon.type),
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

let hasLoadedCustomIcons: false | Promise<iconData> = false;
export async function loadCustomIcons() {
  await InstIcons;
  if (hasLoadedCustomIcons !== false) return await hasLoadedCustomIcons;
  const getFunc = (async () => {
    if (!import.meta.env.CANVAS_BLOCKS_USE_CANVAS_ICONS) return icons;
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
    return icons;
  })();
  hasLoadedCustomIcons = getFunc;
  return await getFunc;
}
