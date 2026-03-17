let slideshowState = false;

function checkSlideshow() {
  const iframe = document.querySelector("iframe.punch-present-iframe");
  const isActive = !!iframe;

  if (isActive !== slideshowState) {
    slideshowState = isActive;

    if (isActive) {
      console.log("Slideshow STARTED (DOM)");
    } else {
      console.log("Slideshow STOPPED (DOM)");
    }

    chrome.runtime.sendMessage({
      type: "SLIDESHOW_STATE_CHANGED",
      isActive: isActive
    });
  }
}

const observer = new MutationObserver(() => {
  checkSlideshow();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

checkSlideshow();