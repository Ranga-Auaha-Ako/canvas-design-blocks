import sandpitEl from "./sandpit-info.svelte";

// Create el for sandpit
const sandpit = document.createElement("div");
sandpit.id = "sandpit";
document
  .getElementById("content")
  ?.insertAdjacentElement("afterbegin", sandpit);

// Create a new Svelte component
new sandpitEl({
  target: sandpit,
});

console.log("Sandpit loaded");
