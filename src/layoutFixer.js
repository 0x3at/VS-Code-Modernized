// VS Code Modernized - layoutFixer.js

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func Function to debounce.
 * @param {number} delay Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Reads the value of a CSS custom property from the root element.
 * @param {string} propertyName The name of the CSS custom property (e.g., '--spacing').
 * @returns {string} The value of the property, or an empty string if not found.
 */
function getCssVariable(propertyName) {
    return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim();
}

/**
 * Main layout adjustment logic.
 * This function will be called when layout changes are detected.
 * It should identify problematic elements and apply corrections.
 */
function adjustLayout() {
    console.log('[VS Code Modernized] adjustLayout triggered.');
    // const spacing = getCssVariable('--spacing') || '0.35rem'; // Example of reading a CSS var

    // --- Editor Groups ---
    // Problem: `.editor-group-container` height is `calc(100% - var(--spacing)) !important;`
    // If VS Code changes parent height or adds/removes siblings, this can break.
    const editorGroups = document.querySelectorAll('.monaco-workbench .part.editor .editor-group-container');
    editorGroups.forEach((group, index) => {
        if (group instanceof HTMLElement) {
            // const parent = group.parentElement;
            // if (parent) {
            //     const parentHeight = parent.offsetHeight;
            //     const newHeight = parentHeight - parseFloat(spacing) * (parseFloat(getComputedStyle(document.documentElement).fontSize)); // Simplified
            //     group.style.setProperty('height', `${newHeight}px`, 'important');
            //     console.log(`[VS Code Modernized] Adjusted Editor group ${index} height to ${newHeight}px`);
            // }
            console.log(`[VS Code Modernized] Editor group ${index} current offsetHeight: ${group.offsetHeight}px. Needs dynamic adjustment strategy.`);
        }
    });

    // --- Panels (Terminal, Output, etc.) ---
    // Problem: Similar `calc(100% - X)` height issues.
    const panels = document.querySelectorAll('.monaco-workbench .part.panel.bottom');
    panels.forEach((panel, index) => {
        if (panel instanceof HTMLElement) {
            // Similar dynamic height calculation based on its actual container would be needed.
            console.log(`[VS Code Modernized] Panel ${index} current offsetHeight: ${panel.offsetHeight}px. Needs dynamic adjustment strategy.`);
        }
    });

    // --- Tab Bar Misalignment ---
    // This is more complex. It might involve:
    // - Ensuring the `.tabs-container` has the correct height.
    // - Adjusting `line-height` or `padding/margin` of individual `.tab` elements or `.tab-label`
    //   if they are pushed down or overlap due to parent container height changes.
    // Example: If tabs are overflowing, it might be because the editor title area (.title)
    // or the editor group itself doesn't have the correct height.
    const tabContainers = document.querySelectorAll('.monaco-workbench .part.editor .tabs-container');
    tabContainers.forEach((container, index) => {
        if (container instanceof HTMLElement) {
            console.log(`[VS Code Modernized] Tab container ${index} offsetHeight: ${container.offsetHeight}px. Child tabs might need y-axis adjustment.`);
            // const tabs = container.querySelectorAll('.tab');
            // tabs.forEach(tab => { /* Potentially adjust tab.style.transform or marginTop */ });
        }
    });

    // --- Header Actions / Menus ---
    // These are highly dependent on their specific containers.
    // Selectors would need to be very specific, e.g., for actions in '.titlebar-right',
    // or menus within '.monaco-menu-container'.
    // Adjustment might involve setting `top`, `transform: translateY`, or ensuring parent containers
    // have correct dimensions so these elements flow naturally.
    console.log('[VS Code Modernized] Header actions/menus would need specific selectors and adjustment logic.');

    // Note: The actual calculations (e.g., `calculateIdealHeight`) are complex and would require
    // careful inspection of VS Code's DOM structure and the extension's CSS intentions.
    // This POC focuses on *when* and *where* to adjust, rather than the exact pixel calculations.
}

