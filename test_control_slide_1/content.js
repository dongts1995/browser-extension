console.log("Slides Controller loaded");

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "NEXT") {
        nextSlide();
    }

    if (message === "PREV") {
        prevSlide();
    }
});

function nextSlide() {
    document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight" })
    );
}

function prevSlide() {
    document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft" })
    );
}