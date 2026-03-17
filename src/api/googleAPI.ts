const TOKEN_REFRESH_MS = 55 * 60 * 1000; // 55 minutes

let accessToken: string | null = null;
let accessTokenTimestamp: number | null = null;

function isTokenExpired(): boolean {
    if (!accessToken || !accessTokenTimestamp) return true;
    return Date.now() - accessTokenTimestamp > TOKEN_REFRESH_MS;
}

export function getCachedToken(): string | null {
    if (isTokenExpired()) {
        accessToken = null;
        accessTokenTimestamp = null;
    }
    return accessToken;
}

export function getToken(interactive = true): Promise<string | null> {
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
            } else {
                accessToken = null;
                accessTokenTimestamp = null;
            }

            console.log("Access Token:", token);
            resolve(token ?? null);
        });
    });
}

export async function ensureToken(): Promise<string | null> {
    const cached = getCachedToken();
    if (cached) return cached;

    // Try to silently get a fresh token first.
    try {
        return await getToken(false);
    } catch (err) {
        // Fallback to interactive flow if silent fetch fails.
        return getToken(true);
    }
}

export interface SlidesUrlInfo {
    presentationId: string;
    objectId: string | null;
}

/**
 * Parse a Google Slides URL and return the presentationId + objectId (if present).
 *
 * Examples:
 * - https://docs.google.com/presentation/d/ID/edit#slide=id.p
 * - https://docs.google.com/presentation/d/ID/edit#slide=id.g15f3a0e3c_0_42
 */
export function parseSlidesUrl(url: string): SlidesUrlInfo | null {
    try {
        const u = new URL(url);
        if (!u.hostname.includes("docs.google.com") || !u.pathname.startsWith("/presentation/")) {
            return null;
        }

        const match = u.pathname.match(/\/d\/([^/]+)/);
        if (!match) return null;

        const presentationId = match[1];
        // Slide ID may appear either in the hash (common) or as a `slide=` query parameter (observed in `present` mode).
        const hash = u.hash || "";
        const searchParams = u.searchParams;

        const hashMatch = hash.match(/slide=id\.([A-Za-z0-9_\-\.]+)/);
        const queryParam = searchParams.get("slide");
        const queryMatch = queryParam ? queryParam.match(/id\.([A-Za-z0-9_\-\.]+)/) : null;

        const objectId = hashMatch?.[1] ?? queryMatch?.[1] ?? null;

        return { presentationId, objectId };
    } catch {
        return null;
    }
}

/**
 * Returns presentationId/objectId for the currently active tab (if it is a Slides URL).
 */
export async function getActiveSlidesInfo(): Promise<SlidesUrlInfo | null> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const tab = tabs?.[0];
            if (!tab?.url) return resolve(null);
            resolve(parseSlidesUrl(tab.url));
        });
    });
}

export interface PresentationSlideInfo {
    index: number; // zero-based
    objectId: string;
    notes: string | null;
}

export interface PresentationInfo {
    presentationId: string;
    title?: string;
    slides: PresentationSlideInfo[];
}

const presentationCache: Record<string, PresentationInfo> = {};

function extractNotesFromSlide(slide: any): string | null {
    const notesPage = slide?.slideProperties?.notesPage ?? slide?.notesPage;
    if (!notesPage) return null;

    const elements = notesPage.pageElements;
    if (!Array.isArray(elements)) return null;

    let notes = "";
    elements.forEach((el: any) => {
        if (!el.shape?.text?.textElements) return;
        el.shape.text.textElements.forEach((t: any) => {
            if (t.textRun?.content) {
                notes += t.textRun.content;
            }
        });
    });

    return notes.trim();
}

/**
 * Fetches + caches presentation info (slides list with notes).
 * Cached result is reused unless you call `invalidatePresentationCache`.
 */
export async function getPresentationInfo(presentationId: string): Promise<PresentationInfo | null> {
    if (presentationCache[presentationId]) return presentationCache[presentationId];

    const token = await ensureToken();
    if (!token) return null;

    const res = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        console.error("Failed to fetch presentation:", res.status, res.statusText);
        return null;
    }

    const data = await res.json();
    const slidesData = Array.isArray(data.slides) ? data.slides : [];

    const slides: PresentationSlideInfo[] = slidesData.map((slide: any, index: number) => ({
        index,
        objectId: slide?.objectId,
        notes: extractNotesFromSlide(slide),
    }));


    const info: PresentationInfo = {
        presentationId,
        title: data?.title,
        slides,
    };

    presentationCache[presentationId] = info;
    return info;
}

export function invalidatePresentationCache(presentationId: string) {
    delete presentationCache[presentationId];
}



