document.getElementById("next").onclick = () => {
    chrome.runtime.sendMessage({ action: "next" });
};

document.getElementById("prev").onclick = () => {
    chrome.runtime.sendMessage({ action: "prev" });
};

document.getElementById("auto").onclick = () => {
    chrome.runtime.sendMessage({ action: "startAuto" });
};

document.getElementById("stop").onclick = () => {
    chrome.runtime.sendMessage({ action: "stopAuto" });
};