const startBtn = document.getElementById("startBtn")
const video = document.getElementById("preview")

document.getElementById("startBtn").onclick = async () => {

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    })

    chrome.runtime.sendMessage({
        action: "CAPTURE_TAB",
        tabId: tab.id
    }, async (response) => {

        const streamId = response.streamId

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: "tab",
                    chromeMediaSourceId: streamId
                }
            }
        })

        video.srcObject = stream

    })

}


