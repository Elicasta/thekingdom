"use strict";

const STORAGE_PREFIX = "the-kingdom:v1";

const slides = [
  {
    type: "title",
    label: "Title",
    kicker: "Lesson Two",
    title: "When the Kingdom Falls",
    copy: "Eternity · Lamentations · Babylon",
    note: "Let the title breathe. This lesson begins where Solomon's personal drift becomes a national direction."
  },
  {
    type: "statement",
    label: "Recap",
    kicker: "Lesson One",
    quote: "Solomon knew God, then drifted by decisions, not one moment.",
    note: "Reconnect the room to Solomon. Stress that drift usually forms by repeated decisions."
  },
  {
    type: "statement",
    label: "Mirror line",
    kicker: "The present question",
    quote: "The question is not whether we have been near God. The question is whether God presently rules us.",
    note: "Do not rush. Let them locate themselves inside the question."
  },
  {
    type: "scripture",
    label: "Choose",
    ref: "Joshua 24:15 · KJV",
    text: "Choose you this day whom ye will serve.",
    note: "Move from inherited exposure to personal surrender. Faith must become theirs."
  },
  {
    type: "section",
    label: "Section 1",
    number: "01",
    title: "Ignored Warnings",
    note: "Introduce warnings as mercy, not hostility."
  },
  {
    type: "scripture",
    label: "Warnings are mercy",
    ref: "2 Chronicles 36:15–16 · KJV",
    text: "And the LORD God of their fathers sent to them by his messengers… because he had compassion on his people… till there was no remedy.",
    note: "Before Babylon arrived, God spoke. The warning revealed compassion."
  },
  {
    type: "statement",
    label: "Key lines",
    kicker: "Refusal has a form",
    quote: "Not answering is an answer.\nDelay is not neutral.",
    note: "Explain how hearing without responding trains the heart to refuse again."
  },
  {
    type: "poll",
    label: "Poll 1",
    kicker: "Private poll",
    question: "Have you been ignoring a warning God has been giving you?",
    options: ["Yes", "No", "Not sure"],
    pollId: "warning",
    note: "Give them space to answer privately on their phones. No names are collected."
  },
  {
    type: "section",
    label: "Section 2",
    number: "02",
    title: "Jerusalem Falls",
    copy: "Lamentations",
    note: "Shift from warning to visible consequence. Jeremiah is now sitting inside what happened."
  },
  {
    type: "scripture",
    label: "Ruins",
    ref: "Lamentations 1:1 · KJV",
    text: "How doth the city sit solitary, that was full of people!",
    note: "The crowded city is empty. The consequence now has a location."
  },
  {
    type: "statement",
    label: "Thread line",
    kicker: "What travels",
    quote: "Private compromise becomes public culture over time.",
    note: "What Solomon permitted around one throne became normal across a nation."
  },
  {
    type: "poll",
    label: "Poll 2",
    kicker: "Private poll",
    question: "Where does drift happen most for you?",
    options: ["Relationships", "Private habits", "Entertainment", "Attitude"],
    pollId: "drift",
    note: "Let the categories expose how drift appears before it becomes visible to everyone else."
  },
  {
    type: "section",
    label: "Section 3",
    number: "03",
    title: "Babylon as a Picture of Hell",
    note: "Babylon is a visible picture of exile, but it is not the full reality of final judgment."
  },
  {
    type: "contrast",
    label: "Captivity vs judgment",
    kicker: "The difference",
    left: "Captivity ends.",
    right: "Judgment does not.",
    note: "Babylon had a return. Final judgment has no return."
  },
  {
    type: "scripture",
    label: "Great white throne",
    ref: "Revelation 20:11–15 · KJV",
    text: "The great white throne. The books opened. The lake of fire. The second death.",
    note: "Keep the weight biblical. Do not perform fear. State what the text states."
  },
  {
    type: "section",
    label: "Section 4",
    number: "04",
    title: "A Breath of Mercy",
    note: "Mercy appears in the middle of rubble. It does not deny what happened."
  },
  {
    type: "scripture",
    label: "New every morning",
    ref: "Lamentations 3:22–23 · KJV",
    text: "It is of the LORD’S mercies that we are not consumed… They are new every morning: great is thy faithfulness.",
    note: "New mercy means another opportunity to answer. It does not promise unlimited mornings."
  },
  {
    type: "poll",
    label: "Poll 3",
    kicker: "Private poll",
    question: "What do you need to do with mercy today?",
    options: ["Repent", "Ask for prayer", "Change a boundary", "Talk to a leader"],
    pollId: "mercy",
    note: "Move from recognition to a concrete response."
  },
  {
    type: "statement",
    label: "The lie",
    kicker: "The dangerous assumption",
    quote: "The lie is: “I have time.”",
    note: "Many believe the truth while postponing their response to it."
  },
  {
    type: "scripture",
    label: "Appointment",
    ref: "Hebrews 9:27 · KJV",
    text: "And as it is appointed unto men once to die, but after this the judgment.",
    note: "Hold this text beside Lamentations 3. Mercy is available, but our number of mornings is unknown."
  },
  {
    type: "scripture",
    label: "Gospel response",
    ref: "Acts 2:38 · KJV",
    text: "Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost.",
    note: "Salvation is not merely an idea to admire. It calls for a response."
  },
  {
    type: "scripture",
    label: "Grace teaches",
    ref: "Titus 2:11–12 · KJV",
    text: "Teaching us that, denying ungodliness and worldly lusts, we should live soberly, righteously, and godly, in this present world.",
    note: "Grace does not excuse the life that separated us from God. Grace teaches us to deny it."
  },
  {
    type: "closing",
    label: "Closing line",
    kicker: "Mercy is speaking",
    quote: "Every ignored warning felt survivable until the day it was not. Mercy gives us today, but mercy was never given so we could postpone obedience.",
    note: "End in reflection, responsibility, alignment, and a clear invitation to obey."
  }
];

