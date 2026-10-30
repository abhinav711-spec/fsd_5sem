const app = document.querySelector("#app");
const questions = window.quizQuestions;
const accountArea = document.querySelector("#account-area");
const USERS_KEY = "react-ready-users-v1";
const HISTORY_KEY = "react-ready-history-v1";
const SESSION_KEY = "react-ready-session-v1";

const state = {
  screen: "auth",
  authMode: "login",
  authMessage: "",
  currentUser: null,
  users: [],
  history: [],
  category: "All topics",
  difficulty: "All levels",
  questionCount: "10",
  quiz: [],
  answers: [],
  currentQuestion: 0,
  historyRecord: null,
};

const readStoredArray = (key) => {
  const rawValue = localStorage.getItem(key);
  if (rawValue === null) return [];

  let value;
  try {
    value = JSON.parse(rawValue);
  } catch {
    throw new Error(`Saved browser data for "${key}" is invalid. Clear this app's local storage to continue.`);
  }

  if (!Array.isArray(value)) {
    throw new Error(`Saved browser data for "${key}" has an invalid format.`);
  }

  return value;
};

const saveStoredArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const bytesToHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const derivePasswordHash = async (password, salt) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
};

const showAuthError = (message) => {
  const error = app.querySelector(".auth-error");
  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
};

const renderAccountArea = () => {
  if (!state.currentUser) {
    accountArea.innerHTML =
      '<span class="topbar-note"><span class="status-dot"></span> Your daily knowledge check</span>';
    return;
  }

  accountArea.innerHTML = `
    <span class="account-greeting">Hi, ${escapeHtml(state.currentUser.name)}</span>
    ${state.screen !== "quiz" ? '<button class="sign-out-button" type="button">Sign out</button>' : ""}
  `;
  accountArea.querySelector(".sign-out-button")?.addEventListener("click", signOut);
};

