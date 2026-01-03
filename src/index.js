// External library to prevent layout shifts that move hovered elements
let mouseX = 0;
let mouseY = 0;
let hoveredElement = null;
let hoveredElementRect = null;

// Store paused mutations
let pausedMutations = [];
let pausedMutationData = new Map();

// Track mouse position globally
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Check if an element is clickable
function isElementClickable(element) {
  // Check for native clickable elements
  if (element.tagName === "BUTTON") return true;
  if (element.tagName === "A" && element.href) return true;
  if (
    element.tagName === "INPUT" &&
    (element.type === "button" ||
      element.type === "submit" ||
      element.type === "reset" ||
      element.type === "checkbox" ||
      element.type === "radio")
  )
    return true;
  if (element.tagName === "SELECT") return true;
  if (element.tagName === "TEXTAREA") return true;

  // Check for elements with click-related attributes
  if (element.getAttribute && element.getAttribute("role") === "button")
    return true;
  if (element.onclick) return true;

  // Check for elements with click event listeners
  // Note: This is a simplified check and may not catch all cases
  const hasClickListeners =
    element.hasAttribute("data-click-listener") ||
    element.hasAttribute("ng-click") || // Angular
    element.hasAttribute("v-on:click") || // Vue
    element.hasAttribute("@click"); // Vue shorthand

  if (hasClickListeners) return true;

  // For other elements, check if they have any click event listeners
  // This is a more expensive check, so we do it last
  try {
    // This is a heuristic - we can't easily check for all possible event listeners
    // But we can check for some common patterns
    return (
      element.getAttribute("tabindex") === "0" ||
      element.hasAttribute("data-toggle") ||
      element.hasAttribute("data-target")
    );
  } catch (e) {
    // If we can't determine, err on the side of caution
    return false;
  }
}

// Observe all mutations in the document
const observer = new MutationObserver((mutations) => {
  console.log(
    "[Antishift] MutationObserver triggered with",
    mutations.length,
    "mutations"
  );

  // If no clickable element is hovered, do nothing
  if (!hoveredElement) {
    console.log("[Antishift] No hovered clickable element, skipping mutations");
    return;
  }

  // Store the previous position of the hovered clickable element once for all mutations in this batch
  const previousRect = hoveredElementRect;
  console.log(
    "[Antishift] Using previous clickable element rect for all mutations in this batch:",
    previousRect
  );

  // Get current position of hovered clickable element for comparison
  const currentRect = hoveredElement.getBoundingClientRect();
  console.log(
    "[Antishift] Current hovered clickable element rect:",
    currentRect
  );

  // Check if the hovered clickable element's position has changed
  const hasPositionChanged =
    previousRect &&
    (previousRect.left !== currentRect.left ||
      previousRect.top !== currentRect.top ||
      previousRect.right !== currentRect.right ||
      previousRect.bottom !== currentRect.bottom);

  console.log(
    "[Antishift] Position changed for this batch:",
    hasPositionChanged
  );

  // Update stored position
  hoveredElementRect = currentRect;

  // Process each mutation
  mutations.forEach((mutation, index) => {
    // Log mutation data based on type
    if (mutation.type === "childList") {
      console.log(
        "[Antishift] Processing mutation",
        index,
        "of type",
        mutation.type,
        "with",
        mutation.addedNodes.length,
        "added nodes and",
        mutation.removedNodes.length,
        "removed nodes. Target:",
        mutation.target.tagName,
        mutation.target.id,
        mutation.target.className
      );
    } else if (mutation.type === "attributes") {
      console.log(
        "[Antishift] Processing mutation",
        index,
        "of type",
        mutation.type,
        "for attribute",
        mutation.attributeName,
        "on target",
        mutation.target.tagName,
        mutation.target.id,
        mutation.target.className,
        ". Old value:",
        mutation.oldValue
      );
    } else if (mutation.type === "characterData") {
      console.log(
        "[Antishift] Processing mutation",
        index,
        "of type",
        mutation.type,
        "on target",
        mutation.target.parentElement
          ? mutation.target.parentElement.tagName
          : "unknown",
        ". Old value:",
        mutation.oldValue
      );
    } else {
      console.log(
        "[Antishift] Processing mutation",
        index,
        "of type",
        mutation.type
      );
    }

    // Check if this mutation affected the hovered clickable element's position
    if (
      isMutationAffectingHoveredElement(
        mutation,
        previousRect,
        hasPositionChanged
      )
    ) {
      console.log(
        "[Antishift] Mutation affects hovered clickable element, pausing it"
      );
      // Pause this mutation
      pauseMutation(mutation);
    } else {
      console.log(
        "[Antishift] Mutation does not affect hovered clickable element, skipping"
      );
    }
  });
});

