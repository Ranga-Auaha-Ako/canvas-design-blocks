export abstract class ClientManager {
  mode: "desktop" | "mobile";
  constructor(mode: "desktop" | "mobile") {
    this.mode = mode;
  }
  abstract renderClientComponent(): unknown;
}
