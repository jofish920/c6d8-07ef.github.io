/// File: phase-4.js
/* jslint esversion: 9 */
// es8: async (could construct explicit promises)
// es9: object spread syntax (could fix using Object.assign)

/**
 * @file Interaction logic for "phase-4/index.html".
 */

import {
    runInit,
    setClassIf, byId, isValid, valuesAsString, toPropertyDescriptors,
    isValidatable
} from "./util.js";

// API KEYS - should be secured by running the calls on a TAFE server.

const NINJA_API_KEY = "ANRVIEoyjEluXhP+SG5OCQ==6L3gpaV6sNL6Adwf";

// APIs
export const NINJA_BASE = "https://api.api-ninjas.com/v1";
export const QR_CODE_API_ID = "qr-code";
export const URL_LOOKUP_API_ID = "url-lookup";

// Event Names
const SUBMIT = 'submit';
const CHANGE = 'change';
const INPUT_CHANGED = 'input';

// Values for HTML class attribute
const HIDDEN = 'hidden';

// Validation
const NONEMPTY_PATTERN = '.*[^ ].*';
const HOSTNAME_PATTERN = '[\\-a-zA-Z0-9]+(?:.[\\-a-zA-Z0-9]+)*';

// Precision
const GEO_PRECISION = 2;

/**
 * Information needed to enable or disable validation for all inputs belonging to
 * a supported API.
 * @type {Map<{string}, Map<{string}, {{'required': {boolean}, 'pattern': {string}}}>>}
 */
const VALIDATION = new Map([
    [QR_CODE_API_ID, new Map([
        ['qr-data-param', {
            required: true,
            pattern: NONEMPTY_PATTERN,
        }]
    ])],
    [URL_LOOKUP_API_ID, new Map([
        ['url-param', {
            required: true,
            pattern: HOSTNAME_PATTERN,
        }]
    ])]
]);

// Get the information to set the parameters that the browser needs to validate `control`
// when setting up a call to the API associated with `apiId`.
function getValidationInfo(apiId, control) {
    const apiInfo = VALIDATION.get(apiId);
    if (apiInfo) {
        return apiInfo.get(control.name);
    }
}

/**
 * An error thrown when {@link fetch} returns a response (`response`) in
 * an API Ninja call, but `response.ok` is `false`.
 */
export class ResponseNotOKError extends Error {
    constructor(response) {
        super(`HTTP error (${response.status}) ${response.statusText}`);

        this.response = response;
    }

    async text() {
        if ('string' == typeof this._text)
        {
            return this._text;
        }

        if (this.response.bodyUsed) {
            this._text = '{"error": "Details unavailable - the response body has already been used."}'
        } else {
            this._text = await this.response.text();
        }

        return this._text;
    }

    async json() {
        const text = await this.text();
        this._json = JSON.parse(text);
        return this._json;
    }
}

/**
 * Makes a call to an API Ninja service specified by {@link url}.
 * @param url a url containing the API route and parameters
 * @param fetchInit {RequestInit|null} parameters to be passed to fetch; values override defaults.
 * @returns {Promise<Response>} the {@link Response} object returned by {@link fetch}.
 */
export async function ninjaFetch(url, fetchInit = null, errorOnFail = true)
{
    const info = fetchInit || {};
    const headers = info.headers || {};

    const response = await fetch(url, {
        ...info,
        headers: {
            "X-Api-Key": NINJA_API_KEY,
            ...headers,
        }
    });

    if (errorOnFail && ! response.ok) {
        throw new ResponseNotOKError(response);
    }

    return response;
}

/** Constructs URL for making a GET request to API Ninja's QR Code service. */
export function getQrCodeApiUrl(data, format='png') {
    data = encodeURIComponent(data);
    format = encodeURIComponent(format);
    return `${NINJA_BASE}/qrcode?format=${format}&data=${data}`;
}

/**
 * Makes a call to API Ninja's QR Code service, and returns a promise that yields
 * the HTTP response
 */
export async function ninjaQrCall(data)
{
    return await ninjaFetch(getQrCodeApiUrl(data), {
        headers: {"Accept": "image/png"}
    });
}

/**
 * Makes a call to API Ninja's QR Code service, and returns a promise that yields
 * the image data.
 */
export async function ninjaQrCodeAsBlob(data)
{
    return await (await ninjaQrCall(data)).blob();
}

