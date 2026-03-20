import { ensureToken, getActiveSlidesInfo, parseSlidesUrl, getPresentationInfo, getSlideIndexByObjectId, getSlideThumbnailAsURL } from "../api/googleAPI";
import { SocketService } from "../api/socket";

const socketService = new SocketService();
let currentEventId: string | null = null;

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

      // 1. Get all presentation info (including notes)
      const presentationInfo = await getPresentationInfo(info.presentationId);
      if (!presentationInfo) {
        console.warn("Failed to get presentation info for", info.presentationId);
        return;
      }

      const currentSlide = presentationInfo.slides.find((s) => s.objectId === info.objectId);
      if (!currentSlide) {
        console.warn("Current slide objectId not found in presentation", info.objectId);
        return;
      }

      const currentNotes = currentSlide.notes || "";
      const nextSlide = presentationInfo.slides[currentSlide.index + 1] || null;
      const nextNotes = nextSlide?.notes || "";
      const thumbnailObjectId = nextSlide?.objectId || info.objectId;

      const thumbnailURL = (await getSlideThumbnailAsURL(info.presentationId, thumbnailObjectId)) || "";

      console.log("Current notes:", currentNotes);
      console.log("Next notes:", nextNotes);
      console.log("Thumbnail URL:", thumbnailURL);

      await socketService.emitSlideMovedNext(currentNotes, nextNotes, thumbnailURL);
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
  if (message.type === "EVENT_SELECTED") {
    const newEventId = message.eventId ? String(message.eventId) : null;
    console.log("EVENT_SELECTED received, eventId:", newEventId);

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
    if (message.isActive) {
      console.log("Slideshow STARTED (Content Script)");
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
      // 1. stop stream
    }

    sendResponse({ status: "ok" });
  }

  return true;
});
