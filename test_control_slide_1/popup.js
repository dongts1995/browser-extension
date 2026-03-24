document.getElementById("next").onclick = () => {
    sendCommand("NEXT");
};

document.getElementById("prev").onclick = () => {
    sendCommand("PREV");
};

function sendCommand(command) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, command);
    });
}