const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  console.log("Username:", email);
  console.log("Password:", password);

  alert("Login clicked!\nEmail: " + email);
});