const renderAuth = () => {
  state.screen = "auth";
  renderAccountArea();
  const isRegistering = state.authMode === "register";

  app.innerHTML = `
    <section class="auth-layout">
      <div class="auth-intro">
        <span class="eyebrow"><span class="sparkle" aria-hidden="true">✦</span> YOUR PERSONAL PRACTICE SPACE</span>
        <h1>A little practice.<br /><span class="accent-text">A lot of progress.</span></h1>
        <p class="intro-copy">Sign in to keep your quiz history in this browser and pick up where your learning left off.</p>
        <div class="auth-benefits">
          <div><span class="benefit-icon">✓</span><span>See your scores and past answers</span></div>
          <div><span class="benefit-icon">↗</span><span>Track your progress over time</span></div>
          <div><span class="benefit-icon">✦</span><span>Practice across all React topics</span></div>
        </div>
      </div>
      <section class="auth-card" aria-labelledby="auth-title">
        <div class="auth-logo" aria-hidden="true">&lt;/&gt;</div>
        <span class="step-label">${isRegistering ? "GET STARTED" : "WELCOME BACK"}</span>
        <h2 id="auth-title">${isRegistering ? "Create your account" : "Sign in to React Ready"}</h2>
        <p class="auth-subtitle">${isRegistering ? "It only takes a moment to get started." : "Your next practice session is waiting."}</p>
        <p class="auth-error" role="alert" hidden></p>
        <form id="auth-form">
          ${isRegistering ? `
            <label class="field-label" for="auth-name">Your name</label>
            <input class="auth-input" id="auth-name" name="name" type="text" autocomplete="name" maxlength="60" required />
          ` : ""}
          <label class="field-label" for="auth-email">Email address</label>
          <input class="auth-input" id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required />
          <label class="field-label" for="auth-password">Password</label>
          <input class="auth-input" id="auth-password" name="password" type="password" autocomplete="${isRegistering ? "new-password" : "current-password"}" minlength="8" required />
          ${isRegistering ? '<p class="password-hint">Use at least 8 characters. Your password is stored only as a salted hash in this browser.</p>' : ""}
          <button class="primary-button auth-submit" type="submit">${isRegistering ? "Create account" : "Sign in"} <span aria-hidden="true">→</span></button>
        </form>
        <p class="auth-switch">${isRegistering ? "Already have an account?" : "New around here?"}
          <button class="text-button auth-mode-toggle" type="button">${isRegistering ? "Sign in" : "Create an account"}</button>
        </p>
        <p class="local-notice"><strong>Local demo:</strong> accounts and history stay in this browser only. This is not Google sign-in or production authentication.</p>
      </section>
    </section>
  `;

  if (state.authMessage) {
    showAuthError(state.authMessage);
    state.authMessage = "";
  }

  app.querySelector(".auth-mode-toggle").addEventListener("click", () => {
    state.authMode = isRegistering ? "login" : "register";
    state.authMessage = "";
    renderAuth();
  });

  app.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    const submitButton = app.querySelector(".auth-submit");
    let newlyCreatedEmail = null;
    submitButton.disabled = true;
    submitButton.textContent = isRegistering ? "Creating account..." : "Signing in...";

    try {
      if (isRegistering) {
        const name = String(form.get("name")).trim();
        if (name.length < 2) throw new Error("Please enter a name with at least 2 characters.");
        if (state.users.some((user) => user.email === email)) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const passwordHash = await derivePasswordHash(password, salt);
        const user = {
          email,
          name,
          salt: bytesToHex(salt),
          passwordHash,
          createdAt: new Date().toISOString(),
        };
        state.users.push(user);
        newlyCreatedEmail = email;
        saveStoredArray(USERS_KEY, state.users);
        newlyCreatedEmail = null;
        state.authMode = "login";
        state.authMessage = "Account created. Sign in with your email and password.";
        renderAuth();
        return;
      }

      const user = state.users.find((item) => item.email === email);
      if (!user) throw new Error("No account found for that email. Create an account to get started.");

      const salt = Uint8Array.from(
        user.salt.match(/.{1,2}/g) || [],
        (byte) => Number.parseInt(byte, 16),
      );
      if (bytesToHex(salt) !== user.salt) {
        throw new Error("The saved account data is invalid. Please clear this app's local storage and register again.");
      }

      const passwordHash = await derivePasswordHash(password, salt);
      if (passwordHash !== user.passwordHash) {
        throw new Error("That password doesn't match this account. Please try again.");
      }

      localStorage.setItem(SESSION_KEY, email);
      state.currentUser = { email: user.email, name: user.name };
      renderDashboard();
    } catch (error) {
      if (newlyCreatedEmail) {
        state.users = state.users.filter((user) => user.email !== newlyCreatedEmail);
      }
      showAuthError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      submitButton.disabled = false;
      submitButton.textContent = isRegistering ? "Create account →" : "Sign in →";
    }
  });
};

const signOut = () => {
  localStorage.removeItem(SESSION_KEY);
  state.currentUser = null;
  state.screen = "auth";
  state.authMode = "login";
  state.authMessage = "";
  renderAuth();
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const getFilteredQuestions = () =>
  questions.filter(
    (question) =>
      (state.category === "All topics" || question.category === state.category) &&
      (state.difficulty === "All levels" ||
        question.difficulty === state.difficulty),
  );

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
};

const getUserHistory = () =>
  state.history
    .filter((record) => record.userEmail === state.currentUser.email)
    .sort((first, second) => new Date(second.completedAt) - new Date(first.completedAt));

