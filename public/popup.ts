const loginView = document.getElementById("loginView") as HTMLDivElement;
const loggedInView = document.getElementById("loggedInView") as HTMLDivElement;

const userEmailText = document.getElementById("userEmailText") as HTMLParagraphElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;

const emailInput = document.getElementById("email") as HTMLInputElement;
const codeInput = document.getElementById("code") as HTMLInputElement;

const sendCodeBtn = document.getElementById("sendCodeBtn") as HTMLButtonElement;
const verifyBtn = document.getElementById("verifyBtn") as HTMLButtonElement;

const eventSelect = document.getElementById("eventSelect") as HTMLSelectElement;
const eventIdInput = document.getElementById("eventId") as HTMLInputElement;


type MyEvent = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
};


/* ===============================
   CHECK LOGIN STATE WHEN LOAD
================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get(["accessToken", "userEmail"]);

  if (result.accessToken) {
    showLoggedIn(result.userEmail);
  } else {
    showLogin();
  }
});


function showLogin() {
  loginView.classList.remove("hidden");
  loggedInView.classList.add("hidden");
}


function showLoggedIn(email?: string) {
  loginView.classList.add("hidden");
  loggedInView.classList.remove("hidden");

  if (email) {
    userEmailText.innerText = `Email: ${email}`;
  }

  loadEvents();
}

async function loadEvents() {
  const storage = await chrome.storage.local.get(["accessToken"]);
  const token = storage.accessToken;

  console.log("TOKEN:", storage.accessToken);

  if (!token) return;



  try {
    const startDate = new Date().toISOString();

    console.log(`https://api.portals.now/events/date-range?startDate=${startDate}&page=1&limit=9999`);
    const response = await fetch(
      `https://api.portals.now/events/date-range?startDate=${startDate}&page=1&limit=9999`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const data = await response.json();

    const events: MyEvent[] = data.content;

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


/* ===============================
   LOGOUT
================================= */

logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "userEmail"]);
  showLogin();
});


/* ===============================
   SEND CODE
================================= */

sendCodeBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  try {
    const response = await fetch(
      "https://api.portals.now/auth/send-login-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      }
    );

    if (response.status === 200) {
      alert("Verification code sent!");
    } else {
      alert("Failed to send code");
    }

  } catch (error) {
    alert("Network error");
  }
});


/* ===============================
   VERIFY
================================= */

verifyBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const code = codeInput.value.trim();

  if (!email || !code) {
    alert("Please enter email and verification code");
    return;
  }

  try {
    const response = await fetch(
      "https://api.portals.now/auth/login-with-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      }
    );

    if (response.status === 200) {
      const data = await response.json();

      const accessToken = data.accessToken || data.token;

      await chrome.storage.local.set({
        accessToken: accessToken,
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

/* ===============================
   event ID change
================================= */

eventSelect.addEventListener("change", () => {
  const selectedId = eventSelect.value;
  console.log("Selected Event ID:", selectedId);
  eventIdInput.value = selectedId;
});