const polls = [
  {
    id: "warning",
    question: "Have you been ignoring a warning God has been giving you?",
    options: ["Yes", "No", "Not sure"]
  },
  {
    id: "drift",
    question: "Where does drift happen most for you?",
    options: ["Relationships", "Private habits", "Entertainment", "Attitude"]
  },
  {
    id: "mercy",
    question: "What do you need to do with mercy today?",
    options: ["Repent", "Ask for prayer", "Change a boundary", "Talk to a leader"]
  }
];

const reflectionGroups = [
  {
    title: "Follow the thread",
    questions: [
      "Where have I confused survival with safety?",
      "What warning have I heard repeatedly, and what would obedience look like?",
      "If God is not on the throne, what is?"
    ]
  },
  {
    title: "Drift and consequences",
    questions: [
      "What was one small decision that started moving me away from God?",
      "What am I tolerating that is slowly altering what I love?",
      "What would happen if I continued this direction for a year?"
    ]
  },
  {
    title: "Mercy and urgency",
    questions: [
      "How have I treated mercy like permission instead of opportunity?",
      "What does the lie “I have time” sound like in my own words?"
    ]
  },
  {
    title: "Salvation response",
    questions: [
      "What part of Acts 2:38 am I resisting: repentance, baptism, or the Holy Ghost?",
      "What is one concrete step I will take in the next 24 hours?"
    ]
  },
  {
    title: "Leader questions",
    questions: [
      "What are two boundaries that protect the throne of my heart?",
      "Who is one person I need to talk to for accountability?"
    ]
  }
];

const APP_CONFIG = Object.freeze({
  supabaseUrl: String(window.KINGDOM_CONFIG?.supabaseUrl || "").trim().replace(/\/$/, ""),
  supabasePublishableKey: String(window.KINGDOM_CONFIG?.supabasePublishableKey || window.KINGDOM_CONFIG?.supabaseAnonKey || "").trim(),
  pollRefreshMs: Math.max(3000, Number(window.KINGDOM_CONFIG?.pollRefreshMs) || 5000)
});