/**
 * Makes a call to API Ninja's QR Code service, and returns a promise that yields
 * a URL that can be used as the `src` attribute for an image.
 *
 * The function {@link URL.revokeObjectURL} should be called to when the data is
 * no longer needed.
 */
export async function ninjaQrCodeAsURL(data)
{
    return URL.createObjectURL(await ninjaQrCodeAsBlob(data));
}

/**
 * Constructs URL for making a GET request to API Ninja's URL Lookup service.
 */
export function getUrlLookupApiUrl(url) {
    url = encodeURIComponent(url);
    return `${NINJA_BASE}/urllookup?url=${url}`;
}

/**
 * @markdown
 * Looks up the details associated with {@link url} using
 * <a href="https://api-ninjas.com/api/urllookup">API Ninja's URL Lookup service</a>.
 * If {@link errorOnFail} is `true`, then throws an
 *
 * @param url
 * @param errorOnFail
 * @returns {Promise<Response>} the HTTP response.
 */
export function ninjaLookupUrlCall(url, errorOnFail = true)
{
    return ninjaFetch(getUrlLookupApiUrl(url), null, errorOnFail);
}

/** Provides typehints for URL Lookup API call results. */
class BaseUrlLookupResult {
    /** @type {boolean} */ is_valid;
    constructor(info) {
        this._info = info;
        this.is_valid = info.is_valid;
    }
}

/** Provides typehints for URL Lookup API call results. */
class URLLookupResultNone extends BaseUrlLookupResult {
    constructor(info) {
        super(info);
    }
}

/** Provides typehints for URL Lookup API call results. */
class URLLookupResult extends BaseUrlLookupResult {
    /** @type {string} */ country;
    /** @type {string} */ region;
    /** @type {string} */ country;
    /** @type {string} */ city;
    /** @type {string} */ zip;
    /** @type {number} */ lat;
    /** @type {number} */ lon;
    /** @type {string} */ timezone;
    /** @type {string} */ isp;
    constructor(info) {
        super(info);
        Object.assign(this, info);
    }
}

/**
 *  @returns {URLLookupResult|URLLookupResultNone}
 */
function toUrlLookupResult(info) {
    return info.is_valid ? new URLLookupResult(info) : new URLLookupResultNone(info);
}

/**
 * Looks up the details associated with {@link url} using
 * <a href="https://api-ninjas.com/api/urllookup">API Ninja's URL Lookup service</a>.
 *
 * @param url {string} the url to be looked up by the API service.
 * @returns {Promise<URLLookupResult|URLLookupResultNone>}
 */
export async function ninjaLookupUrl(url)
{
    const response = await ninjaLookupUrlCall(url, true);
    return toUrlLookupResult(await response.json());
}

/**
 * @markdown
 * Application interface object (not quite a controller);
 * provides access to controls and associated values.
 *
 * ## Limitations
 *
 * - single parameter per API call; easy to fix,
 * but not currently required.
 *
 * - uses unique ids for some elements, so restricted to 1 instance
 *   per page.
 */
class App {
    // OUTPUTS

    /**
     * Results section that is displayed before an API call is made.
     */
    get noDataSection() {
        return byId('ninja-no-data');
    }

    /**
     * Section containing results from a successful URL Lookup API call.
     */
    get urlLookupResultSection() {
        return byId('url-lookup-result-container');
    }

    /**
     * Section containing results from where the URL Lookup API call succeeded,
     * but the results indicate that the specified URL is invalid.
     */
    get urlInvalidURLResultSection() {
        return byId('url-lookup-result-invalid');
    }

    /**
     * Section that displays the results from a successful call to URL Lookup
     * in which information about the specified URL was returned.
     */
    get qrCodeResultSection() {
        return byId('qr-code-result');
    }

    /**
     * Section that displays an error message when trying to call the API results
     * in an exception being thrown.
     */
    get apiCallErrorSection() {
        return byId('api-error');
    }

    /**
     * Element used to display "country" output from the URL Lookup API call.
     */
    get urlResultCountry() {
        return byId('url-lookup-result-country');
    }

    /**
     * Element used to display "region" output from the URL Lookup API call.
     */
    get urlResultRegion() {
        return byId('url-lookup-result-region');
    }

