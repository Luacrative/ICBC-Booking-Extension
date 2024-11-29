// Dependencies
import getSaved from "./savedData.js";

// Variables
const homeUrl = "https://onlinebusiness.icbc.com/webdeas-ui/home";
const loginUrl = "https://onlinebusiness.icbc.com/deas-api/v1/webLogin/webLogin";
const bookingsUrl = "https://onlinebusiness.icbc.com/deas-api/v1/web/getAvailableAppointments";

let lastInterval;
let lastLogin = 0;

const sessionLength = 30 * 60;
const updateInterval = 30 * 1000;

// Functions
const loginAuth = async ({ lastName, licenseNumber, icbcKeyword }) => {
    const payload = {
        drvrLastName: lastName,
        licenceNumber: licenseNumber,
        keyword: icbcKeyword
    };

    try {
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

        if (!result.ok) {
            const error = await result.json().catch(() => ({}));
            return [false, `Error ${result.status}: ${error.message || "Request failed"}`];
        }

        const auth = result.headers.get("Authorization");
        if (!auth)
            return [false, "No authorization header"];

        lastLogin = Date.now();

        return [true, auth];
    } catch (error) {
        return [false, error.message || "Error occured"];
    }
};

const getAppointments = async ({ lastName, licenseNumber, licenseClass, token }, { posId, earliestDate }) => {
    const location = {
        "aPosID": posId,
        "examType": `${licenseClass[6]}-R-1`,
        "examDate": earliestDate.substr(0, 10),
        "ignoreReserveTime": "false",
        "prfDaysOfWeek": "[0,1,2,3,4,5,6]",
        "prfPartsOfDay": "[0,1]",
        "lastName": lastName,
        "licenseNumber": licenseNumber
    };

    try {
        const result = await fetch(bookingsUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(location)
        });

        if (!result.ok) {
            const error = await result.json().catch(() => ({}));
            return [false, `Error ${result.status}: ${error.message || "Request failed"}`];
        }

        const appointments = await result.json();
        return [true, appointments];
    } catch (error) {
        return [false, error.message || "Error occured"];
    }
};

const getToken = async userInfo => {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url: homeUrl, active: false }, async ({ id }) => {
            const [success, token] = await loginAuth(userInfo);
            chrome.tabs.remove(id);

            (success ? resolve : reject)(token);
        });
    });
};

const update = async () => {
    const userInfo = await getSaved("userInfo");
    if (!userInfo)
        return;

    const filters = await getSaved("filters");
    if (!filters)
        return;

    if (((Date.now() - lastLogin) / 1000) >= sessionLength) {
        try {
            await getToken(userInfo);
        } catch (error) {
            console.log("Authorization failed", error);
            return;
        }
    }

    const checkLocation = async posId => {
        const [success, appointments] = await getAppointments(userInfo, { posId, ...filters });
        if (!success)
            return;

        const earliest = appointments[0];
    };

    for (const posId of filters.locations)
        checkLocation(posId);
};

// Events 
const eventHandlers = {
    "getToken": async ({ userInfo }, sendResponse) => {
        try {
            const token = await getToken(userInfo);
            sendResponse({ success: true, token });
        } catch (error) {
            sendResponse({ success: false, error });
        }
    },

    "start": ({ userInfo, filters }) => {
        if (lastInterval) {
            clearInterval(lastInterval);
            lastInterval = undefined;
        }

        update(userInfo, filters);

        lastInterval = setInterval(update, fetchInterval, userInfo, filters);
    },

    "stop": () => {
        if (lastInterval) {
            clearInterval(lastInterval)
            lastInterval = undefined;
        }
    }
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (!(message.action in eventHandlers)) {
        sendResponse({ success: false, error: "No message handler" });
        return;
    }

    try {
        eventHandlers[message.action](message, sendResponse);
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }

    return true;
});

// update();
// setInterval(update, updateInterval);