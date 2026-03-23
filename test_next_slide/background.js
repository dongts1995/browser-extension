let attachedTabId = null;
let interval = null;

chrome.action.onClicked.addListener(async (tab) => {

    if (interval) {
        clearInterval(interval);
        interval = null;

        if (attachedTabId !== null) {
            chrome.debugger.detach({ tabId: attachedTabId });
            attachedTabId = null;
        }

        console.log("Stopped");
        return;
    }

    attachedTabId = tab.id;

    // attach debugger
    chrome.debugger.attach({ tabId: tab.id }, "1.3", () => {

        console.log("Debugger attached");

        interval = setInterval(() => {

            chrome.debugger.sendCommand(
                { tabId: tab.id },
                "Input.dispatchKeyEvent",
                {
                    type: "keyDown",
                    key: "ArrowRight",
                    code: "ArrowRight",
                    windowsVirtualKeyCode: 39,
                    nativeVirtualKeyCode: 39
                }
            );

            chrome.debugger.sendCommand(
                { tabId: tab.id },
                "Input.dispatchKeyEvent",
                {
                    type: "keyUp",
                    key: "ArrowRight",
                    code: "ArrowRight",
                    windowsVirtualKeyCode: 39,
                    nativeVirtualKeyCode: 39
                }
            );

        }, 1000);

    });

});