    /**
     * Element used to display "city" output from the URL Lookup API call.
     */
    get urlResultCity() {
        return byId('url-lookup-result-city');
    }

    /**
     * Element used to display "zip" output from the URL Lookup API call.
     */
    get urlResultZip() {
        return byId('url-lookup-result-zip');
    }

    /**
     * Element used to display "lat" output from the URL Lookup API call.
     */
    get urlResultLat() {
        return byId('url-lookup-result-lat');
    }

    /**
     * Element used to display "lon" output from the URL Lookup API call.
     */
    get urlResultLon() {
        return byId('url-lookup-result-lon');
    }

    /**
     * Element used to display "timezone" output from the URL Lookup API call.
     */
    get urlResultTimezone() {
        return byId('url-lookup-result-timezone');
    }

    /**
     * Element used to display "isp" output from the URL Lookup API call.
     */
    get urlResultISP() {
        return byId('url-lookup-result-isp');
    }

    /**
     * Shows the default results section displayed when no API call has been made.
     */
    clearResults() {
        this.showOutputSection(this.noDataSection);
    }

    /**
     * Displays a section within the results, hiding all other sections.
     * @param element {HTMLElement} the results section to be displayed.
     */
    showOutputSection(element) {
        let container = element.parentElement;

        if (container.classList.contains('results-container')) {
            throw new Error("Element specified is not in a results container");
        }

        for (let section of container.querySelectorAll(':scope > *:not(h2)')) {
            if (section !== element) {
                section.classList.add(HIDDEN);
            }
        }

        element.classList.remove(HIDDEN);
    }

    showError(message) {
        this.apiCallErrorSection.innerText = message;
        this.showOutputSection(this.apiCallErrorSection);
    }

    // INPUTS

    /** Parent of all input elements in the applet. */
    get form() {
        return byId('ninja-form');
    }

    /**
     * A list of all checkboxes used for selecting an API.
     * @returns {[HTMLInputElement]}
     */
    get apiCheckboxes() {
        return [...this.form['ninja-api'].values()];
    }

    /**
     * Gets the currently checked API checkbox.
     * @returns {HTMLInputElement}
     */
    get selectedApiCheckbox() {
        return this._apiCheckbox;
    }

    /**
     * Sets selectedApiCheckbox property to value.
     * Updates checkboxes so that only the specified checkbox is checked.
     * @param value {HTMLInputElement}
     * */
    set selectedApiCheckbox(value) {
        if (this._apiCheckbox === value) return;

        const oldBox = this._apiCheckbox;
        if (oldBox) {
            this.form.classList.remove(oldBox.value);
        }

        this._apiCheckbox = value;

        this.form.classList.add(value.value);

        for (let box of this.apiCheckboxes) {
            box.checked = (box === value);
        }

        this.clearResults();
        this.updateValidation();
        this.validateInputsForAPI();
    }

    /** The value of the currently checked API checkbox. */
    get apiId() {
        return this.selectedApiCheckbox.value;
    }

    set apiId(apiId) {
        this.selectedApiCheckbox = this.form.querySelector(
            `.ninja-checkbox-container input[value="${apiId}"]`
        );
    }

    /**
     * All input controls, regardless of API.
     * @returns {HTMLCollectionOf<HTMLElementTagNameMap[string]>}
     */
    get allInputControls() {
        return this.form.getElementsByTagName('input');
    }

    /**
     * All inputs belonging to the current API.
     * @returns {[HTMLInputElement]}
     */
    get apiInputControls() {
        const selector = `input.${this.apiId}`;
        return [...this.form.querySelectorAll(selector)];
    }

    /**
     * All invalid inputs belonging to the current API.
     * @returns {[HTMLInputElement]}
     */
    get invalidApiInputs() {
        const selector = `input.${this.apiId}:invalid`;
        return [...this.form.querySelectorAll(selector)];
    }

    /** Button that causes an API call to be made. */
    get submitButton() {
        return byId('ninja-button');
    }

    /** Control for the parameter to the QR Code API call */
    get qrInput() {
        return byId("qr-code-parameter");
    }

    /** Control for the parameter to the URL Lookup API call */
    get urlInput() {
        return byId("url-lookup-parameter");
    }

    /**
     * Updates the state of the submit button according to whether
     * there are invalid parameter values for the selected API.
     */
    updateSubmit() {
        this.submitButton.disabled = (this.invalidApiInputs.length > 0);
    }

