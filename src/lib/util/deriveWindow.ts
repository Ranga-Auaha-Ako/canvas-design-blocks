export const deriveWindow = (elm: Element | null) => {
  return elm?.ownerDocument?.defaultView || false;
};

export default deriveWindow;