const renderDashboard = () => {
  state.screen = "dashboard";
  renderAccountArea();
  const history = getUserHistory();
  const average = history.length
    ? Math.round(history.reduce((total, record) => total + record.percentage, 0) / history.length)
    : 0;
  const best = history.length
    ? Math.max(...history.map((record) => record.percentage))
    : 0;

  app.innerHTML = `
    <section class="dashboard-layout">
      <div class="dashboard-heading">
        <div>
          <span class="eyebrow"><span class="sparkle" aria-hidden="true">✦</span> YOUR LEARNING SPACE</span>
          <h1>Welcome back, <span class="accent-text">${escapeHtml(state.currentUser.name)}</span>.</h1>
          <p>Every round makes the concepts a little more familiar.</p>
        </div>
        <button class="primary-button dashboard-start" type="button">Start a quiz <span aria-hidden="true">→</span></button>
      </div>

      <div class="dashboard-stats" aria-label="Your quiz statistics">
        <article class="dashboard-stat"><span class="stat-icon">◎</span><div><strong>${history.length}</strong><span>quizzes completed</span></div></article>
        <article class="dashboard-stat"><span class="stat-icon">↗</span><div><strong>${history.length ? `${average}%` : "—"}</strong><span>average score</span></div></article>
        <article class="dashboard-stat"><span class="stat-icon">✦</span><div><strong>${history.length ? `${best}%` : "—"}</strong><span>personal best</span></div></article>
      </div>

      <section class="history-section" aria-labelledby="history-title">
        <div class="history-heading">
          <div><span class="step-label">YOUR JOURNEY</span><h2 id="history-title">Quiz history</h2></div>
          <span class="review-count">${history.length} ${history.length === 1 ? "attempt" : "attempts"}</span>
        </div>
        ${history.length === 0 ? `
          <div class="history-empty">
            <span class="empty-illustration" aria-hidden="true">✦</span>
            <h3>Your first quiz is waiting</h3>
            <p>Finish a quiz and your score, topic, and answers will show up here.</p>
            <button class="primary-button empty-start" type="button">Take your first quiz <span aria-hidden="true">→</span></button>
          </div>
        ` : `
          <div class="history-list">
            ${history.map((record) => `
              <article class="history-item">
                <div class="history-score ${record.percentage >= 70 ? "score-good" : ""}">${record.percentage}%</div>
                <div class="history-info">
                  <h3>${escapeHtml(record.category)}</h3>
                  <p>${record.correctCount} of ${record.questionCount} correct <span aria-hidden="true">·</span> ${escapeHtml(record.difficulty)}</p>
                </div>
                <time class="history-date" datetime="${escapeHtml(record.completedAt)}">${escapeHtml(new Date(record.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }))}</time>
                <button class="text-button history-review-button" type="button" data-record-id="${escapeHtml(record.id)}">Review <span aria-hidden="true">→</span></button>
              </article>
            `).join("")}
          </div>
        `}
        <p class="local-notice history-notice"><strong>Saved on this device:</strong> your account and quiz history are stored in this browser, not synced to other devices.</p>
      </section>
    </section>
  `;

  app.querySelector(".dashboard-start")?.addEventListener("click", openQuizSetup);
  app.querySelector(".empty-start")?.addEventListener("click", openQuizSetup);
  app.querySelectorAll("[data-record-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.historyRecord = history.find((record) => record.id === button.dataset.recordId);
      if (state.historyRecord) renderSavedReview();
    });
  });
};

const openQuizSetup = () => {
  state.screen = "setup";
  renderSetup();
};