const SUPABASE_PLACEHOLDERS = ["YOUR_PROJECT_REF", "YOUR_SUPABASE_PUBLISHABLE_KEY", "YOUR_SUPABASE_ANON_KEY"];
const supabaseConfigured = Boolean(
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(APP_CONFIG.supabaseUrl)
  && APP_CONFIG.supabasePublishableKey
  && !SUPABASE_PLACEHOLDERS.some((placeholder) => `${APP_CONFIG.supabaseUrl} ${APP_CONFIG.supabasePublishableKey}`.includes(placeholder))
);

const state = {
  currentView: "home",
  slideIndex: 0,
  touchStartX: null,
  touchStartY: null,
  toastTimer: null,
  pollRefreshTimer: null,
  pollResults: Object.create(null),
  pollLoading: new Set(),
  supabaseReachable: null
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;"
}[char]));

function storageKey(...parts) {
  return [STORAGE_PREFIX, ...parts].join(":");
}

function safeRead(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be disabled. The UI still works for the current session.
  }
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function getDeviceId() {
  const key = storageKey("device-id");
  const existing = safeRead(key);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  const created = createUuid();
  safeWrite(key, created);
  return created;
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function updatePollConnection() {
  const banner = $("#poll-connection");
  if (!banner) return;
  if (!supabaseConfigured) {
    banner.className = "poll-connection local";
    banner.innerHTML = "<strong>Supabase not connected</strong><span>Poll choices will stay on this phone until config.js is filled in. Run supabase/setup.sql before sharing the link.</span>";
    return;
  }

  if (navigator.onLine === false || state.supabaseReachable === false) {
    banner.className = "poll-connection local";
    banner.innerHTML = "<strong>Live polls temporarily offline</strong><span>Choices stay on this phone and retry when the connection returns. Reflection answers remain local.</span>";
    return;
  }

  banner.className = "poll-connection online";
  banner.innerHTML = "<strong>Live polls connected</strong><span>Votes are anonymous. Reflection answers still remain only on this phone.</span>";
}

function viewFromHash() {
  const requested = location.hash.replace(/^#/, "").trim().toLowerCase();
  return ["home", "slides", "guide", "polls", "reflect"].includes(requested) ? requested : "home";
}

function setView(view, { updateHash = true, scroll = true } = {}) {
  if (!["home", "slides", "guide", "polls", "reflect"].includes(view)) view = "home";
  state.currentView = view;

  $$(".view").forEach((section) => section.classList.toggle("active", section.dataset.view === view));
  $$('[data-view-target]').forEach((button) => button.classList.toggle("active", button.dataset.viewTarget === view));

  if (updateHash && location.hash !== `#${view}`) history.pushState(null, "", `#${view}`);
  if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
  document.title = view === "home" ? "The Kingdom | When the Kingdom Falls" : `The Kingdom | ${view[0].toUpperCase()}${view.slice(1)}`;

  if (view === "slides") setTimeout(() => $("#deck-stage")?.focus({ preventScroll: true }), 50);
  if (view === "polls") {
    refreshAnsweredPolls();
    startPollRefresh();
  } else {
    stopPollRefresh();
  }
}

function renderSlide(index) {
  state.slideIndex = Math.max(0, Math.min(index, slides.length - 1));
  const slide = slides[state.slideIndex];
  const stage = $("#deck-stage");
  if (!stage) return;

  let content = "";
  if (slide.type === "title") {
    content = `<article class="slide slide-title-card"><p class="slide-kicker">${escapeHtml(slide.kicker)}</p><h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-copy">${escapeHtml(slide.copy)}</p></article>`;
  } else if (slide.type === "statement") {
    content = `<article class="slide slide-statement"><p class="slide-kicker">${escapeHtml(slide.kicker)}</p><h2 class="slide-quote">${escapeHtml(slide.quote).replace(/\n/g, "<br>")}</h2></article>`;
  } else if (slide.type === "scripture") {
    content = `<article class="slide slide-scripture"><p class="scripture-ref">${escapeHtml(slide.ref)}</p><div class="scripture-text">${escapeHtml(slide.text)}</div></article>`;
  } else if (slide.type === "section") {
    content = `<article class="slide slide-section"><span class="section-no">${escapeHtml(slide.number)}</span><h2 class="slide-title">${escapeHtml(slide.title)}</h2>${slide.copy ? `<p class="slide-copy">${escapeHtml(slide.copy)}</p>` : ""}</article>`;
  } else if (slide.type === "poll") {
    content = `<article class="slide slide-poll"><div class="poll-mark"></div><p class="slide-kicker">${escapeHtml(slide.kicker)}</p><h2 class="slide-quote">${escapeHtml(slide.question)}</h2><div class="poll-options">${slide.options.map((option) => `<span>${escapeHtml(option)}</span>`).join("")}</div></article>`;
  } else if (slide.type === "contrast") {
    content = `<article class="slide slide-contrast"><p class="slide-kicker">${escapeHtml(slide.kicker)}</p><div class="contrast-grid"><div class="contrast-card"><strong>${escapeHtml(slide.left)}</strong></div><div class="contrast-card"><strong>${escapeHtml(slide.right)}</strong></div></div></article>`;
  } else if (slide.type === "closing") {
    content = `<article class="slide slide-closing"><p class="slide-kicker">${escapeHtml(slide.kicker)}</p><h2 class="slide-quote">${escapeHtml(slide.quote)}</h2></article>`;
  }

  stage.innerHTML = content;
  $("#slide-number").textContent = `${state.slideIndex + 1} / ${slides.length}`;
  $("#slide-label").textContent = slide.label;
  $("#speaker-note-text").textContent = slide.note;
  $("#deck-progress-bar").style.width = `${((state.slideIndex + 1) / slides.length) * 100}%`;
  $("#prev-slide").disabled = state.slideIndex === 0;
  $("#next-slide").disabled = state.slideIndex === slides.length - 1;
  $$(".slide-thumb").forEach((thumb, thumbIndex) => thumb.classList.toggle("active", thumbIndex === state.slideIndex));
  safeWrite(storageKey("slide"), String(state.slideIndex));
}

function moveSlide(delta) {
  renderSlide(state.slideIndex + delta);
}

function renderOverview() {
  const grid = $("#slide-grid");
  if (!grid) return;
  grid.innerHTML = slides.map((slide, index) => {
    const title = slide.title || slide.quote || slide.question || slide.text || slide.label;
    return `<button class="slide-thumb${index === state.slideIndex ? " active" : ""}" type="button" data-slide-index="${index}"><span>${String(index + 1).padStart(2, "0")} · ${escapeHtml(slide.label)}</span><strong>${escapeHtml(title)}</strong></button>`;
  }).join("");
}

function normalizePollResults(poll, rows) {
  const resultMap = new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row.choice), Number(row.votes) || 0]));
  return poll.options.map((choice) => ({ choice, votes: resultMap.get(choice) || 0 }));
}

