// Dependencies 
import SectionManager from "./sectionManager.js";

// Variables 
const infoForm = document.forms.infoForm;
const saveInfoButton = infoForm.querySelector("#save-info");

const filtersForm = document.forms.filtersForm;
const earliestDateInput = filtersForm.querySelector("#earliestDate");

const runButton = document.querySelector("#run");

const state = {
    savingInfo: false
};

const userInfo = {};
const userInfoFields = ["lastName", "licenseNumber", "icbcKeyword", "licenseClass"];

// Functions 
const loadUserInfo = firstLoad => {
    chrome.storage.local.get(["userInfo"], data => {
        if (!("userInfo" in data)) {
            if (firstLoad)
                SectionManager.expand("info");

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
    saveInfoButton.textContent = "Saving";

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
        saveInfoButton.textContent = "Save";
    });
};

// Events 
saveInfoButton.addEventListener("click", event => {
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
loadUserInfo(true);