    /**
     * Updates the `required` attribute on all fields according to what the
     * needs of the API.
     */
    updateValidation() {
        const {apiId} = this;

        for (let input of this.allInputControls)
        {
            const validationInfo = getValidationInfo(apiId, input);

            if (validationInfo) {
                input.required = validationInfo.required;
                input.pattern = validationInfo.pattern;
            }
            else
            {
                input.removeAttribute('required');
                input.removeAttribute('pattern');
            }
        }
    }

    /**
     * @markdown
     * Updates the form based on the validity of the data in *control*.
     * If *updateSubmit* is `false`, then skips activating or deactivating
     * the button `this.submit` based on the presence of errors in the inputs
     * for the current API.
     * @param control {HTMLInputElement}
     * @param updateSubmit {boolean} whether to set the `deactivated` property
     *   of the submit button based on the presence of invalid data in visible
     *   controls.
     */
    validateInput(control, updateSubmit = true) {
        const messageElement = this.form.querySelector(
            ".error-message." + control.name
        );

        if (messageElement)
        {
            const ok = isValid(control);
            setClassIf(messageElement, HIDDEN, ok);
        }

        if (updateSubmit)
        {
            this.updateSubmit();
        }
    }

    /**
     * Validates all input controls for the currently selected API,
     * and updates the form accordingly.
     */
    validateInputsForAPI() {
        const {apiInputControls} = this;
        for (const control of apiInputControls) {
            if (isValidatable(control))
            {
                this.validateInput(control, false);
            }
        }
        this.updateSubmit();
    }

    /**
     * @markdown
     * Adds `method.bind(this)` as a handler for events of type `eventName` generated by
     * `target`, saving the generated listener to support {@link removeEventListeners}.
     * @param target the event source.
     * @param eventName the name of the event being monitored.
     * @param method the handler (a method).
     * @param options options to pass to {@link addEventListener}.
     * @private
     */
    _addListener(target, eventName, method, options) {
        const listener = method.bind(this);
        this._listeners.push([target, eventName, listener, options]);
        target.addEventListener(eventName, listener, options);
    }

    /**
     * Removes all listeners added with {@link addEventListeners}.
     */
    removeEventListeners() {
        for (const [target, eventName, listener, options] of this._listeners) {
            target.removeEventListener(eventName, listener, options);
        }
        this._listeners.length = 0;
    }

    /**
     * Adds event listeners defined in the object to form elements.
     */
    addEventListeners() {
        this.removeEventListeners();

        for (const box of this.apiCheckboxes) {
            this._addListener(box, CHANGE, this.onApiCheckboxChanged);
        }

        for (const input of this.allInputControls) {
            this._addListener(input, INPUT_CHANGED, this.onInputChanged);
        }

        this._addListener(this.form, SUBMIT, this.onSubmit);
    }
    
    /**
     * Called when the value of one of the API selection checkboxes changes.
     */
    onApiCheckboxChanged(event) {
        const {selectedApiCheckbox} = this;
        const {target} = event;
        // Change && selected => switching to another API
        // No change && not selected => restore previous state
        const needToSet = (target !== selectedApiCheckbox) == target.checked;
        if (needToSet) {
            this.selectedApiCheckbox = target;
        }
    }

    /**
     * Called when the value in an input representing an API parameter changes.
     */
    onInputChanged(event) {
        this.validateInput(event.target);
    }


    /**
     * A function that handles the API-specific part of what happens when
     * the user clicks on the submit button.
     * @type {(function(): Promise<void>)|undefined}
     */
    get _apiHandler()
    {
        switch (this.apiId) {
            case URL_LOOKUP_API_ID:
                return this.onURLLookupSubmit.bind(this);
            case QR_CODE_API_ID:
                return this.onQRCodeSubmit.bind(this);
        }
    }


    /**
     * Execute QR Code API call using parameters from form and update UI.
     * Does not handle exceptions.
     */
    async onQRCodeSubmit()
    {
        const data = this.qrInput.value;
        const img = document.createElement('img');
        const container = this.qrCodeResultSection;
        const srcURL = await ninjaQrCodeAsURL(data);

        // Double check that the previous URL was revoked.
        if (this._cachedObjectURL) {
            URL.revokeObjectURL(this._cachedObjectURL);
        }

        img.src = srcURL;
        this._cachedObjectURL = srcURL;
        container.innerHTML = '';
        container.appendChild(img);
        this.showOutputSection(container);
    }

