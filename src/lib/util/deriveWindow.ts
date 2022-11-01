export const deriveWindow = (elm: HTMLElement | null) => {
  return elm?.ownerDocument?.defaultView || false;
};

export default deriveWindow;
