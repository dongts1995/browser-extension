import { ensureToken, getActiveSlidesInfo, parseSlidesUrl, getPresentationInfo, getSlideIndexByObjectId, getSlideThumbnailAsURL } from "../api/googleAPI";
import { SocketService } from "../api/socket";


const socketService = new SocketService();
let currentEventId: string | null = null;
let isLoggedIn: boolean = false;
// let isEventSelected: boolean = false;
let isSlideshowActive: boolean = false;
let currentAbortController: AbortController | null = null;

async function getWebAccessToken(): Promise<string | null> {
  const storage = await chrome.storage.local.get(["accessToken"]);
  return storage?.accessToken || null;
}

// Listen to webNavigation events inside the slides iframe.
// This avoids relying on DOM mutation observers and uses "chrome signals".
chrome.webNavigation.onHistoryStateUpdated.addListener(
  async (details) => {
    // Only consider iframe navigations (frameId != 0)
    if (details.frameId === 0) return;

    console.log("webNavigation URL:", details.url, "(frameId:", details.frameId, ")");

    const info = parseSlidesUrl(details.url);
    if (info && info.objectId) {
      console.log("Slide changed (webNavigation):", info);

      if (socketService.isConnected === false) {
        console.warn("Socket not connected, skipping slide change processing");
        return;
      }

      // Cancel any ongoing processing
      if (currentAbortController) {
        currentAbortController.abort();
        console.log("Cancelled previous slide processing");
      }

      // Create new AbortController for this processing
      currentAbortController = new AbortController();
      const signal = currentAbortController.signal;

      try {
        // 1. Get all presentation info (including notes)
        const presentationInfo = await getPresentationInfo(info.presentationId);
        if (!presentationInfo) {
          console.warn("Failed to get presentation info for", info.presentationId);
          return;
        }

        if (signal.aborted) return;

        const currentSlide = presentationInfo.slides.find((s) => s.objectId === info.objectId);
        if (!currentSlide) {
          console.warn("Current slide objectId not found in presentation", info.objectId);
          return;
        }

        if (signal.aborted) return;

        const currentNotes = currentSlide.notes || "";
        const nextSlide = presentationInfo.slides[currentSlide.index + 1] || null;
        const nextNotes = nextSlide?.notes || "";
        const thumbnailObjectId = nextSlide?.objectId || info.objectId;

        const thumbnailURL = (await getSlideThumbnailAsURL(info.presentationId, thumbnailObjectId)) || "";

        if (signal.aborted) return;

        console.log("Current notes:", currentNotes);
        console.log("Next notes:", nextNotes);
        console.log("Thumbnail URL:", thumbnailURL);

        await socketService.emitSlideMovedNext(currentNotes, nextNotes, thumbnailURL);

        // Clear the controller after successful completion
        currentAbortController = null;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("Slide processing was cancelled");
        } else {
          console.error("Error processing slide change:", error);
        }
      }
    }
  },
  {
    url: [
      {
        hostSuffix: "docs.google.com",
        pathContains: "/presentation/",
      },
    ],
  }
);

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "LOGGED_IN") {
    console.log("LOGGED_IN received, email:", message.email);
    sendResponse({ status: "ok" });
    isLoggedIn = true;

    // Check if there's an active slideshow and process it
    (async () => {
      try {
        const activeInfo = await getActiveSlidesInfo();
        if (activeInfo) {
          isSlideshowActive = true;
          console.log("Slideshow detected on LOGGED_IN, processing...");
          // Same logic as SLIDESHOW_STATE_CHANGED with isActive = true
          ensureToken().catch(() => {
            console.error("Failed to ensure token on LOGGED_IN");
          });

          const presentationInfo = await getPresentationInfo(activeInfo.presentationId);
          if (presentationInfo) {
            console.log("PresentationInfo loaded on LOGGED_IN:", presentationInfo);

            if (activeInfo.objectId) {
              getSlideIndexByObjectId(activeInfo.presentationId, activeInfo.objectId).then((index) => {
                console.log("Current slide index on LOGGED_IN:", index);
              });
            }
          }
        } else {
          console.log("No active slideshow detected on LOGGED_IN");
        }
      } catch (err) {
        console.error("Error checking slideshow on LOGGED_IN:", err);
      }
    })();

    return true;
  }

  if (message.type === "LOGGED_OUT") {
    console.log("LOGGED_OUT received");
    sendResponse({ status: "ok" });
    isLoggedIn = false;
    return true;
  }

  if (message.type === "EVENT_SELECTED") {
    const newEventId = message.eventId ? String(message.eventId) : null;
    console.log("EVENT_SELECTED received, eventId:", newEventId);
    // isEventSelected = true;

    if (!newEventId) {
      console.warn("EVENT_SELECTED missing eventId");
      sendResponse({ status: "error", reason: "missing eventId" });
      return true;
    }

    if (currentEventId === newEventId) {
      console.log("EVENT_SELECTED unchanged");

      if (!socketService.isConnected) {
        console.log("Socket not connected yet, reconnecting socket to", currentEventId);

        const token = await getWebAccessToken();
        if (!token) {
          console.error("EVENT_SELECTED: no access token available");
          sendResponse({ status: "error", reason: "no access token" });
          return true;
        }

        socketService.connect(token, currentEventId);
      } else {
        console.log("Socket already connected for eventId", currentEventId);
      }

      sendResponse({ status: "ok", eventId: currentEventId });
      return true;
    }

    // new event selected -> reconnect to new eventId
    if (socketService.isConnected) {
      socketService.disconnect();
    }

    currentEventId = newEventId;
    console.log("eventId changed, reconnecting socket to", currentEventId);

    const token = await getWebAccessToken();
    if (!token) {
      console.error("EVENT_SELECTED: no access token available");
      sendResponse({ status: "error", reason: "no access token" });
      return true;
    }

    socketService.connect(token, currentEventId);

    sendResponse({ status: "ok", eventId: currentEventId });
    return true;
  }

  if (message.type === "SLIDESHOW_STATE_CHANGED") {
    if (isLoggedIn === false) {
      sendResponse({ status: "error", reason: "not logged in" });
      return true;
    }

    if (message.isActive) {
      console.log("Slideshow STARTED (Content Script)");
      isSlideshowActive = true;
      // 1. get Google token
      ensureToken().catch(() => {
        // Token retrieval failed; error already logged in getToken
      });

      // 2. Get slide info from URL > get all information of presentation
      getActiveSlidesInfo().then((info) => {
        if (info) {
          console.log("Slides URL info:", info);

          getPresentationInfo(info.presentationId).then((presentationInfo) => {
            if (presentationInfo) {
              console.log("PresentationInfo:", presentationInfo);

              // Get slide index by objectId if available
              if (info.objectId) {
                getSlideIndexByObjectId(info.presentationId, info.objectId).then((index) => {
                  console.log("Current slide index:", index);
                });
              }
            }
          });

        } else {
          console.log("Active tab is not a Google Slides URL.");
        }
      });

      // 3. start stream

    } else {
      console.log("Slideshow STOPPED (Content Script)");
      isSlideshowActive = false;
      // 1. stop stream
    }

    sendResponse({ status: "ok" });
  }

  return true;
});
