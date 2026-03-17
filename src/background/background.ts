chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SLIDESHOW_STATE_CHANGED") {
    if (message.isActive) {
      console.log("Slideshow STARTED (Content Script)");
    } else {
      console.log("Slideshow STOPPED (Content Script)");
    }

    sendResponse({ status: "ok" });
  }
});
