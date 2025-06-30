// File: assets/js/contacts.js

import {runInit} from './util.js';

const SUBMIT = 'submit';
const CHANGE = 'change';
const INPUT_CHANGED = 'input';

const HIDDEN = 'hidden';

class Contacts
{
    /**
     * The form element
     * @type {HTMLFormElement}
     */
    get formElement()
    {
        return document.getElementById('contact-form');
    }

    /** The submit button */
    get submitElement()
    {
        return document.getElementById('submit')
    }

    /** The collection of all input elements belonging to the contacts form. */
    get inputElements()
    {
        return this.formElement.querySelectorAll('input, textarea');
    }

    /**
     * @returns {NodeListOf<Element>} all invalid inputs.
     */
    get invalidInputs()
    {
        return this.formElement.querySelectorAll(':invalid');
    }

    get hasInvalidInputs()
    {
        return this.invalidInputs.length > 0;
    }

    /**
     * Controls whether the submit button is disabled if there
     * are any errors detected - this is generally a bad idea, since
     * browsers tend to do their own error-checking when the submit button
     * is clicked.
     * @param value
     */
    get disableSubmitOnError()
    {
        return this._disableSubmitOnError;
    }

    set disableSubmitOnError(value)
    {
        this._disableSubmitOnError = value;
        this.updateSubmit();
    }

    /** Gets all form elements currently flagged by the browser as invalid. */
    getErrorElements(control)
    {
        const selector = `.${control.name}-error`;
        return this.formElement.querySelectorAll(selector);
    }

    /**
     * Sets the submit button to disabled if there are any invalid elements
     * and <code>this.disableSubmitOnError</code> is <code>true</code>.
     */
    updateSubmit()
    {
        this.submitElement.disabled = this.hasInvalidInputs && this.disableSubmitOnError;
    }

    /**
     * Performs validation on {@link control}, updates any error message, and if
     * <code>this.disableSubmitOnError</code> is <code>true</code> and the field is
     * invalid, disables the submit button.
     * @param control
     * @param updateSubmit
     */
    validateInput(control, updateSubmit = true)
    {
        const isValid = control.matches(':valid');
        const messageElements = this.getErrorElements(control);

        console.log(`isValid ${control.name} = ${isValid}`);
        console.log(`mesageElements for ${control.name} = `, messageElements);

        if (isValid) {
            for (const messageElement of messageElements) {
                messageElement.classList.add(HIDDEN);
            }
        }
        else {
            for (const messageElement of messageElements) {
                messageElement.classList.remove(HIDDEN);
            }
        }

        if (updateSubmit) {
            this.updateSubmit();
        }
    }

    /**
     * Performs validation on all input elements.
     */
    validateAll()
    {
        console.log(`validating all inputs`);
        for (const control of this.inputElements) {
            this.validateInput(control, false);
        }
        this.updateSubmit();
    }

    /**
     * Called when the value in an input representing an API parameter changes.
     */
    onInputChanged(event)
    {
        this.validateInput(event.target);
    }

    /**
     * Called when the form is submitted.
     * @param event {SubmitEvent}
     */
    async onSubmit(event)
    {
        event.preventDefault();

        const data = new FormData(this.formElement);
        const response = await fetch(this._action, {
           method: "POST",
           body: data
        });
        let responseData = {
            errors: "Error parsing response body."
        };

        try {
            responseData = response.json();
        }
        catch (ex)
        {
            errors.push(ex.message);
        }

        if (response.ok)
        {
            alert("Message delivered!");
            if (document.referrer)
            {
                document.location = document.referrer;
            }
        }
        else
        {
            const errors = responseData.errors || [];

            alert(`
                Failed to deliver message via ${this._action}.
                
                ${response.status}: ${response.statusText}
                
                ${errors}
                `);
        }
    }

    /**
     * Attaches event listeners that validate a control whenever it is updated.
     */
    addEventListeners()
    {
        this.formElement.addEventListener('submit', this._sumbitHandler);
        for (const control of this.inputElements)
        {
            control.addEventListener(INPUT_CHANGED, this._changeHandler);
        }
    }

    /**
     * Removes all installed event listeners.
     */
    removeEventListeners()
    {
        this.formElement.removeEventListener('submit', this._sumbitHandler);
        for (const control of this.inputElements)
        {
            control.removeEventListener(INPUT_CHANGED, this._changeHandler);
        }
    }

    /**
     * @param disableSubmitOnError {boolean} clear to let browser handle disabling
     *   submit when it detects an invalid input.
     */
    constructor(disableSubmitOnError = false)
    {
        const host = document.location.host;

        if (host.indexOf("localhost") >= 0)
        {
            this._action = "contact-handler.php";
        }
        else
        {
            this._action = "https://jfm.atta88.au/contact-handler.php";
        }
        this._changeHandler = this.onInputChanged.bind(this);
        this._sumbitHandler = this.onSubmit.bind(this);
        this._disableSubmitOnError = disableSubmitOnError;
        this.addEventListeners();
        this.validateAll();
    }
}

/** @type {Promise<Contacts>|undefined} */
let _contactsPromise = undefined;

/** @returns {Promise<Contacts>} */
export function init()
{
    if (!_contactsPromise)
    {
        _contactsPromise = runInit(() => new Contacts());
    }
    return _contactsPromise;
}

// End: assets/js/contacts.js