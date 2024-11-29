const getSaved = async search => {
    return await new Promise((resolve) => {
        chrome.storage.local.get([search], data => {
            resolve(data[search]);
        });
    });
}

export default getSaved;