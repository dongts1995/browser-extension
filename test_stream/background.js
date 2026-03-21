chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.action === "CAPTURE_TAB") {

        chrome.tabCapture.getMediaStreamId({
            targetTabId: msg.tabId
        }, (streamId) => {

            console.log("Stream ID:", streamId)

            sendResponse({ streamId })

        })

        return true
    }

})