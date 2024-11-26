// Variables
const homeUrl = "https://onlinebusiness.icbc.com/webdeas-ui/home";
const loginUrl = "https://onlinebusiness.icbc.com/deas-api/v1/webLogin/webLogin";
const bookingsUrl = "https://onlinebusiness.icbc.com/deas-api/v1/web/getAvailableAppointments";

// Functions
const loginAuth = async ({lastName, licenseNumber, icbcKeyword}) => {
    const payload = {
        drvrLastName: lastName,
        licenceNumber: licenseNumber,
        keyword: icbcKeyword
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

const getAppointments = async ({lastName, licenseNumber, token}) => {
    const location = {
        "aPosID": 9,
        "examType": "7-R-1",
        "examDate": "2024-11-25",
        "ignoreReserveTime": "false",
        "prfDaysOfWeek": "[0,1,2,3,4,5,6]",
        "prfPartsOfDay": "[0,1]",
        "lastName": lastName,
        "licenseNumber": licenseNumber
    };

    const result = await fetch(bookingsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(location)
    });
    
    if (result.status != 200)
        throw new Error(`Request failed with status ${result.status}`);

    return await result.json();
}

const handleRun = async userInfo => {
    chrome.tabs.create({ url: homeUrl, active: false }, async ({id}) => {
        // chrome.tabs.onUpdated.addListener(function listener(updatedId) {
        // if (updatedId != newTab)
        // return;

        // chrome.tabs.onUpdated.removeListener(listener);

        const token = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxOTQ0OTQ5IiwicHJvZmlsZSI6IntcInVzZXJJZFwiOlwiMTk0NDk0OVwiLFwicm9sZXNcIjpbXCJKb2VQdWJsaWNcIl19IiwiZXhwIjoxNzMyNjA1MjQyLCJpYXQiOjE3MzI2MDM0NDJ9.RvXV7MtCz4RfAWyNnTxzaM35UULpTzsRmrnpy-YiuNc";
        const appointments = await getAppointments(userInfo, token);

        chrome.tabs.remove(id);
    });
}

const getToken = async userInfo => {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url: homeUrl, active: false }, async ({ id }) => {
            try {
                const token = await loginAuth(userInfo);
                chrome.tabs.remove(id);

                resolve(token);
            } catch (error) {
                chrome.tabs.remove(id);
                reject(error);
            }
        });
    });
};

// Events 
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getToken")
        (async () => {
            try {
                const token = await getToken(message.userInfo);
                sendResponse({ success: true, token });
            } catch (error) {
                console.log("Failed to get token", error);
                sendResponse({ success: false, error: error.message })
            }
        })();

    return true;
});