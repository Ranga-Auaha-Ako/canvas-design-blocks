import writableDerived from "svelte-writable-derived";
import { Writable } from "svelte/store";

/**
 * Class Theme: Utility function for defining a relationship between a class list and an enum of "themes" - useful for creating variations of an element.
 * @param themes An enum of themes
 * @param defaultTheme The default theme
 * @returns A function that takes a class list and returns a writable derived store that reflects the current theme
 * @example
 * ```ts
 * export enum Theme {
 *  Overlay = "class--overlay",
 *  Subtitle = "class--subtitle",
 * }
 * classTheme(Theme, Theme.Overlay)
 * ```
 */
export function classTheme<T extends Record<string, string>>(
  themes: T,
  defaultTheme: T[keyof T]
) {
  return (classes: Writable<DOMTokenList>) => {
    return writableDerived<typeof classes, T[keyof T]>(
      classes,
      ($classes) => {
        return (
          Object.values(themes).find((theme) => $classes.contains(theme)) ||
          defaultTheme
        );
      },
      (reflecting, oldClasses) => {
        oldClasses.remove(...Object.values(themes));
        oldClasses.add(reflecting);
        return oldClasses;
      }
    );
  };
}

export default classTheme;
