/**
 * @file Miscellaneous utility functions, not application-specific.
 * @markdown
 *
 * **Location:** assets/js/util.js
 */

/**
 * Conditionally adds or removes an element from a classList.
 * @param element the element affected.
 * @param className the name of the class to be added or ramoved.
 * @param shouldAdd true if className should be added, false if it should be removed.
 */
export function setClassIf(element, className, shouldAdd) {
    if (shouldAdd) {
        element.classList.add(className);
    }
    else
    {
        element.classList.remove(className);
    }
}

/**
 * Alias for document.getElementById
 */
export function byId(id) {
    return document.getElementById(id);
}

/**
 * Default for property descriptors created using {@link toPropertyDescriptors}.
 * @type {PropertyDescriptor}
 */
const DEFAULT_ATTR = {
    enumerable: true,
    configurable: false,
    writable: false
};

/**
 * @markdown
 * Maps values to a set of property descriptors that can be used to set properties
 * on another object to the current values from `values`.
 * @param values
 * @param attributes
 * @returns {PropertyDescriptorMap}
 */
export function toPropertyDescriptors(values, attributes = DEFAULT_ATTR)
{
    const descriptors = {};
    for (const [key, value] of Object.entries(values)) {
        descriptors[key] = {value, ...attributes};
    }
    return descriptors;
}

/**
 * @param controls {Iterable<{value:string}>|RadioNodeList}
 * @returns {Generator<string>} */
export function *valuesAsString(controls)
{
    for (const control of controls)
    {
        yield control.value;
    }
}

/**
 * @markdown
 * Returns `true` if control is valid according to the browser's validation logic.
 */
export function isValid(control) {
    return control.matches(":valid");
}

const VALIDATABLE_TYPES = ["", "text"];

/**
 * @markdown
 * @param control
 * @returns {boolean} `true` if *control* is validatable, `false` otherwise.
 */
export function isValidatable(control) {
    return VALIDATABLE_TYPES.includes(control.type);
}

/**
 * Runs {@link action} when the document is fully loaded.
 * May run immediately if invoked after the document has loaded.
 * @param action
 * @returns {Promise<unknown>} a promise that resolves to the result of {@link action},
 *   or rejects with whatever error was thrown that prevented a value from being
 *   returned.
 */
export function runInit(action) {
    const executor = (resolve, reject) =>
    {
        try {
            resolve(action());
        }
        catch (error) {
            reject(error);
        }
    };

    if (document.readyState === 'loading') {
        return new Promise((resolve, reject) => {
            try {
                document.addEventListener('DOMContentLoaded',() => executor(resolve, reject));
            }
            catch (error) {
                reject(error);
            }
        });
    }
    else
    {
        return new Promise(executor);
    }
}

/// End File: assets/js/util.js

