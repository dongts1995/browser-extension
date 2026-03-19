import { ensureToken, getActiveSlidesInfo, parseSlidesUrl, getPresentationInfo } from "../api/googleAPI";

// Listen to webNavigation events inside the slides iframe.
// This avoids relying on DOM mutation observers and uses "chrome signals".
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    // Only consider iframe navigations (frameId != 0)
    if (details.frameId === 0) return;

    console.log("webNavigation URL:", details.url, "(frameId:", details.frameId, ")");

    const info = parseSlidesUrl(details.url);
    if (info) {
      console.log("Slide changed (webNavigation):", info);
      if (!info.objectId) {
        console.log("  -> parsed objectId is null (raw URL may not contain #slide)");
      }

      getPresentationInfo(info.presentationId).then((presentationInfo) => {
        if (presentationInfo) {
          console.log("PresentationInfo:", presentationInfo);
        }
      });
    }
  },
  {
    url: [
      {
        hostSuffix: "docs.google.com",
        pathContains: "/presentation/",
      },
    ],
  }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SLIDESHOW_STATE_CHANGED") {
    if (message.isActive) {
      console.log("Slideshow STARTED (Content Script)");
      ensureToken().catch(() => {
        // Token retrieval failed; error already logged in getToken
      });

      getActiveSlidesInfo().then((info) => {
        if (info) {
          console.log("Slides URL info:", info);
        } else {
          console.log("Active tab is not a Google Slides URL.");
        }
      });

    } else {
      console.log("Slideshow STOPPED (Content Script)");
    }

    sendResponse({ status: "ok" });
  }
});
