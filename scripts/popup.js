// Dependencies 
import SectionManager from "./sectionManager.js";
import Locations from "./locations.js";
import getSaved from "./savedData.js";

// Variables 
const userInfoFields = ["lastName", "licenseNumber", "icbcKeyword", "licenseClass"];

const infoForm = document.forms.infoForm;
const infoSaveButton = infoForm.querySelector("#save-info");
const infoCheckmark = document.querySelector("#info-checkmark");

const filtersForm = document.forms.filtersForm;
const earliestDateInput = filtersForm.querySelector("#earliestDate");
const maxDaysInput = filtersForm.querySelector("#maxDays");
const locationOptions = document.querySelector("#location-options");

const runButton = document.querySelector("#run");

const state = {
    savingInfo: false,
    savingFilters: false,
};

// Functions 
const createLocation = ({ posId, name }) => {
    const li = document.createElement("li");
    li.classList.add("check-input");
    li.classList.add("thin-input");

    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", `pos${posId}`);
    input.setAttribute("value", posId);
    input.setAttribute("name", "locations");

    const label = document.createElement("label");
    label.setAttribute("for", posId);
    label.appendChild(document.createTextNode(name));

    li.appendChild(input);
    li.appendChild(label);
    locationOptions.appendChild(li);
};

const getCurrentLocalTime = () => {
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() - currentTime.getTimezoneOffset());

    return currentTime.toISOString().slice(0, 16);
};

const loadUserInfo = async firstLoad => {
    const userInfo = await getSaved("userInfo");
    if (!userInfo) {
        if (firstLoad) {
            SectionManager.expand("info");
            infoCheckmark.style.display = "none";
        }

        return;
    }

    SectionManager.collapse("info");

    if (firstLoad)
        SectionManager.expand("filters");
    else
        return;

    for (const field of userInfoFields) {
        const value = userInfo[field];

        if (field === "licenseClass")
            infoForm.querySelector(`#${value}`).checked = true;
        else
            infoForm.querySelector(`#${field}`).setAttribute("value", value);
    }
};

const saveUserInfo = () => {
    if (state.savingInfo)
        return;

    state.savingInfo = true;

    infoSaveButton.textContent = "Saving";
    infoCheckmark.style.display = "none";

    const infoFormData = new FormData(infoForm);
    const userInfo = userInfoFields.reduce((result, field) => {
        result[field] = infoFormData.get(field);
        return result;
    }, {});

    console.log("Running");

    chrome.runtime.sendMessage({
        action: "getToken",
        userInfo
    }, response => {
        if (chrome.runtime.lastError)
            console.log("Message failed", chrome.runtime.lastError);
        else if (response && response.success) {
            const token = response.token;
            chrome.storage.local.set({ userInfo: { token, ...userInfo } });

            loadUserInfo();
        } else
            console.log("Failed to save token", response?.error);

        state.savingInfo = false;

        infoSaveButton.textContent = "Save";
        infoCheckmark.style.display = "inline-block";
    });
};

const loadFilters = async () => {
    const filters = await getSaved("filters") || {};

    SectionManager.collapse("filters");

    const earliestDate = filters.earliestDate || getCurrentLocalTime();
    earliestDateInput.setAttribute("min", earliestDate);

    earliestDateInput.value = earliestDate;
    maxDaysInput.value = filters.maxDays || 60;

    for (const posId of (filters.locations || Locations.map(location => location.posId))) {
        const checkbox = filtersForm.querySelector(`#pos${posId}`);
        checkbox.checked = true;
    };

    saveFilters();
};

const saveFilters = () => {
    if (state.savingFilters)
        return;

    state.savingFilters = true;

    const earliestDate = earliestDateInput.value;
    const maxDays = maxDaysInput.value;
    const locations = Locations.filter(({ posId }) => filtersForm.querySelector(`#pos${posId}`).checked).map(({ posId }) => posId);

    chrome.storage.local.set({
        filters: {
            earliestDate,
            maxDays,
            locations
        }
    });

    state.savingFilters = false;
};

// Events 
infoSaveButton.addEventListener("click", event => {
    event.preventDefault();
    saveUserInfo();
});

runButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
        action: "getAppointments",
        userInfo
    })
});

earliestDateInput.addEventListener("click", () => {
    earliestDateInput.showPicker();
});

filtersForm.addEventListener("input", saveFilters);

// Initialize
for (const location of Locations)
    createLocation(location);

loadUserInfo(true);
loadFilters();