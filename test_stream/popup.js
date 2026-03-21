
const startBtn = document.getElementById("startBtn")
const video = document.getElementById("preview")

document.getElementById("startBtn").onclick = () => {

    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], (streamId) => {

        if (streamId) {

            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: streamId
                    }
                }
            }).then(stream => {
                video.srcObject = stream;
            }).catch(error => {
                console.error("Error accessing media:", error);
            });

        } else {
            console.log("User cancelled screen capture");
        }

    });

}