var loginBtn = document.getElementById("loginBtn");
var emailInput = document.getElementById("email");
var passwordInput = document.getElementById("password");
loginBtn.addEventListener("click", function () {
    var email = emailInput.value.trim();
    var password = passwordInput.value.trim();
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }
    console.log("Username:", email);
    console.log("Password:", password);
    alert("Login clicked!\nEmail: " + email);
});
