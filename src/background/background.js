import { ensureToken, getActiveSlidesInfo, parseSlidesUrl, getPresentationInfo, getSlideIndexByObjectId, getSlideThumbnailAsBase64 } from "../api/googleAPI";
// Listen to webNavigation events inside the slides iframe.
// This avoids relying on DOM mutation observers and uses "chrome signals".
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    // Only consider iframe navigations (frameId != 0)
    if (details.frameId === 0)
        return;
    console.log("webNavigation URL:", details.url, "(frameId:", details.frameId, ")");
    const info = parseSlidesUrl(details.url);
    if (info && info.objectId) {
        console.log("Slide changed (webNavigation):", info);
        // 1. Get slide index by objectId
        getSlideIndexByObjectId(info.presentationId, info.objectId).then((index) => {
            console.log("Current slide index:", index);
        });
        // 2. Get slide thumbnail as Base64
        getSlideThumbnailAsBase64(info.presentationId, info.objectId).then((thumbnailBase64) => {
            console.log("Slide thumbnail Base64:", thumbnailBase64);
        });
        // 3. Get next slide
        // 4. Send next slide
        // 5. Send current notes
    }
}, {
    url: [
        {
            hostSuffix: "docs.google.com",
            pathContains: "/presentation/",
        },
    ],
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SLIDESHOW_STATE_CHANGED") {
        if (message.isActive) {
            console.log("Slideshow STARTED (Content Script)");
            // 1. get Google token
            ensureToken().catch(() => {
                // Token retrieval failed; error already logged in getToken
            });
            // 2. Get slide info from URL > get all information of presentation
            getActiveSlidesInfo().then((info) => {
                if (info) {
                    console.log("Slides URL info:", info);
                    getPresentationInfo(info.presentationId).then((presentationInfo) => {
                        if (presentationInfo) {
                            console.log("PresentationInfo:", presentationInfo);
                            // Get slide index by objectId if available
                            if (info.objectId) {
                                getSlideIndexByObjectId(info.presentationId, info.objectId).then((index) => {
                                    console.log("Current slide index:", index);
                                });
                            }
                        }
                    });
                }
                else {
                    console.log("Active tab is not a Google Slides URL.");
                }
            });
            // 3. start stream
        }
        else {
            console.log("Slideshow STOPPED (Content Script)");
            // 1. stop stream
        }
        sendResponse({ status: "ok" });
    }
});
