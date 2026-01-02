// External library to prevent layout shifts on hover
let mouseX = 0;
let mouseY = 0;
let hoveredElement = null;
let frozenStyles = new WeakMap();
let isReverting = false; // Prevent infinite loop

// Track mouse position globally
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Observe all style mutations in the document
const observer = new MutationObserver((mutations) => {
  if (isReverting) return; // Skip if we're reverting to prevent recursion

  mutations.forEach((mutation) => {
    if (mutation.type === "attributes" && mutation.attributeName === "style") {
      const target = mutation.target;
      // If this element is hovered, revert style changes
      // if (hoveredElement && (target === hoveredElement || hoveredElement.contains(target))) {
      if (hoveredElement && target === hoveredElement) {
        const frozen = frozenStyles.get(target);
        const currentStyle = target.getAttribute("style") || "";

        // Only revert if style actually changed
        if (frozen !== undefined && currentStyle !== frozen) {
          isReverting = true;
          observer.disconnect(); // Temporarily disconnect to prevent recursion
          target.setAttribute("style", frozen);
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["style"],
            subtree: true,
          });
          isReverting = false;
        }
      }
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ["style"],
  subtree: true,
});

function myAnimationLoop(timestamp) {
  // Detect what element is under the mouse
  const element = document.elementFromPoint(mouseX, mouseY);
  const wasHovering = hoveredElement;

  // Update hovered element (null if mouse is over body or html)
  if (
    element &&
    element !== document.body &&
    element !== document.documentElement
  ) {
    hoveredElement = element;

    // If started hovering a new element, freeze its current style
    if (element !== wasHovering) {
      frozenStyles.set(element, element.getAttribute("style") || "");
    }
  } else {
    // Clear hovered element when mouse is not over any specific element
    hoveredElement = null;
  }

  requestAnimationFrame(myAnimationLoop);
}
requestAnimationFrame(myAnimationLoop);