function renderPollResults(poll) {
  const rows = state.pollResults[poll.id];
  if (!rows) return "";
  const total = rows.reduce((sum, row) => sum + row.votes, 0);
  const items = rows.map((row) => {
    const percent = total ? Math.round((row.votes / total) * 100) : 0;
    return `<div class="poll-result-row"><div class="poll-result-copy"><span>${escapeHtml(row.choice)}</span><strong>${percent}% <small>${row.votes}</small></strong></div><div class="poll-result-track" aria-hidden="true"><span style="width:${percent}%"></span></div></div>`;
  }).join("");
  return `<section class="poll-results" aria-label="Live poll results"><div class="poll-results-head"><strong>Live results</strong><span>${total} ${total === 1 ? "vote" : "votes"}</span></div>${items}</section>`;
}

function pollStatusText(pollId, saved) {
  if (state.pollLoading.has(pollId)) return "Sending anonymous vote...";
  if (!saved) return "Choose one response.";
  const pending = safeRead(storageKey("poll-pending", pollId)) === "1";
  if (!supabaseConfigured) return `Saved on this phone: ${saved}. Supabase is not connected yet.`;
  if (pending) return `Saved on this phone: ${saved}. Waiting to sync...`;
  if (state.pollResults[pollId]) return `Anonymous vote saved: ${saved}. You can change it.`;
  return `Anonymous vote saved: ${saved}. Loading live results...`;
}

