Extension ----> Manifest.json
                    |
                    ------> popup.html
                                |
                                ------> popup.ts


document.addEventListener() ->  showLoggedIn()
                            ->  showLogin()


Send Code
-> 
    const response = await fetch(
      "https://api.portals.now/auth/send-login-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      }
    );


Login
        const response = await fetch(
      "https://api.portals.now/auth/login-with-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      }
    );

    Thành công thì lưu vào
              await chrome.storage.local.set({
                accessToken: accessToken,
                userEmail: email
            });