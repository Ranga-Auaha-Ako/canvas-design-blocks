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
  /** The ligature to use for the icon. Will only be used while waiting for the new data to load */
  lig?: string;
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

// import { icons as InstIcons } from "virtual:inst-icons";
import icons from "virtual:blocks-icons";
export { icons };
export type category = (typeof icons)[0];
export type icon = category["icons"][0];

export const instClassToId = (
  classStr: string,
  type: IconType.Solid | IconType.Line
) => `Inst.${classStr}.${type}`;

export function getIconData(
  icon:
    | Pick<InstIconState, "type" | "class">
    | Pick<CustomIconState, "type" | "id">
    | Pick<universalIconState, "type" | "id">
): (icon & { c: string }) | undefined {
  if (isCustomIcon(icon) || isUniversalIcon(icon)) {
    return icons
      .flatMap((c) => c.icons.map((i) => ({ ...i, c: c.name })))
      .find((ic) => ic.i === icon.id);
  } else {
    // Icon is an instructure icon. Attempt to find it in the iconset.
    const instCat = icons.find((c) => c.name === "Canvas");
    if (!instCat) return undefined;
    // Get new ID
    // Old ID: Inst.admin.1 (category.id.type)
    // New ID: Canvas.Line.admin (category.type.id)
    const oldID = isInstIcon(icon)
      ? instClassToId(icon.class, icon.type)
      : (icon as CustomIconState).id;
    const [_inst, id, _type] = oldID.split("Inst.");
    const match = instCat.icons.find((ic) => ic.i === `Canvas.Line.${id}`);
    if (!match) return undefined;
    return { ...match, c: instCat.name };
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
    if (
      !formedIcon.id &&
      formedIcon.type !== IconType.Custom &&
      formedIcon.class
    ) {
      formedIcon.id = `Inst.Line.${formedIcon.class}`;
    }
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
  card?: boolean;
  editColor?: boolean;
  maxHeight?: string;
}
