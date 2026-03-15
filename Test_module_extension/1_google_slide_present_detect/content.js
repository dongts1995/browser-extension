function checkSlideshow() {

    const iframe = document.querySelector("iframe.punch-present-iframe");

    if (iframe) {
        console.log("Slideshow STARTED (DOM)");
    } else {
        console.log("Slideshow STOPPED (DOM)");
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