function renderPolls() {
  const list = $("#poll-list");
  if (!list) return;

  list.innerHTML = polls.map((poll, pollIndex) => {
    const saved = safeRead(storageKey("poll", poll.id));
    const options = poll.options.map((option, optionIndex) => {
      const inputId = `poll-${poll.id}-${optionIndex}`;
      const disabled = state.pollLoading.has(poll.id) ? "disabled" : "";
      return `<div class="poll-option"><input type="radio" id="${inputId}" name="poll-${poll.id}" value="${escapeHtml(option)}" ${saved === option ? "checked" : ""} ${disabled}><label for="${inputId}">${escapeHtml(option)}</label></div>`;
    }).join("");
    return `<article class="poll-card" data-poll-id="${poll.id}"><span class="poll-number">Poll ${pollIndex + 1}</span><h2>${escapeHtml(poll.question)}</h2><div class="poll-options-form">${options}</div><p class="poll-saved" aria-live="polite">${escapeHtml(pollStatusText(poll.id, saved))}</p>${saved ? renderPollResults(poll) : ""}</article>`;
  }).join("");
}

function renderReflections() {
  const list = $("#reflection-list");
  if (!list) return;
  let runningIndex = 0;

  list.innerHTML = reflectionGroups.map((group) => {
    const items = group.questions.map((question) => {
      const questionIndex = runningIndex++;
      const id = `reflection-${questionIndex}`;
      const value = safeRead(storageKey("reflection", questionIndex));
      return `<div class="reflection-item"><label for="${id}">${questionIndex + 1}. ${escapeHtml(question)}</label><textarea id="${id}" data-reflection-index="${questionIndex}" placeholder="Write your response...">${escapeHtml(value)}</textarea><div class="save-status" id="status-${questionIndex}" aria-live="polite">${value ? "Saved on this device." : ""}</div></div>`;
    }).join("");
    return `<section class="reflection-group"><p class="section-index">Reflection</p><h2>${escapeHtml(group.title)}</h2>${items}</section>`;
  }).join("");
}