const renderSavedReview = () => {
  const record = state.historyRecord;
  if (!record) {
    renderDashboard();
    return;
  }

  state.screen = "history-review";
  renderAccountArea();
  app.innerHTML = `
    <section class="results-layout">
      <button class="back-link saved-review-back" type="button"><span aria-hidden="true">←</span> Back to dashboard</button>
      <div class="results-heading">
        <span class="eyebrow"><span class="sparkle" aria-hidden="true">✦</span> PAST QUIZ REVIEW</span>
        <h1>${escapeHtml(record.category)}</h1>
        <p>${escapeHtml(new Date(record.completedAt).toLocaleString())} <span aria-hidden="true">·</span> ${record.correctCount} of ${record.questionCount} correct</p>
      </div>
      <section class="score-card" aria-label="Saved quiz score">
        <div class="score-ring" style="--score: ${record.percentage}%">
          <div class="score-inner"><strong>${record.percentage}<span>%</span></strong><span>YOUR SCORE</span></div>
        </div>
        <div class="score-details">
          <span class="step-label">THE BREAKDOWN</span>
          <h2>You got <span>${record.correctCount} out of ${record.questionCount}</span> right</h2>
          <p>${escapeHtml(record.difficulty)} difficulty <span aria-hidden="true">·</span> Your answers are saved on this browser.</p>
          <button class="primary-button review-again-button" type="button">Practice again <span aria-hidden="true">→</span></button>
        </div>
      </section>
      <section class="review-section">
        <div class="review-heading"><div><span class="step-label">A CHANCE TO LEARN</span><h2>Answer review</h2></div><span class="review-count">${record.questionCount} questions</span></div>
        <div class="review-list">
          ${record.questions.map((question) => `
            <article class="review-item">
              <span class="review-status ${question.isCorrect ? "is-correct" : "is-incorrect"}" aria-label="${question.isCorrect ? "Correct" : "Incorrect"}">${question.isCorrect ? "✓" : "×"}</span>
              <div class="review-copy">
                <span class="review-meta">${escapeHtml(question.category)} <span aria-hidden="true">·</span> ${escapeHtml(question.difficulty)}</span>
                <h3>${escapeHtml(question.question)}</h3>
                <p class="review-correct">Correct answer: ${escapeHtml(question.correctAnswer)}</p>
                <p class="${question.isCorrect ? "review-correct" : "your-answer"}">${question.answer === null ? "You left this one unanswered." : `Your answer: ${escapeHtml(question.answer)}`}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    </section>
  `;
  app.querySelector(".saved-review-back").addEventListener("click", renderDashboard);
  app.querySelector(".review-again-button").addEventListener("click", openQuizSetup);
};

const renderSetup = () => {
  state.screen = "setup";
  renderAccountArea();
  const categories = [...new Set(questions.map((question) => question.category))];
  const availableCount = getFilteredQuestions().length;
  const countOptions = [...new Set([5, 10, 15, availableCount])]
    .filter((count) => count <= availableCount)
    .sort((first, second) => first - second);

  if (availableCount === 0) {
    state.questionCount = "0";
  } else if (
    Number(state.questionCount) === 0 ||
    Number(state.questionCount) > availableCount
  ) {
    state.questionCount = String(Math.min(10, availableCount));
  }

  app.innerHTML = `
    <section class="welcome-layout">
      <div class="intro-panel">
        <span class="eyebrow"><span class="sparkle" aria-hidden="true">✦</span> A LITTLE PRACTICE GOES A LONG WAY</span>
        <h1>Make React<br />feel <span class="accent-text">second nature.</span></h1>
        <p class="intro-copy">A quick, no-pressure quiz to sharpen your React fundamentals. Pick your focus and see what you know.</p>
        <div class="intro-stats" aria-label="Quiz facts">
          <div class="stat"><strong>${questions.length}</strong><span>thoughtful questions</span></div>
          <span class="stat-divider" aria-hidden="true"></span>
          <div class="stat"><strong>${categories.length}</strong><span>topics to explore</span></div>
        </div>
        <div class="doodle-card" aria-hidden="true">
          <div class="doodle-spark">✳</div>
          <span class="doodle-code">const <span>confidence</span> =<br />&nbsp;&nbsp;practice + time;</span>
          <span class="doodle-check">✓</span>
        </div>
      </div>

      <section class="setup-card" aria-labelledby="setup-title">
        <button class="back-link setup-back-button" type="button"><span aria-hidden="true">←</span> Dashboard</button>
        <div class="card-heading">
          <div>
            <span class="step-label">YOUR SESSION</span>
            <h2 id="setup-title">Set the scene</h2>
          </div>
          <span class="card-icon" aria-hidden="true">✦</span>
        </div>
        <label class="field-label" for="category">What would you like to practice?</label>
        <div class="select-wrap">
          <select id="category" name="category">
            <option>All topics</option>
            ${categories.map((category) => `<option${state.category === category ? " selected" : ""}>${escapeHtml(category)}</option>`).join("")}
          </select>
          <span class="select-arrow" aria-hidden="true">⌄</span>
        </div>
        <label class="field-label" for="difficulty">Choose a difficulty</label>
        <div class="difficulty-options" role="group" aria-label="Choose a difficulty">
          ${["All levels", "Easy", "Medium", "Hard"].map((difficulty) => `
            <button class="difficulty-chip${state.difficulty === difficulty ? " is-active" : ""}" type="button" data-difficulty="${escapeHtml(difficulty)}" aria-pressed="${state.difficulty === difficulty}">
              ${difficulty === "All levels" ? "Any" : difficulty}
            </button>
          `).join("")}
        </div>
        <label class="field-label" for="question-count">How many questions?</label>
        <div class="select-wrap count-select">
          <select id="question-count" name="question-count">
            ${availableCount === 0 ? '<option value="0" selected>No matching questions</option>' : countOptions.map((count) => `<option value="${count}"${Number(state.questionCount) === count ? " selected" : ""}>${count === availableCount ? `All ${count} available questions` : `${count} questions`}</option>`).join("")}
          </select>
          <span class="select-arrow" aria-hidden="true">⌄</span>
        </div>
        ${availableCount === 0 ? '<p class="empty-filter-message">No questions match those filters yet. Try another topic or difficulty.</p>' : ""}
        <button class="primary-button start-button" type="button"${availableCount === 0 ? " disabled" : ""}>
          Let's begin <span aria-hidden="true">→</span>
        </button>
        <p class="reassurance"><span aria-hidden="true">◷</span> No timer. Take it at your own pace.</p>
      </section>
    </section>
  `;

  app.querySelector("#category").addEventListener("change", (event) => {
    state.category = event.target.value;
    renderSetup();
  });
  app.querySelector(".setup-back-button").addEventListener("click", renderDashboard);
  app.querySelector("#question-count").addEventListener("change", (event) => {
    state.questionCount = event.target.value;
  });
  app.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      state.difficulty = button.dataset.difficulty;
      renderSetup();
    });
  });
  app.querySelector(".start-button").addEventListener("click", startQuiz);
};

const startQuiz = () => {
  const matchingQuestions = shuffle(getFilteredQuestions());
  const count = Math.min(Number(state.questionCount), matchingQuestions.length);

  state.quiz = matchingQuestions.slice(0, count).map((question) => ({
    ...question,
    options: shuffle(question.options),
  }));
  state.answers = Array(state.quiz.length).fill(null);
  state.currentQuestion = 0;
  state.screen = "quiz";
  renderQuiz();
};

const renderQuiz = () => {
  state.screen = "quiz";
  renderAccountArea();
  const question = state.quiz[state.currentQuestion];
  const answeredCount = state.answers.filter((answer) => answer !== null).length;
  const progress = ((state.currentQuestion + 1) / state.quiz.length) * 100;
  const letters = ["A", "B", "C", "D"];

  app.innerHTML = `
    <section class="quiz-layout">
      <div class="quiz-topline">
        <button class="back-link" type="button"><span aria-hidden="true">←</span> Leave quiz</button>
        <span class="quiz-topic">${escapeHtml(question.category)} <span aria-hidden="true">·</span> ${escapeHtml(question.difficulty)}</span>
      </div>
      <div class="progress-row">
        <span>QUESTION <strong>${String(state.currentQuestion + 1).padStart(2, "0")}</strong> <span class="progress-of">/ ${String(state.quiz.length).padStart(2, "0")}</span></span>
        <span>${answeredCount} of ${state.quiz.length} answered</span>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Quiz progress" aria-valuenow="${state.currentQuestion + 1}" aria-valuemin="1" aria-valuemax="${state.quiz.length}">
        <span style="width: ${progress}%"></span>
      </div>
      <section class="question-card" aria-labelledby="question-title">
        <span class="question-kicker">TAKE A MOMENT, YOU'VE GOT THIS</span>
        <h1 id="question-title">${escapeHtml(question.question)}</h1>
        <p class="answer-hint">Choose the best answer</p>
        <div class="answer-list" role="radiogroup" aria-label="Answer choices">
          ${question.options.map((option, index) => {
            const isSelected = state.answers[state.currentQuestion] === option;
            return `
              <button class="answer-option${isSelected ? " is-selected" : ""}" type="button" role="radio" aria-checked="${isSelected}" data-answer="${escapeHtml(option)}">
                <span class="option-letter">${letters[index]}</span>
                <span class="option-text">${escapeHtml(option)}</span>
                <span class="option-check" aria-hidden="true">${isSelected ? "✓" : ""}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
      <div class="quiz-navigation">
        <button class="secondary-button previous-button" type="button"${state.currentQuestion === 0 ? " disabled" : ""}>
          <span aria-hidden="true">←</span> Previous
        </button>
        <span class="keyboard-hint">Your progress is saved as you go</span>
        ${state.currentQuestion === state.quiz.length - 1
          ? `<button class="primary-button next-button" type="button">${answeredCount === state.quiz.length ? "See my score" : "Finish quiz"} <span aria-hidden="true">→</span></button>`
          : `<button class="primary-button next-button" type="button">Next question <span aria-hidden="true">→</span></button>`}
      </div>
    </section>
  `;

  app.querySelector(".back-link").addEventListener("click", () => {
    if (window.confirm("Leave this quiz? Your answers from this session won't be saved.")) {
      renderDashboard();
    }
  });
  app.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers[state.currentQuestion] = button.dataset.answer;
      renderQuiz();
      app.querySelector(".answer-option.is-selected")?.focus();
    });
  });
  app.querySelector(".previous-button").addEventListener("click", () => {
    if (state.currentQuestion > 0) {
      state.currentQuestion -= 1;
      renderQuiz();
    }
  });
  app.querySelector(".next-button").addEventListener("click", () => {
    if (state.currentQuestion < state.quiz.length - 1) {
      state.currentQuestion += 1;
      renderQuiz();
      return;
    }

    const unanswered = state.answers.filter((answer) => answer === null).length;
    if (
      unanswered > 0 &&
      !window.confirm(
        `You still have ${unanswered} unanswered ${unanswered === 1 ? "question" : "questions"}. Finish anyway?`,
      )
    ) {
      return;
    }

    state.screen = "results";
    renderResults();
  });
};

