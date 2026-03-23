function sendCommand(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action });
    });
}

// Ví dụ: auto next mỗi 5 giây
let interval = null;

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "startAuto") {
        interval = setInterval(() => sendCommand("next"), 5000);
    }

    if (msg.action === "stopAuto") {
        clearInterval(interval);
    }
});