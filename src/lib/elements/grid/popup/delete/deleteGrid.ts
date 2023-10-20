import { Writable, get, writable } from "svelte/store";
import Grid from "../../grid";
import DeleteModal from "./deleteModal.svelte";

let deleteInstance: DeleteModal | null = null;

export function deleteGrid(grid: Grid) {
  if (deleteInstance) {
    deleteInstance.$set({ queue: [...(deleteInstance.queue || []), grid] });
  } else {
    deleteInstance = new DeleteModal({
      target: document.body,
      props: {
        queue: [grid],
      },
    });
  }
}
