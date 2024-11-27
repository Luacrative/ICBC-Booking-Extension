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
const loadUserInfo = () => {
    chrome.storage.local.get(["userInfo"], data => {
        if (!("userInfo" in data))
            return;

        Object.assign(userInfo, data.userInfo);

        for (const field of userInfoFields) {
            const value = data.userInfo[field];

            if (field === "licenseClass")
                form.querySelector(`#${value}`).checked = true;
            else
                form.querySelector(`#${field}`).setAttribute("value", value);
        }
    });
};

const saveUserInfo = async newInfo => {
    chrome.runtime.sendMessage({ 
        action: "getToken",
        userInfo
    }, response => {
        if (chrome.runtime.lastError)
            console.log("Message failed", chrome.runtime.lastError);
        else if (response && response.success) {
            console.log("Success");

            const token = response.token;
            chrome.storage.local.set({ userInfo: {token, ...newInfo}});

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
    
    if (state.savingInfo)
        return;

    state.savingInfo = true;
    saveInfoButton.textContent = "Saving information";

    const formData = new FormData(form);
    const formInput = userInfoFields.reduce((result, field) => {
        result[field] = formData.get(field);
        return result;
    }, {})

    saveUserInfo(formInput);
});

runButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
        action: "getAppointments",
        userInfo
    })
});

// Initialize
loadUserInfo();