const renderResults = () => {
  state.screen = "results";
  renderAccountArea();
  const correctCount = state.quiz.reduce(
    (total, question, index) =>
      total + (state.answers[index] === question.correct_answer ? 1 : 0),
    0,
  );
  const percentage = Math.round((correctCount / state.quiz.length) * 100);
  const record = {
    id: crypto.randomUUID(),
    userEmail: state.currentUser.email,
    category: state.category,
    difficulty: state.difficulty,
    questionCount: state.quiz.length,
    correctCount,
    percentage,
    completedAt: new Date().toISOString(),
    questions: state.quiz.map((question, index) => ({
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      answer: state.answers[index],
      correctAnswer: question.correct_answer,
      isCorrect: state.answers[index] === question.correct_answer,
    })),
  };
  let saveError = "";
  try {
    state.history.push(record);
    saveStoredArray(HISTORY_KEY, state.history);
  } catch (error) {
    state.history = state.history.filter((item) => item.id !== record.id);
    saveError = error instanceof Error
      ? `Your score is shown, but this attempt couldn't be saved: ${error.message}`
      : "Your score is shown, but this attempt couldn't be saved in this browser.";
  }
  const message =
    percentage === 100
      ? ["Flawless work!", "You know your React inside and out."]
      : percentage >= 70
        ? ["Nicely done!", "Your React knowledge is coming together."]
        : percentage >= 40
          ? ["Good progress!", "A little more practice will go a long way."]
          : ["Every expert starts somewhere.", "Review your answers and give it another go."];

  app.innerHTML = `
    <section class="results-layout">
      <div class="results-heading">
        <span class="eyebrow"><span class="sparkle" aria-hidden="true">✦</span> QUIZ COMPLETE</span>
        <h1>${message[0]}</h1>
        <p>${message[1]}</p>
        ${saveError ? `<p class="storage-warning" role="alert">${escapeHtml(saveError)}</p>` : ""}
      </div>
      <section class="score-card" aria-label="Your quiz score">
        <div class="score-ring" style="--score: ${percentage}%">
          <div class="score-inner">
            <strong>${percentage}<span>%</span></strong>
            <span>YOUR SCORE</span>
          </div>
        </div>
        <div class="score-details">
          <span class="step-label">THE BREAKDOWN</span>
          <h2>You got <span>${correctCount} out of ${state.quiz.length}</span> right</h2>
          <p>${state.quiz.length - correctCount} ${state.quiz.length - correctCount === 1 ? "question" : "questions"} to revisit. That's how the learning sticks.</p>
          <button class="primary-button retry-button" type="button">Try another round <span aria-hidden="true">→</span></button>
        </div>
      </section>
      <section class="review-section">
        <div class="review-heading">
          <div><span class="step-label">A CHANCE TO LEARN</span><h2>Answer review</h2></div>
          <span class="review-count">${state.quiz.length} questions</span>
        </div>
        <div class="review-list">
          ${state.quiz.map((question, index) => {
            const isCorrect = state.answers[index] === question.correct_answer;
            return `
              <article class="review-item">
                <span class="review-status ${isCorrect ? "is-correct" : "is-incorrect"}" aria-label="${isCorrect ? "Correct" : "Incorrect"}">${isCorrect ? "✓" : "×"}</span>
                <div class="review-copy">
                  <span class="review-meta">${escapeHtml(question.category)} <span aria-hidden="true">·</span> ${escapeHtml(question.difficulty)}</span>
                  <h3>${escapeHtml(question.question)}</h3>
                  <p class="${isCorrect ? "review-correct" : "review-incorrect"}">${isCorrect ? "Your answer" : "Correct answer"}: ${escapeHtml(question.correct_answer)}</p>
                  ${!isCorrect && state.answers[index] ? `<p class="your-answer">You chose: ${escapeHtml(state.answers[index])}</p>` : ""}
                  ${!isCorrect && !state.answers[index] ? '<p class="your-answer">You left this one unanswered.</p>' : ""}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    </section>
  `;

  app.querySelector(".retry-button").addEventListener("click", () => {
    renderDashboard();
  });
};

if (Array.isArray(questions) && questions.length > 0) {
  try {
    state.users = readStoredArray(USERS_KEY);
    state.history = readStoredArray(HISTORY_KEY);
    const activeEmail = localStorage.getItem(SESSION_KEY);
    const user = state.users.find((item) => item.email === activeEmail);

    if (user) {
      state.currentUser = { email: user.email, name: user.name };
      renderDashboard();
    } else {
      if (activeEmail) localStorage.removeItem(SESSION_KEY);
      renderAuth();
    }
  } catch (error) {
    renderAccountArea();
    app.innerHTML = `<p class="error-message" role="alert">${escapeHtml(error instanceof Error ? error.message : "The app's saved browser data could not be loaded.")}</p>`;
  }
} else {
  app.innerHTML = '<p class="error-message">The quiz questions could not be loaded. Please refresh the page and try again.</p>';
}
