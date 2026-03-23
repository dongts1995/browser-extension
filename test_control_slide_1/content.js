function nextSlide() {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowRight",
            code: "ArrowRight",
            keyCode: 39,
            which: 39,
            bubbles: true
        })
    );
}

function prevSlide() {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowLeft",
            code: "ArrowLeft",
            keyCode: 37,
            which: 37,
            bubbles: true
        })
    );
}

// Nhận message từ background hoặc popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "next") nextSlide();
    if (msg.action === "prev") prevSlide();
});