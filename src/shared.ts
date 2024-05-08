import { ClientManager } from "$lib/elements/generic/clientManager";
import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";

export type implementedClass<T extends abstract new (...args: any) => any> =
  (new (...args: ConstructorParameters<T>) => InstanceType<T>) & T;

// These are the client-side managers that are loaded always
export const clientManagers: implementedClass<typeof ClientManager>[] = [
  glossaryClientManager,
];
