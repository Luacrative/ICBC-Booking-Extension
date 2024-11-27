// Dependencies 
import SectionManager from "./sectionManager.js";

// Variables 
const form = document.forms.info;

const saveInfoButton = form.querySelector("#save-info");
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
                SectionManager.expand("sign-in-info");

            return;
        }

        Object.assign(userInfo, data.userInfo);
        SectionManager.collapse("sign-in-info");

        if (firstLoad)
            SectionManager.expand("filters");
        else
            return;

        for (const field of userInfoFields) {
            const value = data.userInfo[field];

            if (field === "licenseClass")
                form.querySelector(`#${value}`).checked = true;
            else
                form.querySelector(`#${field}`).setAttribute("value", value);
        }
    });
};

const saveUserInfo = () => {
    if (state.savingInfo)
        return;

    state.savingInfo = true;
    saveInfoButton.textContent = "Saving information";

    const formData = new FormData(form);
    const newInfo = userInfoFields.reduce((result, field) => {
        result[field] = formData.get(field);
        return result;
    }, {})

    chrome.runtime.sendMessage({
        action: "getToken",
        userInfo
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
        saveInfoButton.textContent = "Save information";
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

// Initialize
loadUserInfo(true);