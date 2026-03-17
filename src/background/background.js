"use strict";
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SLIDESHOW_STATE_CHANGED") {
        if (message.isActive) {
            console.log("Slideshow STARTED (Content Script)");
            getToken();
        }
        else {
            console.log("Slideshow STOPPED (Content Script)");
        }
        sendResponse({ status: "ok" });
    }
});
function getToken() {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        console.log("Access Token:", token);
    });
}