    _geoPositionToString(geoPosition) {
        return (geoPosition === undefined) ? "undefined" : geoPosition.toFixed(this.geoPrecision);
    }

    /**
     * Updates UI as if {@link info} was information returned by a URL Lookup
     * API call.
     *
     * @param info {URLLookupResult|URLLookupResultNone}
     */
    updateUrlLookupResults(info)
    {
        console.log("updateUrlLookupResults = ", info);
        if (info.is_valid)
        {
            this.urlResultCountry.innerText = info.country;
            this.urlResultCity.innerText = info.city;
            this.urlResultRegion.innerText = info.region;
            this.urlResultZip.innerText = info.zip;
            this.urlResultLat.innerText = this._geoPositionToString(info.lat);
            this.urlResultLon.innerText = this._geoPositionToString(info.lon);
            this.urlResultTimezone.innerText = info.timezone;
            this.urlResultISP.innerText = info.isp;
            this.showOutputSection(this.urlLookupResultSection);
        }
        else
        {
            this.showOutputSection(this.urlInvalidURLResultSection);
        }
    }

    /**
     * Execute URL Lookup API call using parameters from form and update UI.
     * Does not handle exceptions.
     */
    async onURLLookupSubmit()
    {
        const targetURL = this.urlInput.value;
        const info = await ninjaLookupUrl(targetURL);
        this.updateUrlLookupResults(info);
    }

    /**
     * Execute call for selected API using parameters from form and update UI.
     * Calls {@link onURLLookupSubmit} or {@link onQRCodeSubmit} depending on
     * the currently selected API and handles any exceptions that are thrown.
     */
    async _makeApiCall()
    {
        let handler = this._apiHandler;

        if (! handler)
        {
            this.showError(`No API handler found for ${this.apiId}.`);
            return;
        }

        try {
            if (this._cachedObjectURL)
            {
                URL.revokeObjectURL(this._cachedObjectURL);
                this._cachedObjectURL = null;
            }
            await handler();
        }
        catch (error) {
            let message = error.message;

            if (error instanceof ResponseNotOKError)
            {
                try {
                    const parsed = await error.json();

                    message = parsed.error;
                    if (message === undefined) {
                        message = `
                        ${error.message}
                        
                        Response body:
                        ${await error.text()}
                        `;
                    }
                }
                catch (messageError) {
                    // Default to standard message
                }
            }

            this.showError(`API call failed: ${message}`);
        }
    }

    /**
     * Called when the button to make an API call is clicked.
     * Handles the exceptions that should be caught elsewhere
     * by writing them to the console.
     */
    onSubmit(event)
    {
        // No idea why onSubmit still gets called when using a disabled button...
        if (this.submitButton.disabled) return;

        // The call to this.makeApiCall should update the UI, whether it succeeds or
        // throws an exception.
        // Logging to console id just useful for debugging.
        this._makeApiCall().then(
            () => console.log("Call complete")
        ).catch(
            error => console.error("Error performing API call ", error)
        );

        event.preventDefault();
    }

    constructor() {
        this.selectedApiCheckbox = this.form.querySelector(
            '#ninja-api-checkboxes input:checked'
        );

        /** @type {[string]} */
        this.apiIds = [...valuesAsString(this.apiCheckboxes)];

        Object.defineProperties(this, toPropertyDescriptors({
            apiIds: this.apiIds
        }));

        this._cachedObjectURL = undefined;
        this.geoPrecision = GEO_PRECISION;

        this._listeners = [];
        this.addEventListeners();
        this.validateInputsForAPI();

        Object.seal(this);
    }
}

/**
 * Returns current references to HTML elements used by the code.
 * @type {App}
 */
export let app;

/**
 * Creates singleton {@link app}.
 * @returns {App} app
 */
function createApp() {
    app = new App();
    return app;
}

/**
 * Sets up initialisation task for application.
 * Tasks are executed when the document is loaded and parsed,
 * but potentially before external resources are loaded.
 * @returns {Promise<App>}
 */
export function init() {
    return runInit(createApp);
}

/// End: phase-4.js
