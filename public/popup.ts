const loginView = document.getElementById("loginView") as HTMLDivElement;
const loggedInView = document.getElementById("loggedInView") as HTMLDivElement;

const userEmailText = document.getElementById("userEmailText") as HTMLParagraphElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;

const emailInput = document.getElementById("email") as HTMLInputElement;
const codeInput = document.getElementById("code") as HTMLInputElement;

const sendCodeBtn = document.getElementById("sendCodeBtn") as HTMLButtonElement;
const verifyBtn = document.getElementById("verifyBtn") as HTMLButtonElement;


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