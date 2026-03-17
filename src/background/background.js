"use strict";
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url)
        return;
    const url = changeInfo.url;
    if (url.includes("/present")) {
        console.log("Slideshow STARTED");
    }
    if (url.includes("/edit")) {
        console.log("Slideshow STOPPED");
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SLIDESHOW_STATE_CHANGED") {
        if (message.isActive) {
            console.log("Slideshow STARTED (Content Script)");
        }
        else {
            console.log("Slideshow STOPPED (Content Script)");
        }
        sendResponse({ status: "ok" });
    }
});
