// Dependencies 
import SectionManager from "./sectionManager.js";
import Locations from "./locations.js";

// Variables 
const locationOptions = document.querySelector("#location-options");

const infoForm = document.forms.infoForm;
const infoSaveButton = infoForm.querySelector("#save-info");
const infoCheckmark = document.querySelector("#info-checkmark");

const filtersForm = document.forms.filtersForm;
const earliestDateInput = filtersForm.querySelector("#earliestDate");

const runButton = document.querySelector("#run");

const state = {
    savingInfo: false
};

const userInfo = {};
const userInfoFields = ["lastName", "licenseNumber", "icbcKeyword", "licenseClass"];

// Functions 
const createLocation = ({posId, name}) => {
    const li = document.createElement("li"); 
    li.classList.add("check-input");
    li.classList.add("thin-input");

    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", posId);
    input.setAttribute("value", posId);
    input.setAttribute("name", "locations");
    input.setAttribute("checked", "checked");
    
    const label = document.createElement("label");
    label.setAttribute("for", posId);
    label.appendChild(document.createTextNode(name));

    li.appendChild(input); 
    li.appendChild(label);
    locationOptions.appendChild(li);
};

const loadUserInfo = firstLoad => {
    chrome.storage.local.get(["userInfo"], data => {
        if (!("userInfo" in data)) {
            if (firstLoad) {
                SectionManager.expand("info");
                infoCheckmark.style.display = "none";
            }

            return;
        }

        Object.assign(userInfo, data.userInfo);
        SectionManager.collapse("info");

        if (firstLoad)
            SectionManager.expand("filters");
        else
            return;

        for (const field of userInfoFields) {
            const value = data.userInfo[field];

            if (field === "licenseClass")
                infoForm.querySelector(`#${value}`).checked = true;
            else
                infoForm.querySelector(`#${field}`).setAttribute("value", value);
        }
    });
};

const saveUserInfo = () => {
    if (state.savingInfo)
        return;

    state.savingInfo = true;

    infoSaveButton.textContent = "Saving";
    infoCheckmark.style.display = "none";

    const infoFormData = new FormData(infoForm);
    const newInfo = userInfoFields.reduce((result, field) => {
        result[field] = infoFormData.get(field);
        return result;
    }, {})

    chrome.runtime.sendMessage({
        action: "getToken",
        userInfo: newInfo
    }, response => {
        if (chrome.runtime.lastError)
            console.log("Message failed", chrome.runtime.lastError);
        else if (response && response.success) {
            const token = response.token;
            chrome.storage.local.set({ userInfo: { token, ...newInfo } });

            loadUserInfo();
        } else
            console.log("Failed to save token", response?.error);

        state.savingInfo = false;

        infoSaveButton.textContent = "Save";
        infoCheckmark.style.display = "inline-block";
    });
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

// Initialize
for (const location of Locations) 
    createLocation(location);

loadUserInfo(true);