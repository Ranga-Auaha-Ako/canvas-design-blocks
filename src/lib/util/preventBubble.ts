export const preventBubble = (elem: Element) => {
  ["click", "submit", "touchend", "mouseup"].forEach((evt) =>
    elem.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    })
  );
};

export default preventBubble;