const debouncedAdjustLayout = debounce(adjustLayout, 300); // Slightly increased debounce

/**
 * Checks if a mutation is relevant for triggering a layout adjustment.
 * @param {MutationRecord} mutation The mutation record.
 * @returns {boolean} True if relevant, false otherwise.
 */
function isMutationRelevant(mutation) {
    if (!(mutation.target instanceof HTMLElement)) {
        return false;
    }

    // Style or class changes on key layout parts or their direct children.
    if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        if (mutation.target.matches('.monaco-grid-view, .part.editor, .part.panel, .monaco-split-view2, .editor-group-container, .tabs-container, .titlebar')) {
            return true;
        }
        // Check if the target is a direct child of some important containers
        const parent = mutation.target.parentElement;
        if (parent && parent.matches('.editor-group-container > .title, .part.panel > .content')) {
            return true;
        }
    }

    // Adding/removing children from key layout parts.
    if (mutation.type === 'childList') {
        if (mutation.target.matches('.monaco-grid-view, .part.editor > .content, .part.panel > .content, .editor-group-container, .tabs-container')) {
            return true;
        }
    }
    return false;
}


/**
 * Initializes the layout fixer.
 * Sets up event listeners and MutationObserver.
 */
function initializeLayoutFixer() {
    console.log('[VS Code Modernized] Initializing layoutFixer.js...');

    // 1. Listen to window resize
    window.addEventListener('resize', debouncedAdjustLayout);

    // 2. Use MutationObserver to watch for DOM changes.
    // It's crucial to observe elements whose changes are likely to cause misalignment.
    // Observing the entire workbench can be performance-intensive.
    // Consider observing specific layout containers like '.monaco-grid-view' or parents of problematic elements.
    const mainLayoutContainer = document.querySelector('.monaco-grid-view'); // A common top-level layout container in VS Code.

    if (mainLayoutContainer) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (isMutationRelevant(mutation)) {
                    console.log('[VS Code Modernized] MutationObserver detected relevant change:', mutation.type, mutation.target);
                    debouncedAdjustLayout();
                    return; // Adjust layout once per batch of mutations if a relevant one is found.
                }
            }
        });

        observer.observe(mainLayoutContainer, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'class', 'id'], // Watch for style, class, or id changes which often signal structural or state changes.
        });
        console.log('[VS Code Modernized] MutationObserver attached to .monaco-grid-view.');
    } else {
        // Fallback if .monaco-grid-view isn't found, try .monaco-workbench. This might be too broad.
        const workbenchElement = document.querySelector('.monaco-workbench');
        if (workbenchElement) {
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (isMutationRelevant(mutation)) {
                        console.log('[VS Code Modernized] MutationObserver (workbench fallback) detected relevant change:', mutation.type, mutation.target);
                        debouncedAdjustLayout();
                        return;
                    }
                }
            });
            observer.observe(workbenchElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class', 'id'] });
            console.log('[VS Code Modernized] MutationObserver attached to .monaco-workbench (fallback).');
        } else {
            console.warn('[VS Code Modernized] Neither .monaco-grid-view nor .monaco-workbench element found for MutationObserver.');
        }
    }

    // Initial adjustment on load. Using requestAnimationFrame to ensure it runs after initial paint.
    requestAnimationFrame(() => {
        setTimeout(adjustLayout, 500); // Further delay for VS Code's own dynamic layouts.
    });
    console.log('[VS Code Modernized] layoutFixer.js initialized.');
}

// Ensures the script runs after the main DOM is loaded and VS Code's UI is more likely to be stable.
function robustDomReady(callback) {
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

robustDomReady(initializeLayoutFixer);


// Exporting for potential future use if this script were to be modularized,
// but for direct injection, this isn't strictly necessary.
// (self.vsCodeModernizedLayoutFixer = { initializeLayoutFixer, adjustLayout, getCssVariable });
