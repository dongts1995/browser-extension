import { loginWithCode, sendLoginCode } from "../api/authApi";
import { fetchEvents } from "../api/events";
const loginView1 = document.getElementById("loginView1");
const loginView2 = document.getElementById("loginView2");
const loggedInView = document.getElementById("loggedInView");
//
// const connectGoogleBtn = document.getElementById("connectGoogleBtn") as HTMLButtonElement;
// const connectMicrosoftBtn = document.getElementById("connectMicrosoftBtn") as HTMLButtonElement;
const emailInput = document.getElementById("email");
const sendCodeBtn = document.getElementById("sendCodeBtn");
//
const sentCodeEmailText = document.getElementById("sentCodeEmailText");
const codeInput = document.getElementById("code");
const verifyCodeBtn = document.getElementById("verifyCodeBtn");
const resendCodeBtn = document.getElementById("resendCodeBtn");
//
const userEmailText = document.getElementById("userEmailText");
const logoutBtn = document.getElementById("logoutBtn");
const eventSelect = document.getElementById("eventSelect");
const eventIdInput = document.getElementById("eventIdInput");
async function updateUIState(newState) {
    try {
        await chrome.storage.local.set({ uiState: newState });
        console.log("[Popup] UI State saved to storage:", newState);
    }
    catch (err) {
        console.warn("[Popup] failed to update UI state", err);
    }
}
/* ===============================
   PART 0: CHECK LOGIN STATE WHEN LOAD
================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // Get UI state from local storage
    const storage = await chrome.storage.local.get(["uiState"]);
    const uiState = storage.uiState || "UI_SIGNIN";
    console.log("[Popup] UI State:", uiState);
    switch (uiState) {
        case "UI_SIGNIN":
            showLogin0();
            break;
        case "UI_VERIFYCODE": {
            const storageData = await chrome.storage.local.get(["userEmail"]);
            if (!storageData.userEmail) {
                console.warn("[Popup] userEmail not found in storage, showing login0");
                showLogin0();
                await updateUIState("UI_SIGNIN");
            }
            else {
                showLogin1(storageData.userEmail);
            }
            break;
        }
        case "UI_MAIN": {
            const storageData = await chrome.storage.local.get(["userEmail", "accessToken"]);
            if (!storageData.accessToken) {
                console.warn("[Popup] accessToken not found, showing login0");
                showLogin0();
                await updateUIState("UI_SIGNIN");
            }
            else {
                showLoggedIn(storageData.userEmail);
            }
            break;
        }
        default:
            console.warn("[Popup] Unknown UI state:", uiState);
            showLogin0();
    }
});
/* ===============================
   PART 1: loginView1 Logic
================================= */
function showLogin0() {
    loginView1.classList.remove("hidden");
    loginView2.classList.add("hidden");
    loggedInView.classList.add("hidden");
    chrome.runtime.sendMessage({ type: "LOGGED_OUT" });
}
sendCodeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
        alert("Please enter your email");
        return;
    }
    try {
        const ok = await sendLoginCode(email);
        if (ok) {
            alert("Verification code sent!");
            await chrome.storage.local.set({ userEmail: email });
            showLogin1(email);
            await updateUIState("UI_VERIFYCODE");
        }
        else {
            alert("Failed to send code");
        }
    }
    catch (error) {
        alert("Network error");
    }
});
/* ===============================
   PART 2: loginView2 Logic
================================= */
function showLogin1(email) {
    loginView1.classList.add("hidden");
    loginView2.classList.remove("hidden");
    loggedInView.classList.add("hidden");
    if (email) {
        sentCodeEmailText.innerText = `We sent a verification code to ${email}`;
    }
}
verifyCodeBtn.addEventListener("click", async () => {
    const storage = await chrome.storage.local.get(["userEmail"]);
    const email = storage?.userEmail;
    const code = codeInput.value.trim();
    if (!email) {
        alert("Email not found. Please try sending code again.");
        showLogin0();
        return;
    }
    if (!code) {
        alert("Please enter verification code");
        return;
    }
    try {
        const accessToken = await loginWithCode(email, code);
        if (accessToken) {
            await chrome.storage.local.set({
                accessToken,
                userEmail: email
            });
            showLoggedIn(email);
            await updateUIState("UI_MAIN");
        }
        else {
            alert("Verification failed");
        }
    }
    catch (error) {
        alert("Network error");
    }
});
resendCodeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
        alert("Please enter your email");
        return;
    }
    try {
        const ok = await sendLoginCode(email);
        if (ok) {
            alert("Verification code sent!");
            await chrome.storage.local.set({ userEmail: email });
            showLogin1(email);
            await updateUIState("UI_VERIFYCODE");
        }
        else {
            alert("Failed to send code");
        }
    }
    catch (error) {
        alert("Network error");
    }
});
/* ===============================
   PART 3: loggedInView Logic
================================= */
function showLoggedIn(email) {
    loginView1.classList.add("hidden");
    loginView2.classList.add("hidden");
    loggedInView.classList.remove("hidden");
    if (email) {
        userEmailText.innerText = `Email: ${email}`;
    }
    loadEvents();
    // Notify background script that user is logged in
    chrome.runtime.sendMessage({ type: "LOGGED_IN", email });
}
async function loadEvents(retryCount = 0, maxRetries = 3) {
    try {
        const storage = await chrome.storage.local.get(["accessToken", "eventId"]);
        const token = storage?.accessToken;
        const storedEventId = storage?.eventId;
        // console.log("TOKEN:", token);
        if (!token) {
            console.warn("[Popup] No accessToken found in storage");
            eventSelect.innerHTML = `<option>Please login first</option>`;
            return;
        }
        try {
            const events = await fetchEvents(token);
            populateEvents(events);
            // Restore previously selected event
            if (storedEventId) {
                eventSelect.value = storedEventId;
                eventIdInput.value = storedEventId;
                chrome.runtime.sendMessage({ type: "EVENT_SELECTED", eventId: storedEventId });
            }
        }
        catch (err) {
            console.error("[Popup] Error fetching events (attempt", retryCount + 1, "of", maxRetries + 1, "):", err);
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000; // exponential backoff: 1s, 2s, 4s
                console.log(`[Popup] Retrying in ${delay}ms...`);
                eventSelect.innerHTML = `<option>Loading events... (retry ${retryCount + 1}/${maxRetries})</option>`;
                setTimeout(() => {
                    loadEvents(retryCount + 1, maxRetries);
                }, delay);
            }
            else {
                console.error("[Popup] Max retries reached, giving up");
                await chrome.storage.local.remove(["accessToken", "eventId"]);
                showLogin0();
                await updateUIState("UI_SIGNIN");
            }
        }
    }
    catch (err) {
        console.error("[Popup] Error accessing storage:", err);
        eventSelect.innerHTML = `<option>Storage error</option>`;
    }
}
function populateEvents(events) {
    eventSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.textContent = "Select event";
    placeholder.value = "";
    eventSelect.appendChild(placeholder);
    events.forEach((event) => {
        const option = document.createElement("option");
        option.value = event.id;
        console.log("Get ID:", event.id);
        //eventIdInput.value = event.id;
        option.textContent = event.name;
        eventSelect.appendChild(option);
    });
}
eventSelect.addEventListener("change", async () => {
    const selectedId = eventSelect.value;
    console.log("Selected Event ID:", selectedId);
    eventIdInput.value = selectedId;
    await chrome.storage.local.set({ eventId: selectedId });
    // Send message to background script with the selected eventId
    chrome.runtime.sendMessage({ type: "EVENT_SELECTED", eventId: selectedId });
});
logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove(["accessToken", "userEmail"]);
    showLogin0();
    await updateUIState("UI_SIGNIN");
});
/* ===============================
   PART 4: TODO
================================= */ 
