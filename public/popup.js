"use strict";
const emailInput = document.getElementById("email");
const codeInput = document.getElementById("code");
const sendCodeBtn = document.getElementById("sendCodeBtn");
const verifyBtn = document.getElementById("verifyBtn");
/**
 * SEND LOGIN CODE
 */
sendCodeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
        alert("Please enter your email");
        return;
    }
    sendCodeBtn.disabled = true;
    try {
        const response = await fetch("https://api.portals.now/auth/send-login-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });
        const text = await response.text();
        if (response.status === 200) {
            alert("Verification code sent to your email!");
            console.log("Send code success:", text);
        }
        else {
            let message = "Failed to send code";
            try {
                const err = JSON.parse(text);
                message = err.message || message;
            }
            catch { }
            alert(message);
        }
    }
    catch (error) {
        console.error(error);
        alert("Network error while sending code");
    }
    sendCodeBtn.disabled = false;
});
/**
 * VERIFY CODE
 */
verifyBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const code = codeInput.value.trim();
    if (!email || !code) {
        alert("Please enter email and verification code");
        return;
    }
    verifyBtn.disabled = true;
    try {
        const response = await fetch("https://api.portals.now/auth/login-with-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                code: code
            })
        });
        const text = await response.text();
        if (response.status === 200) {
            const data = JSON.parse(text);
            // ⚠ chỉnh theo field backend thực tế
            const accessToken = data.accessToken || data.token;
            if (accessToken) {
                await chrome.storage.local.set({
                    accessToken: accessToken,
                    userEmail: email
                });
            }
            alert("Login successful!");
            console.log("Login success:", data);
        }
        else {
            let message = "Verification failed";
            try {
                const err = JSON.parse(text);
                message = err.message || message;
            }
            catch { }
            alert(message);
        }
    }
    catch (error) {
        console.error(error);
        alert("Network error during verification");
    }
    verifyBtn.disabled = false;
});
