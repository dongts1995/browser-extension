chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (!changeInfo.url) return;

    const url = changeInfo.url;

    if (url.includes("/present")) {
        console.log("Slideshow STARTED");
    }

    if (url.includes("/edit")) {
        console.log("Slideshow STOPPED");
    }

});