export interface IconFile {
    id: string;
    url?: string;
    title?: string;
    width: number;
    height: number;
    tnp_id: string;
    tags?: string[];
    term?: string;
    collections?: string[];
}
export type BuiltinIcon = string;
export interface Category<T = IconFile | BuiltinIcon> {
    name: string;
    icons: T[];
}
declare const builtinIcons: Category<string>[];
export default builtinIcons;