observer.observe(document.body, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true,
});

// Check if a mutation affects the hovered clickable element's position
function isMutationAffectingHoveredElement(
  mutation,
  previousRect,
  hasPositionChanged
) {
  console.log(
    "[Antishift] Checking if mutation affects hovered clickable element"
  );

  // If there's no previous position, return false
  if (!previousRect) {
    console.log("[Antishift] No previous position, skipping mutation check");
    return false;
  }

  // Check if mouse was over the hovered clickable element at its previous position
  // Both mouseX/mouseY and previousRect are viewport-relative, so we can compare directly
  const wasMouseOverHovered =
    mouseX >= previousRect.left &&
    mouseX <= previousRect.right &&
    mouseY >= previousRect.top &&
    mouseY <= previousRect.bottom;

  console.log(
    "[Antishift] Mouse was over hovered clickable element:",
    wasMouseOverHovered
  );

  // Return true if position changed and mouse was over the clickable element at previous position
  const result = hasPositionChanged && wasMouseOverHovered;
  console.log(
    "[Antishift] Mutation affects hovered clickable element:",
    result
  );
  return result;
}

// Pause a mutation that affects the hovered element
function pauseMutation(mutation) {
  console.log("[Antishift] Pausing mutation of type:", mutation.type);

  // Store the mutation for later unpausing
  const mutationId = Date.now() + Math.random();
  pausedMutations.push(mutationId);
  const data = {
    mutation: mutation,
    type: mutation.type,
    target: mutation.target,
  };

  if (mutation.type === "childList") {
    console.log("[Antishift] Processing childList mutation");
    // Handle childList mutations
    const addedData = [];
    mutation.addedNodes.forEach((node, index) => {
      console.log(
        "[Antishift] Processing added node",
        index,
        ":",
        node.nodeName
      );
      if (node.nodeType === Node.ELEMENT_NODE) {
        // 1.1.1 Set display none to new child
        const originalDisplay = node.style.display;
        console.log(
          "[Antishift] Setting display:none on added node, original display was:",
          originalDisplay
        );
        node.style.display = "none";
        addedData.push({ node: node, originalDisplay: originalDisplay });
      }
    });

    const removedData = [];
    mutation.removedNodes.forEach((node, index) => {
      console.log(
        "[Antishift] Processing removed node",
        index,
        ":",
        node.nodeName
      );
      // 1.2.1 Restore deleted child
      if (node.parentNode) {
        // Store the next sibling for proper restoration
        const nextSibling = node.nextSibling;
        console.log("[Antishift] Restoring removed node to parent");
        node.parentNode.insertBefore(node, mutation.nextSibling);
        removedData.push({ node: node, nextSibling: nextSibling });
      } else {
        console.log("[Antishift] Appending removed node to target");
        mutation.target.appendChild(node);
        removedData.push({ node: node, nextSibling: null });
      }
    });

    data.addedData = addedData;
    data.removedData = removedData;
  } else if (mutation.type === "attributes") {
    console.log(
      "[Antishift] Processing attributes mutation for attribute:",
      mutation.attributeName
    );
    // 2.1 Set old value
    const newValue = mutation.target.getAttribute(mutation.attributeName);
    data.newValue = newValue;
    console.log(
      "[Antishift] Storing new value:",
      newValue,
      "Setting old value:",
      mutation.oldValue
    );

    if (mutation.oldValue !== null) {
      mutation.target.setAttribute(mutation.attributeName, mutation.oldValue);
    } else {
      mutation.target.removeAttribute(mutation.attributeName);
    }
  } else if (mutation.type === "characterData") {
    console.log("[Antishift] Processing characterData mutation");
    // 2.1 Set old value
    const newValue = mutation.target.textContent;
    data.newValue = newValue;
    console.log(
      "[Antishift] Storing new text content:",
      newValue,
      "Setting old text content:",
      mutation.oldValue
    );
    mutation.target.textContent = mutation.oldValue;
  }

  pausedMutationData.set(mutationId, data);
  console.log("[Antishift] Mutation paused and stored");
}

