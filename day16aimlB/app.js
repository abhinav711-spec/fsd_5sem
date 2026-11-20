const USERS_KEY = "react-commerce-users-v1";
const SESSION_KEY = "react-commerce-session-v1";
const STORE_URL = "../day6aimlB/index.html";

const form = document.querySelector("#auth-form");
const nameGroup = document.querySelector("#name-group");
const nameInput = document.querySelector("#auth-name");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const submitButton = document.querySelector("#submit-button");
const modeToggle = document.querySelector("#mode-toggle");
const modeLabel = document.querySelector("#mode-label");
const authTitle = document.querySelector("#auth-title");
const authSubtitle = document.querySelector("#auth-subtitle");
const switchCopy = document.querySelector("#switch-copy");
const message = document.querySelector("#auth-message");
const passwordToggle = document.querySelector("#password-toggle");
const submitLabel = submitButton.querySelector("span:first-child");

let authMode = "login";

const bytesToHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const hexToBytes = (hex) => {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    throw new Error("The saved account data is invalid. Please register again.");
  }
  return Uint8Array.from(hex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
};

const readUsers = () => {
  const savedUsers = localStorage.getItem(USERS_KEY);
  if (savedUsers === null) return [];

  let users;
  try {
    users = JSON.parse(savedUsers);
  } catch {
    throw new Error("Saved account data could not be read. Clear this app's browser storage and try again.");
  }

  if (
    !Array.isArray(users) ||
    users.some(
      (user) =>
        !user ||
        typeof user.email !== "string" ||
        typeof user.name !== "string" ||
        typeof user.salt !== "string" ||
        typeof user.passwordHash !== "string",
    )
  ) {
    throw new Error("Saved account data has an invalid format. Clear this app's browser storage and try again.");
  }

  return users;
};

const derivePasswordHash = async (password, salt) => {
  if (!window.crypto?.subtle) {
    throw new Error("Password protection is unavailable in this browser. Open this page using a local web server or HTTPS.");
  }

  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
};

const showMessage = (text, isSuccess = false) => {
  message.textContent = text;
  message.classList.toggle("is-success", isSuccess);
  message.hidden = false;
};

const setAuthMode = (mode) => {
  authMode = mode;
  const registering = authMode === "register";

  nameGroup.hidden = !registering;
  nameInput.disabled = !registering;
  nameInput.required = registering;
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  modeLabel.textContent = registering ? "GET STARTED" : "WELCOME BACK";
  authTitle.textContent = registering ? "Create your account" : "Sign in to your account";
  authSubtitle.textContent = registering
    ? "Create an account to continue to the store."
    : "Enter your details to continue to the store.";
  submitLabel.textContent = registering ? "Create account" : "Sign in";
  switchCopy.textContent = registering ? "Already have an account?" : "New to React Commerce?";
  modeToggle.textContent = registering ? "Sign in" : "Create an account";
  passwordInput.type = "password";
  passwordToggle.textContent = "Show";
  passwordToggle.setAttribute("aria-label", "Show password");
  message.hidden = true;
  message.textContent = "";
};

modeToggle.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

passwordToggle.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  passwordToggle.textContent = isHidden ? "Hide" : "Show";
  passwordToggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const registering = authMode === "register";

  submitButton.disabled = true;
  submitLabel.textContent = registering ? "Creating account..." : "Signing in...";

  try {
    const users = readUsers();

    if (registering) {
      const name = nameInput.value.trim();
      if (name.length < 2) {
        throw new Error("Please enter a name with at least 2 characters.");
      }
      if (users.some((user) => user.email === email)) {
        throw new Error("An account with this email already exists. Please sign in instead.");
      }

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const user = {
        email,
        name,
        salt: bytesToHex(salt),
        passwordHash: await derivePasswordHash(password, salt),
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(SESSION_KEY, email);
    } else {
      const user = users.find((item) => item.email === email);
      if (!user) {
        throw new Error("No account found for that email. Create an account to get started.");
      }

      const passwordHash = await derivePasswordHash(password, hexToBytes(user.salt));
      if (passwordHash !== user.passwordHash) {
        throw new Error("That password doesn't match this account. Please try again.");
      }
      localStorage.setItem(SESSION_KEY, email);
    }

    window.location.assign(STORE_URL);
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "Something went wrong. Please try again.",
    );
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = authMode === "register" ? "Create account" : "Sign in";
  }
});

setAuthMode("login");