async function supabaseRpc(functionName, payload) {
  if (!supabaseConfigured) throw new Error("Supabase is not configured.");
  try {
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "apikey": APP_CONFIG.supabasePublishableKey
    };
    if (/^eyJ/i.test(APP_CONFIG.supabasePublishableKey)) {
      headers.Authorization = `Bearer ${APP_CONFIG.supabasePublishableKey}`;
    }

    const response = await fetch(`${APP_CONFIG.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(functionName)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let message = `Supabase request failed (${response.status}).`;
      try {
        const error = await response.json();
        message = error.message || error.hint || message;
      } catch {
        // Keep the status-based error.
      }
      throw new Error(message);
    }

    state.supabaseReachable = true;
    updatePollConnection();
    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    state.supabaseReachable = false;
    updatePollConnection();
    throw error;
  }
}

async function submitPollVote(pollId, choice, { quiet = false } = {}) {
  const poll = polls.find((item) => item.id === pollId);
  if (!poll || !poll.options.includes(choice) || state.pollLoading.has(pollId)) return;

  safeWrite(storageKey("poll", pollId), choice);
  safeWrite(storageKey("poll-pending", pollId), "1");
  if (!supabaseConfigured) {
    renderPolls();
    if (!quiet) showToast("Saved on this phone. Add Supabase config for live totals.");
    return;
  }

  state.pollLoading.add(pollId);
  renderPolls();
  try {
    const rows = await supabaseRpc("submit_kingdom_poll_vote", {
      p_poll_id: pollId,
      p_device_id: getDeviceId(),
      p_choice: choice
    });
    safeRemove(storageKey("poll-pending", pollId));
    state.pollResults[pollId] = normalizePollResults(poll, rows);
    if (!quiet) showToast("Anonymous vote saved.");
  } catch (error) {
    console.error(error);
    if (!quiet) showToast("Vote stayed on this phone and will retry when the connection returns.");
  } finally {
    state.pollLoading.delete(pollId);
    renderPolls();
  }
}

async function loadPollResults(pollId, { quiet = false } = {}) {
  if (!supabaseConfigured || state.pollLoading.has(pollId)) return;
  const poll = polls.find((item) => item.id === pollId);
  if (!poll) return;
  try {
    const rows = await supabaseRpc("get_kingdom_poll_results", { p_poll_id: pollId });
    state.pollResults[pollId] = normalizePollResults(poll, rows);
    if (state.currentView === "polls") renderPolls();
  } catch (error) {
    if (!quiet) {
      console.error(error);
      showToast("Live poll totals are temporarily unavailable.");
    }
  }
}

function refreshAnsweredPolls({ quiet = true } = {}) {
  if (!supabaseConfigured) return;
  polls.forEach((poll) => {
    const saved = safeRead(storageKey("poll", poll.id));
    if (!saved) return;
    if (safeRead(storageKey("poll-pending", poll.id)) === "1") {
      submitPollVote(poll.id, saved, { quiet });
    } else {
      loadPollResults(poll.id, { quiet });
    }
  });
}

function startPollRefresh() {
  if (!supabaseConfigured || state.pollRefreshTimer) return;
  state.pollRefreshTimer = window.setInterval(() => refreshAnsweredPolls({ quiet: true }), APP_CONFIG.pollRefreshMs);
}

function stopPollRefresh() {
  if (!state.pollRefreshTimer) return;
  clearInterval(state.pollRefreshTimer);
  state.pollRefreshTimer = null;
}

async function clearPollAnswers() {
  const prompt = supabaseConfigured
    ? "Remove this phone's anonymous votes from the live totals and clear its selections?"
    : "Clear all poll selections stored on this phone?";
  if (!window.confirm(prompt)) return;

  if (supabaseConfigured) {
    polls.forEach((poll) => state.pollLoading.add(poll.id));
    renderPolls();
    try {
      await supabaseRpc("clear_kingdom_poll_votes", { p_device_id: getDeviceId() });
    } catch (error) {
      console.error(error);
      polls.forEach((poll) => state.pollLoading.delete(poll.id));
      renderPolls();
      showToast("Could not remove the live votes. Nothing was cleared.");
      return;
    }
  }

  polls.forEach((poll) => {
    state.pollLoading.delete(poll.id);
    safeRemove(storageKey("poll", poll.id));
    safeRemove(storageKey("poll-pending", poll.id));
    delete state.pollResults[poll.id];
  });
  renderPolls();
  showToast(supabaseConfigured ? "This phone's live votes were removed." : "Selections cleared from this phone.");
}

function clearReflectionAnswers() {
  if (!window.confirm("Erase every reflection answer stored on this device? This cannot be undone.")) return;
  let count = 0;
  reflectionGroups.forEach((group) => group.questions.forEach(() => safeRemove(storageKey("reflection", count++))));
  renderReflections();
  showToast("Reflection answers erased from this device.");
}

async function shareLesson() {
  const shareData = {
    title: "The Kingdom: When the Kingdom Falls",
    text: "Lesson 2 slides, live polls, and private reflection questions.",
    url: location.href.split("#")[0]
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    showToast("Lesson link copied.");
  } catch (error) {
    if (error?.name !== "AbortError") showToast("Unable to share from this browser.");
  }
}

async function toggleFullscreen() {
  const shell = $("#deck-shell");
  if (!shell) return;

  try {
    if (!document.fullscreenElement) {
      await shell.requestFullscreen();
      shell.classList.add("fullscreen");
    } else {
      await document.exitFullscreen();
    }
  } catch {
    showToast("Full screen is not available in this browser.");
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view-target]");
    if (viewButton) {
      setView(viewButton.dataset.viewTarget);
      return;
    }

    const thumb = event.target.closest("[data-slide-index]");
    if (thumb) {
      renderSlide(Number(thumb.dataset.slideIndex));
      $("#overview-dialog")?.close();
    }
  });

  window.addEventListener("hashchange", () => setView(viewFromHash(), { updateHash: false }));
  window.addEventListener("online", () => {
    state.supabaseReachable = null;
    updatePollConnection();
    refreshAnsweredPolls({ quiet: false });
  });
  window.addEventListener("offline", updatePollConnection);
  $("#prev-slide")?.addEventListener("click", () => moveSlide(-1));
  $("#next-slide")?.addEventListener("click", () => moveSlide(1));
  $("#fullscreen-button")?.addEventListener("click", toggleFullscreen);
  $("#share-button")?.addEventListener("click", shareLesson);
  $("#print-guide")?.addEventListener("click", () => window.print());
  $("#clear-polls")?.addEventListener("click", clearPollAnswers);
  $("#clear-reflections")?.addEventListener("click", clearReflectionAnswers);

  $("#overview-button")?.addEventListener("click", () => {
    renderOverview();
    $("#overview-dialog")?.showModal();
  });
  $(".close-dialog")?.addEventListener("click", () => $("#overview-dialog")?.close());
  $("#overview-dialog")?.addEventListener("click", (event) => {
    if (event.target === $("#overview-dialog")) $("#overview-dialog").close();
  });

  document.addEventListener("change", (event) => {
    const input = event.target.closest('.poll-option input[type="radio"]');
    if (!input) return;
    const card = input.closest(".poll-card");
    const pollId = card?.dataset.pollId;
    if (!pollId) return;
    submitPollVote(pollId, input.value);
  });

  let reflectionTimer = null;
  document.addEventListener("input", (event) => {
    const textarea = event.target.closest("textarea[data-reflection-index]");
    if (!textarea) return;
    const index = textarea.dataset.reflectionIndex;
    const status = $(`#status-${index}`);
    if (status) status.textContent = "Saving locally...";
    clearTimeout(reflectionTimer);
    reflectionTimer = setTimeout(() => {
      const saved = safeWrite(storageKey("reflection", index), textarea.value);
      if (status) status.textContent = saved ? "Saved on this device." : "Storage is blocked. This answer will not survive a refresh.";
    }, 260);
  });

  document.addEventListener("keydown", (event) => {
    if (state.currentView !== "slides") return;
    if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      moveSlide(1);
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      moveSlide(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      renderSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      renderSlide(slides.length - 1);
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  const stage = $("#deck-stage");
  stage?.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    state.touchStartX = touch.clientX;
    state.touchStartY = touch.clientY;
  }, { passive: true });
  stage?.addEventListener("touchend", (event) => {
    if (state.touchStartX === null || state.touchStartY === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - state.touchStartX;
    const dy = touch.clientY - state.touchStartY;
    state.touchStartX = null;
    state.touchStartY = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) moveSlide(dx < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener("fullscreenchange", () => {
    const shell = $("#deck-shell");
    shell?.classList.toggle("fullscreen", Boolean(document.fullscreenElement));
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Offline installation is optional. The site remains usable without it.
    });
  }
}

function init() {
  getDeviceId();
  updatePollConnection();
  renderPolls();
  renderReflections();
  renderOverview();
  const savedSlide = Number(safeRead(storageKey("slide"), "0"));
  renderSlide(Number.isFinite(savedSlide) ? savedSlide : 0);
  bindEvents();
  setView(viewFromHash(), { updateHash: false, scroll: false });
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", init);