// Unpause all paused mutations
function unpauseMutations() {
  console.log("[Antishift] Unpausing", pausedMutations.length, "mutations");

  pausedMutations.forEach((mutationId, index) => {
    console.log("[Antishift] Unpausing mutation", index);
    const data = pausedMutationData.get(mutationId);
    if (!data) {
      console.log("[Antishift] No data found for mutation, skipping");
      return;
    }

    const mutation = data.mutation;

    if (mutation.type === "childList") {
      console.log("[Antishift] Unpausing childList mutation");
      // Handle childList mutations
      if (data.addedData) {
        data.addedData.forEach(({ node, originalDisplay }, nodeIndex) => {
          console.log(
            "[Antishift] Removing display:none from added node",
            nodeIndex
          );
          // 1.1.1 Remove display none from new child
          node.style.display = originalDisplay || "";
        });
      }

      if (data.removedData) {
        data.removedData.forEach(({ node, nextSibling }, nodeIndex) => {
          console.log("[Antishift] Deleting restored node", nodeIndex);
          // 1.2.1 Delete restored child
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
      }
    } else if (mutation.type === "attributes") {
      console.log(
        "[Antishift] Unpausing attributes mutation for attribute:",
        mutation.attributeName
      );
      // 2.1 Set new value
      if (data.newValue !== null) {
        console.log("[Antishift] Setting new value:", data.newValue);
        mutation.target.setAttribute(mutation.attributeName, data.newValue);
      } else {
        console.log("[Antishift] Removing attribute");
        mutation.target.removeAttribute(mutation.attributeName);
      }
    } else if (mutation.type === "characterData") {
      console.log("[Antishift] Unpausing characterData mutation");
      // 2.1 Set new value
      console.log("[Antishift] Setting new text content:", data.newValue);
      mutation.target.textContent = data.newValue;
    }
  });

  // Clear paused mutations
  console.log("[Antishift] Clearing paused mutations");
  pausedMutations = [];
  pausedMutationData.clear();
}

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
    // Check if the element is clickable
    const isClickable = isElementClickable(element);

    if (isClickable) {
      // Store the bounding rectangle of the hovered clickable element
      const newRect = element.getBoundingClientRect();

      // Only update if element changed
      if (element !== hoveredElement) {
        console.log(
          "[Antishift] Hovered clickable element changed to:",
          element.tagName,
          element.id,
          element.className
        );
        hoveredElement = element;
        hoveredElementRect = newRect;
      } else if (hoveredElementRect) {
        // Update position if it was already tracked
        hoveredElementRect = newRect;
      }
    } else if (hoveredElement) {
      // If we were hovering a clickable element but now we're not, clear the hovered element
      console.log("[Antishift] No longer hovering a clickable element");
      hoveredElement = null;
      hoveredElementRect = null;
    }
  } else {
    // Clear hovered element when mouse is not over any specific element
    if (hoveredElement) {
      console.log("[Antishift] No longer hovering any specific element");
    }
    hoveredElement = null;
    hoveredElementRect = null;
  }

  // If hover state changed, unpause mutations
  if ((wasHovering && !hoveredElement) || (!wasHovering && hoveredElement)) {
    console.log("[Antishift] Hover state changed, unpausing mutations");
    unpauseMutations();
  }

  requestAnimationFrame(myAnimationLoop);
}

console.log("[Antishift] Library initialized");
requestAnimationFrame(myAnimationLoop);
