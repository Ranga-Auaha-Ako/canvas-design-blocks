export const preventBubble = (elem: Element, all = false) => {
  let events = ["click", "submit", "touchstart", "mousedown"];
  if (all)
    events.push(
      "touchend",
      "mouseup",
      "dragover",
      "dragenter",
      "dragend",
      "drag",
      "drop"
    );

  events.forEach((evt) =>
    elem.addEventListener(evt, (e) => {
      // e.preventDefault();
      e.stopPropagation();
      return false;
    })
  );
};

export default preventBubble;
