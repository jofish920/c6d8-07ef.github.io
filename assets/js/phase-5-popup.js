export const POPUP_CONTAINER_CLASS = 'popup-menu';
export const POPUP_ACTIVE_CONTAINER_CLASS = 'active-menu';
export const POPUP_CONTAINER_SELECTOR = `.${POPUP_CONTAINER_CLASS}`;
export const POPUP_BUTTON_SELECTOR = ".popup-button";
export const NAV_ITEM_CLASS = "nav-item";
export const NAV_ITEM_SELECTOR = `.${NAV_ITEM_CLASS}`;
export const NAV_ITEM_OR_BUTTON_SELECTOR = `${NAV_ITEM_SELECTOR}, ${POPUP_BUTTON_SELECTOR}`;
export const NAV_ITEM_FOCUS_SELECTOR = `${NAV_ITEM_SELECTOR} a`;

const KEY_DOWN = 'keydown';
const CLICK = 'click';
const FOCUS = 'focus';
const BLUR = 'blur';

const ESCAPE_KEY = 'Escape';
const CANCEL_KEY = 'Cancel';
const UP_KEY = 'ArrowUp';
const DOWN_KEY = 'ArrowDown';

let currentPopup = null;


/**
 * Closes a popup - also called when a popup has been closed.
 */
function closePopup(container)
{
    document.body.removeEventListener(
        CLICK, onClickedWhileOpen, { capture: true }
    );

    console.log('removing focus handlers');
    for (const item of currentPopup.querySelectorAll(NAV_ITEM_FOCUS_SELECTOR))
    {
        console.log('removing focus handlers from ', item);
        item.removeEventListener(FOCUS, onFocusWhileOpen);
        item.removeEventListener(BLUR, onBlurWhileOpen);
    }

    document.body.removeEventListener(KEY_DOWN, onKeyWhileOpen);

    currentPopup.classList.remove(POPUP_ACTIVE_CONTAINER_CLASS);
    currentPopup = null;
}

/**
 * Called when a popup has been opened.
 * @param container
 */
function onPopupOpened(container)
{
    currentPopup = container;

    document.body.addEventListener(
        CLICK, onClickedWhileOpen, { capture: true }
    );

    console.log('adding focus handlers');
    for (const item of currentPopup.querySelectorAll(NAV_ITEM_FOCUS_SELECTOR))
    {
        console.log('adding focus handlers to ', item);
        item.addEventListener(FOCUS, onFocusWhileOpen);
        item.addEventListener(BLUR, onBlurWhileOpen);
    }

    document.body.addEventListener(KEY_DOWN, onKeyWhileOpen);

    container.querySelector(NAV_ITEM_FOCUS_SELECTOR).focus();
}

/**
 * Handle clicks outside an open popup by closing it.
 * @param event
 */
function onClickedWhileOpen(event)
{
    const popup = event.target.closest(POPUP_CONTAINER_SELECTOR);
    if (currentPopup && ! popup) {
        closePopup();
    }
}

/**
 * <p>Should be assigned as a click handler for the element used to show or hide a
 * popup menu.</p>
 * <p>There should be a container with class <code>popup-menu</code> that contains
 * both button and popup menu.  When the element is clicked, the <code>active-menu</code>
 * class will be added to the container, and CSS will handle showing or hiding the
 * popup content.</p>
 * @param event {UIEvent} the activating event.
 */
export function onPopupTapped(event)
{
    const container = event.target.closest(POPUP_CONTAINER_SELECTOR);

    event.preventDefault();

    if (! container)
    {
        alert("Button not in a popup container.");
        return;
    }

    const isActive = container.classList.toggle(POPUP_ACTIVE_CONTAINER_CLASS);

    // Ensure that only one popup is active at a time.
    if (currentPopup)
    {
        closePopup();
    }

    if (isActive)
    {
        onPopupOpened(container);
    }
}

function findNextMatch(start, next, selector)
{
    let item = start;

    while (item && !item.matches(selector))
    {
        item = next(item);
    }

    return item;
}

/**
 * Moves the current focus up or down a number of steps in the menu.
 * @param steps the number of steps up (-ve) or down (+ve).
 * @returns {*}
 */
export function selectUpDown(steps = 1)
{
    console.log('selectUpDown', steps, _focusItem);
    if (! _focusItem) return;

    let item = _focusItem.closest(NAV_ITEM_SELECTOR);
    let next;

    if (steps < 0)
    {
        steps = -steps;
        next = item => item.previousElementSibling;
    }
    else
    {
        next = item => item.nextElementSibling;
    }

    let nextNavItem = item => findNextMatch(next(item), next, NAV_ITEM_SELECTOR);
    while (steps > 0)
    {
        item = nextNavItem(item);
        --steps;
    }

    if (item)
    {
        const focusable = item.querySelector(NAV_ITEM_FOCUS_SELECTOR);
        console.log('setting focus to ', focusable);
        focusable.focus();
    }

    // skip selecting the popup button - escape to cancel

    return item;
}

let _focusItem = undefined;

// Note that a general-purpose solution for replicating the use of
// tab/shift+tab would involve using something like
// [tabbable](https://github.com/focus-trap/tabbable)
// to get a list of all tabbable items in the order that they should be
// visited.  However, this is a special case.  We only need to consider
// menu items.

function onKeyWhileOpen(event)
{
    console.log('onKeyWhileOpen', event);
    switch (event.key)
    {
        case UP_KEY:
            selectUpDown(-1);
            event.preventDefault();
            break;
        case DOWN_KEY:
            selectUpDown(+1);
            event.preventDefault();
            break;
        case ESCAPE_KEY:
        case CANCEL_KEY:
            closePopup();
            event.preventDefault();
            break;
    }
}

function onFocusWhileOpen(event)
{
    // Shouldn't be needed, since listeners are only added to nav items or targets
    _focusItem = event.target.closest(NAV_ITEM_OR_BUTTON_SELECTOR);
    console.log('Menu item got focus ', _focusItem, event.target);
}

function onBlurWhileOpen(event)
{
    console.log('Menu item losing focus ', _focusItem, event.target);
    _focusItem = null;
}

/**
 * Adds click handlers to elements with a class name of
 * <code>popup-button</code>.
 */
export function init()
{
    for (const element of document.querySelectorAll(POPUP_BUTTON_SELECTOR))
    {
        element.addEventListener("click", onPopupTapped);
    }
    console.log('initialised popup menu handling');
}