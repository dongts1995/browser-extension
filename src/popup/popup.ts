import { loginWithCode, sendLoginCode } from "../api/authApi";
import { fetchEvents, MyEvent } from "../api/events";

const loginView1 = document.getElementById("loginView1") as HTMLDivElement;
const loginView2 = document.getElementById("loginView2") as HTMLDivElement;
const loggedInView = document.getElementById("loggedInView") as HTMLDivElement;
//
const connectGoogleBtn = document.getElementById("connectGoogleBtn") as HTMLButtonElement;
const connectMicrosoftBtn = document.getElementById("connectMicrosoftBtn") as HTMLButtonElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const sendCodeBtn = document.getElementById("sendCodeBtn") as HTMLButtonElement;
//
const sentCodeEmailText = document.getElementById("sentCodeEmailText") as HTMLParagraphElement;
const codeInput = document.getElementById("code") as HTMLInputElement;
const verifyCodeBtn = document.getElementById("verifyCodeBtn") as HTMLButtonElement;
const resendCodeBtn = document.getElementById("resendCodeBtn") as HTMLButtonElement;
//
const userEmailText = document.getElementById("userEmailText") as HTMLParagraphElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
const eventSelect = document.getElementById("eventSelect") as HTMLSelectElement;
const eventIdInput = document.getElementById("eventId") as HTMLInputElement;




/* ===============================
   PART 0: CHECK LOGIN STATE WHEN LOAD
================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get(["accessToken", "userEmail"]);

  if (result.accessToken) {
    showLoggedIn(result.userEmail);
  } else {
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
      showLogin1(email);
    } else {
      alert("Failed to send code");
    }

  } catch (error) {
    alert("Network error");
  }
});

/* ===============================
   PART 2: loginView2 Logic
================================= */

function showLogin1(email?: string) {
  loginView1.classList.add("hidden");
  loginView2.classList.remove("hidden");
  loggedInView.classList.add("hidden");

  if (email) {
    sentCodeEmailText.innerText = `We sent a verification code to ${email}`;
  }
}

verifyCodeBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const code = codeInput.value.trim();

  if (!email || !code) {
    alert("Please enter email and verification code");
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
    } else {
      alert("Verification failed");
    }
  } catch (error) {
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
      showLogin1(email);
    } else {
      alert("Failed to send code");
    }

  } catch (error) {
    alert("Network error");
  }
});

/* ===============================
   PART 3: loggedInView Logic
================================= */


function showLoggedIn(email?: string) {
  loginView1.classList.add("hidden");
  loginView2.classList.add("hidden");
  loggedInView.classList.remove("hidden");

  if (email) {
    userEmailText.innerText = `Email: ${email}`;
  }

  loadEvents();
}

async function loadEvents() {
  const storage = await chrome.storage.local.get(["accessToken"]);
  const token = storage.accessToken;

  console.log("TOKEN:", token);

  if (!token) return;

  try {
    const events = await fetchEvents(token);
    populateEvents(events);
  } catch (err) {
    console.error(err);
    eventSelect.innerHTML = `<option>Error loading events</option>`;
  }
}

function populateEvents(events: MyEvent[]) {
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

eventSelect.addEventListener("change", () => {
  const selectedId = eventSelect.value;
  console.log("Selected Event ID:", selectedId);
  eventIdInput.value = selectedId;
});

logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "userEmail"]);
  showLogin0();
});


/* ===============================
   PART 4: TODO
================================= */