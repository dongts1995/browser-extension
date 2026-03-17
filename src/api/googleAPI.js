const TOKEN_REFRESH_MS = 55 * 60 * 1000; // 55 minutes
let accessToken = null;
let accessTokenTimestamp = null;
function isTokenExpired() {
    if (!accessToken || !accessTokenTimestamp)
        return true;
    return Date.now() - accessTokenTimestamp > TOKEN_REFRESH_MS;
}
export function getCachedToken() {
    if (isTokenExpired()) {
        accessToken = null;
        accessTokenTimestamp = null;
    }
    return accessToken;
}
export function getToken(interactive = true) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, function (token) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }
            if (token) {
                accessToken = token;
                accessTokenTimestamp = Date.now();
            }
            else {
                accessToken = null;
                accessTokenTimestamp = null;
            }
            console.log("Access Token:", token);
            resolve(token ?? null);
        });
    });
}
export async function ensureToken() {
    const cached = getCachedToken();
    if (cached)
        return cached;
    // Try to silently get a fresh token first.
    try {
        return await getToken(false);
    }
    catch (err) {
        // Fallback to interactive flow if silent fetch fails.
        return getToken(true);
    }
}
/**
 * Parse a Google Slides URL and return the presentationId + objectId (if present).
 *
 * Examples:
 * - https://docs.google.com/presentation/d/ID/edit#slide=id.p
 * - https://docs.google.com/presentation/d/ID/edit#slide=id.g15f3a0e3c_0_42
 */
export function parseSlidesUrl(url) {
    try {
        const u = new URL(url);
        if (!u.hostname.includes("docs.google.com") || !u.pathname.startsWith("/presentation/")) {
            return null;
        }
        const match = u.pathname.match(/\/d\/([^/]+)/);
        if (!match)
            return null;
        const presentationId = match[1];
        // Slide ID may appear either in the hash (common) or as a `slide=` query parameter (observed in `present` mode).
        const hash = u.hash || "";
        const searchParams = u.searchParams;
        const hashMatch = hash.match(/slide=id\.([A-Za-z0-9_\-\.]+)/);
        const queryParam = searchParams.get("slide");
        const queryMatch = queryParam ? queryParam.match(/id\.([A-Za-z0-9_\-\.]+)/) : null;
        const objectId = hashMatch?.[1] ?? queryMatch?.[1] ?? null;
        return { presentationId, objectId };
    }
    catch {
        return null;
    }
}
/**
 * Returns presentationId/objectId for the currently active tab (if it is a Slides URL).
 */
export async function getActiveSlidesInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const tab = tabs?.[0];
            if (!tab?.url)
                return resolve(null);
            resolve(parseSlidesUrl(tab.url));
        });
    });
}
