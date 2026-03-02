console.log("Content script loaded on Google Slides");

chrome.runtime.onMessage.addListener((message) => {
  console.log("Content received:", message);
});