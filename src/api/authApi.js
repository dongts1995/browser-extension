export async function sendLoginCode(email) {
    const response = await fetch("https://api.portals.now/auth/send-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    return response.ok;
}
export async function loginWithCode(email, code) {
    const response = await fetch("https://api.portals.now/auth/login-with-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
    });
    if (!response.ok)
        return null;
    const data = await response.json();
    return data.accessToken || data.token || null;
}
