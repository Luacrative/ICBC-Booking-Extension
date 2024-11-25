// Variables
const homeUrl = "https://onlinebusiness.icbc.com/webdeas-ui/home";
const loginUrl = "https://onlinebusiness.icbc.com/deas-api/v1/webLogin/webLogin";
const bookingsUrl = "https://onlinebusiness.icbc.com/deas-api/v1/web/getAvailableAppointments";

// Functions
const loginAuth = async userInfo => {
    const payload = {
        drvrLastName: userInfo["last-name"],
        licenceNumber: userInfo["license-number"],
        keyword: userInfo["icbc-keyword"]
    };

    const result = await fetch(loginUrl, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Cache-control": "no-cache, no-store",
            pragma: "no-cache",
            Expires: "0"
        },
        body: JSON.stringify(payload)
    });

    if (result.status != 200)
        throw new Error(`Request failed with status ${result.status}`);

    return result.headers.get("Authorization");
}

const getAppointments = async token => {
    const location = {};

    const result = await fetch(bookingsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(location)
    });

    return result;
}

const handleRun = async userInfo => {
    let lastTab;
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
        lastTab = tabs[0].id
    });

    chrome.tabs.create({ url: homeUrl, active: false }, tab => {
        const newTab = tab.id;

        chrome.tabs.onUpdated.addListener(function listener(updatedId) {
            if (updatedId != newTab)
                return;

            chrome.tabs.onUpdated.removeListener(listener);

            const auth = loginAuth(userInfo);
            console.log(auth);

            chrome.tabs.remove(newTab);
            chrome.tabs.update(lastTab, { active: true });
        });

        chrome.tabs.update(newTab, { active: true });
    });
}

// Events 
chrome.runtime.onMessage.addListener((message, sendResponse) => {
    if (message.action === "makeAPICall")
        handleRun(message.userInfo);
});