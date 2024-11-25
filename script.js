const form = document.forms.info;

const saveInfoButton = form.querySelector("#save-info");

const userInfo = {};
const userInfoFields = ["last-name", "license-number", "icbc-keyword", "license-class"];

const loadUserInfo = () => {
    chrome.storage.local.get(["userInfo"], data => {
        if (!("userInfo" in data))
            return;

        for (const field of userInfoFields) {
            const value = data.userInfo[field];

            userInfo[field] = value;

            if (field == "license-class")
                form.querySelector(`#${value}`)
            radiobtn.checked = true;

            form.querySelector(`#${key}`).setAttribute("value", value);
        }
    });
};

const setUserInfo = async newInfo => {
    console.log(newInfo);

    chrome.storage.local.set({ userInfo: newInfo });
};

saveInfoButton.addEventListener("click", event => {
    event.preventDefault();

    const formData = new FormData(form);
    const formInput = userInfoFields.reduce((result, field) => {
        result[field] = formData.get(field);
        return result;
    }, {})

    setUserInfo(formInput);

    loadUserInfo();
});

loadUserInfo();