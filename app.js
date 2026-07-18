(() => {
  'use strict';

  const LESSON = window.KINGDOM_LESSON;
  const app = document.getElementById('app');
  const CHANNEL = 'the-kingdom-live-control';
  const STATE_ID = 'main';
  const OUTPUT_ROUTES = new Set(['projector', 'scriptures', 'confidence', 'obslowerthirds', 'obsslides']);
  const ADMIN_ROUTES = new Set(['admin', 'remote', 'questions', 'polls']);
  const route = normalizeRoute(location.pathname);
  const query = new URLSearchParams(location.search);

  let state = {
    id: STATE_ID,
    current_slide: 0,
    started: false,
    started_at: null,
    blackout: false,
    active_scripture: null,
    scripture_visible: false,
    active_poll_id: null,
    poll_results_visible: false,
    reload_token: 0,
    updated_at: new Date().toISOString()
  };
  let initialStateLoaded = false;
  let supabase = null;
  let realtimeChannel = null;
  let bc = null;
  let statePollTimer = null;
  let statePollInFlight = false;
  let statePollStopped = false;
  let realtimeSubscribed = false;
  let connectionMode = 'connecting';
  let adminAuthenticated = false;
  let activeAdminTab = 'control';
  let pollResults = new Map();
  let questions = [];
  let pollRefreshTimer = null;
  let questionRefreshTimer = null;
  let toastTimer = null;

  function normalizeRoute(pathname) {
    const clean = String(pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase();
    const aliases = {
      scripture: 'scriptures',
      obs: 'obslowerthirds',
      'obs-lower': 'obslowerthirds',
      'obs-slides': 'obsslides',
      presenter: 'admin',
      mobile: 'remote'
    };
    return aliases[clean] || clean || 'hub';
  }

  function clampSlide(value) {
    const max = Math.max(0, LESSON.slides.length - 1);
    return Math.max(0, Math.min(max, Number(value) || 0));
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function stripText(value) {
    const tmp = document.createElement('div');
    tmp.innerHTML = String(value || '');
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function slideTitle(slide) {
    if (!slide) return 'Standby';
    if (slide.type === 'title') return slide.title;
    if (slide.type === 'scripture') return slide.ref;
    if (slide.type === 'scripture-summary') return slide.title;
    if (slide.type === 'split-statement') return slide.lines.join(' ');
    if (slide.type === 'contrast') return `${slide.left.label} ${slide.left.text} ${slide.right.label} ${slide.right.text}`;
    if (slide.type === 'poll') return slide.question;
    return slide.title || slide.text || 'Slide';
  }

  function slideTypeLabel(slide) {
    const labels = {
      title: 'Title',
      statement: 'Statement',
      section: 'Section',
      scripture: 'Scripture',
      'scripture-summary': 'Scripture',
      'split-statement': 'Statement',
      poll: 'Poll',
      contrast: 'Contrast',
      closing: 'Closing'
    };
    return labels[slide?.type] || 'Slide';
  }

  function slideDetail(slide) {
    if (!slide) return '';
    if (slide.type === 'scripture') return slide.text;
    if (slide.type === 'scripture-summary') return slide.lines.join(' · ');
    if (slide.type === 'poll') return slide.options.join(' · ');
    if (slide.type === 'section') return slide.subtitle || '';
    if (slide.type === 'closing') return slide.text;
    return slide.kicker || slide.subtitle || '';
  }

  function renderSlide(slide, index = 0) {
    const n = String(index + 1).padStart(2, '0');
    switch (slide.type) {
      case 'title':
        return `<section class="slide title-slide" data-slide-index="${index}">
          <div class="slide-kicker">${escapeHTML(slide.eyebrow)}</div>
          <h1 class="slide-title">${escapeHTML(slide.title)}</h1>
          <div class="slide-copy">${escapeHTML(slide.subtitle)}</div>
        </section>`;
      case 'statement':
        return `<section class="slide statement-slide" data-slide-index="${index}">
          <div class="slide-kicker">${escapeHTML(slide.kicker || 'Key Line')}</div>
          <div class="slide-title">${escapeHTML(slide.title)}</div>
        </section>`;
      case 'section':
        return `<section class="slide section-slide" data-slide-index="${index}">
          <div class="section-number">${escapeHTML(slide.number || n)}</div>
          <div class="slide-kicker">Section ${escapeHTML(slide.number || n)}</div>
          <div class="slide-title">${escapeHTML(slide.title)}</div>
          ${slide.subtitle ? `<div class="slide-copy">${escapeHTML(slide.subtitle)}</div>` : ''}
        </section>`;
      case 'scripture': {
        const long = slide.text.length > 310 ? ' long' : '';
        return `<section class="slide scripture-slide${long}" data-slide-index="${index}">
          <div class="slide-ref">${escapeHTML(slide.ref)} · KJV</div>
          <div class="scripture-text">“${escapeHTML(slide.text)}”</div>
        </section>`;
      }
      case 'split-statement':
        return `<section class="slide" data-slide-index="${index}">
          <div class="slide-kicker">Key Lines</div>
          <div class="split-lines">${slide.lines.map(line => `<div class="split-line">${escapeHTML(line)}</div>`).join('')}</div>
        </section>`;
      case 'poll':
        return `<section class="slide poll-slide" data-slide-index="${index}">
          <div class="slide-kicker">${escapeHTML(slide.kicker)}</div>
          <div class="slide-title">${escapeHTML(slide.question)}</div>
          <div class="poll-slide-options">${slide.options.map(option => `<div class="poll-slide-option">${escapeHTML(option)}</div>`).join('')}</div>
        </section>`;
      case 'contrast':
        return `<section class="slide" data-slide-index="${index}">
          <div class="slide-kicker">Captivity vs Judgment</div>
          <div class="contrast-grid">
            <div class="contrast-box"><div class="contrast-label">${escapeHTML(slide.left.label)}</div><div class="contrast-text">${escapeHTML(slide.left.text)}</div></div>
            <div class="contrast-box"><div class="contrast-label">${escapeHTML(slide.right.label)}</div><div class="contrast-text">${escapeHTML(slide.right.text)}</div></div>
          </div>
        </section>`;
      case 'scripture-summary':
        return `<section class="slide" data-slide-index="${index}">
          <div class="slide-ref">${escapeHTML(slide.ref)} · KJV</div>
          <div class="slide-title">${escapeHTML(slide.title)}</div>
          <div class="summary-lines">${slide.lines.map(line => `<div class="summary-line">${escapeHTML(line)}</div>`).join('')}</div>
        </section>`;
      case 'closing':
        return `<section class="slide closing-slide" data-slide-index="${index}">
          <div class="slide-kicker">Closing Line</div>
          <div class="slide-title">${escapeHTML(slide.title)}</div>
          <div class="slide-copy">${escapeHTML(slide.text)}</div>
        </section>`;
      default:
        return `<section class="slide" data-slide-index="${index}"><div class="slide-title">${escapeHTML(slideTitle(slide))}</div></section>`;
    }
  }

  function standbyHTML(label = 'Waiting for presenter') {
    return `<div class="standby">
      <div class="standby-inner">
        <div class="standby-brand">THE <span>KINGDOM</span></div>
        <div class="standby-sub">${escapeHTML(LESSON.lessonNumber)} · ${escapeHTML(LESSON.title)} · ${escapeHTML(label)}</div>
      </div>
    </div>`;
  }

  function currentSlide() {
    return LESSON.slides[clampSlide(state.current_slide)];
  }

  function nextSlideData() {
    return LESSON.slides[Math.min(LESSON.slides.length - 1, clampSlide(state.current_slide) + 1)];
  }

  function currentPoll() {
    return LESSON.polls.find(p => p.id === state.active_poll_id) || null;
  }

  function deviceToken() {
    const key = 'kingdom_device_token';
    let token = localStorage.getItem(key);
    if (!token) {
      token = crypto.randomUUID ? crypto.randomUUID() : `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, token);
    }
    return token;
  }

  function isPollVoted(pollId) {
    return localStorage.getItem(`kingdom_poll_voted_${pollId}`) === '1';
  }

  function setPollVoted(pollId) {
    localStorage.setItem(`kingdom_poll_voted_${pollId}`, '1');
  }

  function connectionPill() {
    return `<div class="status-pill" id="connection-pill"><span class="status-dot"></span><span id="connection-label">Connecting</span></div>`;
  }

  function renderHub() {
    app.innerHTML = `<main class="app-shell">
      <header class="topbar">
        <a class="brand" href="/"><span>The</span> Kingdom <small>Lesson Hub</small></a>
        ${connectionPill()}
      </header>
      <section class="hub-hero">
        <div class="hub-hero-inner">
          <div class="eyebrow">${escapeHTML(LESSON.lessonNumber)}</div>
          <h1 class="hub-title">${escapeHTML(LESSON.title)}</h1>
          <div class="hub-subtitle">${escapeHTML(LESSON.subtitle)}</div>
          <div class="hub-live-row">
            <div class="status-pill" id="session-status"><span class="status-dot"></span><span>Standby</span></div>
            <button class="btn" data-action="scroll-reflections">Reflection Questions</button>
          </div>
        </div>
      </section>
      <section class="hub-grid">
        <div class="stack">
          <article class="card">
            <div class="card-head">
              <div><div class="card-kicker">Now Presenting</div><h2 class="card-title">Live Lesson Position</h2></div>
              <div class="status-pill"><span id="hub-slide-count">1 / ${LESSON.slides.length}</span></div>
            </div>
            <div class="now-slide"><div class="now-number" id="hub-now-number">01</div><div><div class="now-type" id="hub-now-type">Title</div><div class="now-title" id="hub-now-title">${escapeHTML(LESSON.title)}</div></div></div>
          </article>
          <article class="card" id="hub-poll-card">
            <div class="card-kicker">Live Poll</div>
            <h2 class="card-title">Waiting for the presenter</h2>
            <p class="card-copy">The active question will appear here automatically.</p>
          </article>
          <article class="card" id="reflections">
            <div class="card-head"><div><div class="card-kicker">Private Reflection</div><h2 class="card-title">Follow the Lesson Thread</h2></div></div>
            <p class="card-copy">Your responses stay in this browser on this phone. They are not sent to the presenter.</p>
            ${LESSON.reflectionGroups.map((group, gi) => `<section class="reflection-group">
              <h3 class="reflection-title">${escapeHTML(group.title)}</h3>
              ${group.questions.map((question, qi) => {
                const key = `kingdom_reflection_${gi}_${qi}`;
                const value = localStorage.getItem(key) || '';
                return `<div class="reflection-item"><div class="reflection-question">${escapeHTML(question)}</div><textarea class="reflection-answer" data-reflection-key="${key}" placeholder="Write your response here...">${escapeHTML(value)}</textarea></div>`;
              }).join('')}
            </section>`).join('')}
            <div class="local-note">Saved locally on this device.</div>
          </article>
        </div>
        <aside class="stack">
          <article class="card">
            <div class="card-kicker">Ask a Question</div>
            <h2 class="card-title">Send It Anonymously</h2>
            <textarea class="question-input" id="audience-question" maxlength="800" placeholder="Type your question..."></textarea>
            <button class="btn primary" data-action="submit-question">Send Question</button>
            <div class="poll-note" id="question-status"></div>
          </article>
          <article class="card">
            <div class="card-kicker">Lesson Access</div>
            <h2 class="card-title">No Account Required</h2>
            <p class="card-copy">Poll answers are anonymous. Reflection answers stay on this phone. Questions are sent without a name.</p>
          </article>
          <article class="card">
            <div class="card-kicker">Presenter Tools</div>
            <div class="route-links">
              <a class="btn" href="/admin">Admin</a>
              <a class="btn" href="/remote">Remote</a>
            </div>
          </article>
        </aside>
      </section>
    </main>`;
    updateHub();
  }

  function updateHub() {
    const slide = currentSlide();
    setText('hub-slide-count', `${clampSlide(state.current_slide) + 1} / ${LESSON.slides.length}`);
    setText('hub-now-number', String(clampSlide(state.current_slide) + 1).padStart(2, '0'));
    setText('hub-now-type', state.started ? slideTypeLabel(slide) : 'Standby');
    setText('hub-now-title', state.started ? slideTitle(slide) : 'Waiting for the presenter');
    const session = document.getElementById('session-status');
    if (session) {
      session.classList.toggle('live', !!state.started);
      session.querySelector('span:last-child').textContent = state.started ? 'Live' : 'Standby';
    }
    const card = document.getElementById('hub-poll-card');
    if (card) card.innerHTML = renderAudiencePoll();
  }

  function renderAudiencePoll() {
    const poll = currentPoll();
    if (!poll) {
      return `<div class="card-kicker">Live Poll</div><h2 class="card-title">Waiting for the presenter</h2><p class="card-copy">The active question will appear here automatically.</p>`;
    }
    const voted = isPollVoted(poll.id);
    return `<div class="card-kicker">Live Poll</div>
      <h2 class="card-title">${escapeHTML(poll.question)}</h2>
      <div class="poll-options">${poll.options.map((option, index) => `<button class="poll-option${voted ? ' voted' : ''}" data-action="vote" data-poll-id="${escapeHTML(poll.id)}" data-option-index="${index}" ${voted ? 'disabled' : ''}><span>${escapeHTML(option)}</span><span>${voted ? 'Recorded' : 'Select'}</span></button>`).join('')}</div>
      <div class="poll-note ${voted ? 'success-note' : ''}" id="audience-poll-status">${voted ? 'Your anonymous response was recorded.' : 'Choose one response. No account or name is attached.'}</div>`;
  }

  function renderProjector() {
    app.innerHTML = `<main class="output-screen" id="projector-output"><div id="projector-content"></div></main>`;
    updateProjector();
  }

  function updateProjector() {
    const root = document.getElementById('projector-content');
    if (!root) return;
    let html = '';
    if (!state.started) html = standbyHTML('Main Projector');
    else html = `<div class="slide-stage">${renderSlide(currentSlide(), clampSlide(state.current_slide))}</div>`;
    if (state.scripture_visible && state.active_scripture) {
      html += `<div class="scripture-overlay"><div class="scripture-overlay-ref">${escapeHTML(state.active_scripture.ref)} · KJV</div><div class="scripture-overlay-text">${escapeHTML(state.active_scripture.text)}</div></div>`;
    }
    if (state.poll_results_visible && currentPoll()) html += renderPollResultsOverlay(currentPoll());
    if (state.blackout) html += '<div class="output-blackout"></div>';
    root.innerHTML = html;
  }

  function renderScriptures() {
    app.innerHTML = `<main class="output-screen" id="scriptures-output"><div id="scriptures-content"></div></main>`;
    updateScriptures();
  }

  function updateScriptures() {
    const root = document.getElementById('scriptures-content');
    if (!root) return;
    if (state.blackout) {
      root.innerHTML = '<div class="output-blackout"></div>';
      return;
    }
    if (!state.scripture_visible || !state.active_scripture) {
      root.innerHTML = standbyHTML('Scripture Screen');
      return;
    }
    const long = state.active_scripture.text.length > 420 ? ' long' : '';
    root.innerHTML = `<section class="scripture-output${long}"><div><div class="scripture-output-ref">${escapeHTML(state.active_scripture.ref)} · KJV</div><div class="scripture-output-text">${escapeHTML(state.active_scripture.text)}</div></div></section>`;
  }

  function renderConfidence() {
    app.innerHTML = `<main class="confidence">
      <header class="conf-head"><div class="conf-brand">THE <span>KINGDOM</span></div><div class="conf-timer" id="conf-timer">00:00</div><div class="status-pill" id="conf-status"><span class="status-dot"></span><span>Standby</span></div></header>
      <div class="conf-grid">
        <section class="conf-main"><div class="conf-label">Current</div><div class="conf-current-title" id="conf-current-title"></div><div class="conf-current-detail" id="conf-current-detail"></div><div class="conf-notes"><div class="conf-label">Presenter Notes</div><div id="conf-notes"></div></div></section>
        <aside class="conf-side">
          <section class="conf-side-card"><div class="conf-label">Next</div><div class="conf-next-title" id="conf-next-title"></div></section>
          <section class="conf-side-card"><div class="conf-label">Active Scripture</div><div class="conf-scripture-ref" id="conf-scripture-ref"></div><div class="conf-scripture-text" id="conf-scripture-text"></div></section>
        </aside>
      </div>
      <div id="conf-blackout"></div>
    </main>`;
    updateConfidence();
  }

  function updateConfidence() {
    const slide = currentSlide();
    const next = nextSlideData();
    setText('conf-current-title', state.started ? slideTitle(slide) : 'Standby');
    setText('conf-current-detail', state.started ? slideDetail(slide) : 'Waiting for the presentation to begin.');
    setText('conf-notes', state.started ? (slide.notes || '') : 'Open admin or remote and press Start.');
    setText('conf-next-title', state.started ? slideTitle(next) : slideTitle(LESSON.slides[0]));
    setText('conf-scripture-ref', state.scripture_visible && state.active_scripture ? state.active_scripture.ref : 'No active scripture');
    setText('conf-scripture-text', state.scripture_visible && state.active_scripture ? state.active_scripture.text : 'Push a verse from admin or remote.');
    const status = document.getElementById('conf-status');
    if (status) {
      status.classList.toggle('live', !!state.started);
      status.querySelector('span:last-child').textContent = state.started ? `Slide ${state.current_slide + 1}` : 'Standby';
    }
    const blackout = document.getElementById('conf-blackout');
    if (blackout) blackout.innerHTML = state.blackout ? '<div class="output-blackout"></div>' : '';
    updateTimers();
  }

  function renderObsLower() {
    const green = query.get('green') === '1' || query.get('key') === 'green';
    app.innerHTML = `<main class="obs-screen${green ? ' green' : ''}"><div id="obs-lower-content"></div></main>`;
    updateObsLower();
  }

  function updateObsLower() {
    const root = document.getElementById('obs-lower-content');
    if (!root) return;
    if (state.blackout || !state.started) {
      root.innerHTML = '';
      return;
    }
    const slide = currentSlide();
    const ref = state.scripture_visible && state.active_scripture ? state.active_scripture.ref : `${LESSON.lessonNumber} · Slide ${state.current_slide + 1}`;
    const title = state.scripture_visible && state.active_scripture ? state.active_scripture.text : slideTitle(slide);
    const copy = state.scripture_visible && state.active_scripture ? 'King James Version' : slideDetail(slide);
    root.innerHTML = `<div class="obs-lower"><div class="obs-ref">${escapeHTML(ref)}</div><div class="obs-title">${escapeHTML(title)}</div>${copy ? `<div class="obs-copy">${escapeHTML(copy)}</div>` : ''}</div>`;
  }

  function renderObsSlides() {
    const green = query.get('green') === '1' || query.get('key') === 'green';
    app.innerHTML = `<main class="obs-screen${green ? ' green' : ''}"><div id="obs-slide-content" class="obs-slide-feed"></div></main>`;
    updateObsSlides();
  }

  function updateObsSlides() {
    const root = document.getElementById('obs-slide-content');
    if (!root) return;
    if (state.blackout || !state.started) {
      root.innerHTML = '';
      return;
    }
    root.innerHTML = renderSlide(currentSlide(), clampSlide(state.current_slide));
  }

  function renderLogin(targetRoute = route) {
    app.innerHTML = `<main class="login-screen">
      <form class="login-card" id="admin-login-form">
        <div class="eyebrow">The Kingdom</div>
        <h1 class="login-title">Presenter Access</h1>
        <p class="card-copy">Admin and remote controls require the presenter password.</p>
        <input class="login-input" id="admin-password" type="password" autocomplete="current-password" placeholder="Admin password" required>
        <button class="btn primary" type="submit">Open ${escapeHTML(targetRoute)}</button>
        <div class="poll-note" id="login-status"></div>
        <p class="local-note"><a href="/">Return to the lesson hub</a></p>
      </form>
    </main>`;
  }

  function renderAdmin() {
    const slide = currentSlide();
    app.innerHTML = `<main class="admin-shell">
      <header class="admin-head">
        <div class="admin-brand">THE <span>KINGDOM</span> · PRESENTER</div>
        <div class="admin-head-actions">
          ${connectionPill()}
          <a class="mini-btn output-link" href="/projector" target="_blank">Projector</a>
          <a class="mini-btn output-link" href="/scriptures" target="_blank">Scriptures</a>
          <a class="mini-btn output-link" href="/confidence" target="_blank">Confidence</a>
          <a class="mini-btn output-link" href="/obslowerthirds" target="_blank">OBS Lower</a>
          <a class="mini-btn output-link" href="/obsslides" target="_blank">OBS Slides</a>
          <a class="mini-btn" href="/remote" target="_blank">Remote</a>
          <button class="mini-btn" data-action="logout">Logout</button>
        </div>
      </header>
      <div class="admin-grid">
        <aside class="admin-panel"><div class="panel-title">Slides · ${LESSON.slides.length}</div><div class="slide-list" id="admin-slide-list">${renderSlideList()}</div></aside>
        <section class="admin-panel presenter-center">
          <div class="preview-wrap"><div class="preview-frame" id="preview-frame"><div id="admin-preview">${renderSlide(slide, clampSlide(state.current_slide))}</div></div></div>
          <div class="presenter-controls">
            <div class="left"><button class="btn" data-action="prev">Prev</button><button class="btn good" data-action="start">${state.started ? 'Restart' : 'Start'}</button></div>
            <div class="slide-count" id="admin-slide-count">${state.current_slide + 1} / ${LESSON.slides.length}</div>
            <div class="right"><button class="btn" data-action="next">Next</button><button class="btn danger" data-action="standby">Standby</button></div>
          </div>
          <div class="presenter-notes"><div class="card-kicker">Presenter Notes</div><div class="presenter-notes-text" id="admin-notes">${escapeHTML(slide.notes || '')}</div></div>
        </section>
        <aside class="admin-panel">
          <div class="control-tabs">
            ${['control','scriptures','polls','questions'].map(tab => `<button class="control-tab${activeAdminTab === tab ? ' active' : ''}" data-action="admin-tab" data-tab="${tab}">${tab}</button>`).join('')}
          </div>
          <div class="control-body" id="admin-control-body">${renderAdminTab()}</div>
        </aside>
      </div>
      <div id="toast" class="hidden"></div>
    </main>`;
    requestAnimationFrame(scalePreview);
    updateAdmin();
  }

  function renderSlideList() {
    return LESSON.slides.map((slide, index) => `<button class="slide-list-item${index === clampSlide(state.current_slide) ? ' active' : ''}" data-action="goto-slide" data-slide-index="${index}">
      <span class="slide-list-number">${String(index + 1).padStart(2, '0')}</span>
      <span><span class="slide-list-title">${escapeHTML(slideTitle(slide))}</span><span class="slide-list-type">${escapeHTML(slideTypeLabel(slide))}</span></span>
    </button>`).join('');
  }

  function renderAdminTab() {
    if (activeAdminTab === 'scriptures') return renderScriptureControls(false);
    if (activeAdminTab === 'polls') return renderPollControls(false);
    if (activeAdminTab === 'questions') return renderQuestionControls(false);
    return `<section class="control-section">
      <div class="control-section-title">Presentation</div>
      <div class="control-button-grid">
        <button class="btn primary" data-action="start">Start</button>
        <button class="btn" data-action="standby">Standby</button>
        <button class="btn" data-action="toggle-blackout">${state.blackout ? 'Restore Screens' : 'Blackout'}</button>
        <button class="btn" data-action="reload-outputs">Reload Outputs</button>
        <button class="btn" data-action="clear-scripture">Clear Scripture</button>
        <button class="btn danger" data-action="clear-all">Clear All</button>
      </div>
    </section>
    <section class="control-section">
      <div class="control-section-title">Output URLs</div>
      <div class="route-links">
        <a class="mini-btn" href="/projector" target="_blank">/projector</a>
        <a class="mini-btn" href="/scriptures" target="_blank">/scriptures</a>
        <a class="mini-btn" href="/confidence" target="_blank">/confidence</a>
        <a class="mini-btn" href="/obslowerthirds" target="_blank">/obslowerthirds</a>
        <a class="mini-btn" href="/obsslides" target="_blank">/obsslides</a>
        <a class="mini-btn" href="/remote" target="_blank">/remote</a>
      </div>
    </section>
    <section class="control-section"><div class="control-section-title">Live Poll</div>${renderActivePollSummary()}</section>
    <section class="control-section"><div class="control-section-title">Question Inbox</div><div>${questions.filter(q => q.status === 'new').length} new question(s)</div><div class="question-actions"><button class="mini-btn" data-action="admin-tab" data-tab="questions">Open Inbox</button></div></section>`;
  }

  function renderScriptureControls(remote = false) {
    return `<section class="control-section"><div class="control-section-title">KJV Scripture Bank</div>
      ${LESSON.scriptures.map(sc => `<article class="scripture-card"><div class="scripture-card-ref">${escapeHTML(sc.ref)}</div><div class="scripture-card-text">${escapeHTML(sc.text)}</div><div class="scripture-actions"><button class="mini-btn" data-action="push-scripture" data-scripture-id="${escapeHTML(sc.id)}">Push</button>${remote ? '' : `<button class="mini-btn" data-action="preview-scripture" data-scripture-id="${escapeHTML(sc.id)}">Preview</button>`}</div></article>`).join('')}
      <button class="btn danger" data-action="clear-scripture">Clear Scripture Screens</button>
    </section>`;
  }

  function renderPollControls(remote = false) {
    return `<section class="control-section"><div class="control-section-title">Lesson Polls</div>
      ${LESSON.polls.map(poll => {
        const isActive = state.active_poll_id === poll.id;
        const results = pollResults.get(poll.id) || [];
        return `<article class="poll-admin-card"><div class="poll-admin-question">${escapeHTML(poll.question)}</div>
          <div class="poll-result-mini">${renderMiniResults(poll, results)}</div>
          <div class="poll-admin-actions">
            <button class="mini-btn${isActive ? ' good' : ''}" data-action="launch-poll" data-poll-id="${escapeHTML(poll.id)}">${isActive ? 'Live' : 'Launch'}</button>
            ${remote ? '' : `<button class="mini-btn" data-action="show-poll-results" data-poll-id="${escapeHTML(poll.id)}">Show Results</button><button class="mini-btn" data-action="hide-poll-results">Hide Results</button>`}
            <button class="mini-btn" data-action="close-poll" data-poll-id="${escapeHTML(poll.id)}">Close</button>
            ${remote ? '' : `<button class="mini-btn" data-action="reset-poll" data-poll-id="${escapeHTML(poll.id)}">Reset</button>`}
          </div>
        </article>`;
      }).join('')}
    </section>`;
  }

  function renderMiniResults(poll, results) {
    const counts = new Map(results.map(row => [Number(row.option_index), Number(row.vote_count)]));
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    if (!total) return '<div class="poll-note">No responses yet.</div>';
    return poll.options.map((option, index) => `<div class="poll-result-mini-row"><span>${escapeHTML(option)}</span><strong>${counts.get(index) || 0}</strong></div>`).join('') + `<div class="poll-note">${total} total</div>`;
  }

  function renderActivePollSummary() {
    const poll = currentPoll();
    if (!poll) return '<div class="empty-state">No live poll.</div>';
    return `<div class="poll-admin-question">${escapeHTML(poll.question)}</div>${renderMiniResults(poll, pollResults.get(poll.id) || [])}`;
  }

  function renderQuestionControls(fullPage = false) {
    const filtered = fullPage ? questions : questions.slice(0, 20);
    if (!filtered.length) return '<div class="empty-state">No questions submitted yet.</div>';
    return filtered.map(item => `<article class="question-card"><div class="question-text">${escapeHTML(item.text)}</div><div class="question-meta">${escapeHTML(formatDate(item.created_at))} · ${escapeHTML(item.status || 'new')}</div><div class="question-actions">
      <button class="mini-btn" data-action="question-status" data-question-id="${escapeHTML(item.id)}" data-status="answered">Answered</button>
      <button class="mini-btn" data-action="question-status" data-question-id="${escapeHTML(item.id)}" data-status="hidden">Hide</button>
      <button class="mini-btn" data-action="question-status" data-question-id="${escapeHTML(item.id)}" data-status="new">Restore</button>
    </div></article>`).join('');
  }

  function updateAdmin() {
    if (route !== 'admin' || !adminAuthenticated) return;
    const list = document.getElementById('admin-slide-list');
    if (list) list.innerHTML = renderSlideList();
    const preview = document.getElementById('admin-preview');
    if (preview) preview.innerHTML = renderSlide(currentSlide(), clampSlide(state.current_slide));
    setText('admin-slide-count', `${state.current_slide + 1} / ${LESSON.slides.length}`);
    setText('admin-notes', currentSlide().notes || '');
    const control = document.getElementById('admin-control-body');
    if (control) control.innerHTML = renderAdminTab();
    requestAnimationFrame(scalePreview);
  }

  function scalePreview() {
    const frame = document.getElementById('preview-frame');
    const slide = frame?.querySelector('.slide');
    if (!frame || !slide) return;
    const scale = Math.min(frame.clientWidth / 1920, frame.clientHeight / 1080);
    slide.style.transform = `scale(${scale})`;
  }

  function renderRemote() {
    const slide = currentSlide();
    app.innerHTML = `<main class="remote-shell">
      <header class="remote-head">
        <div class="remote-status"><div class="admin-brand">THE <span>KINGDOM</span></div>${connectionPill()}</div>
        <div class="remote-current"><div class="remote-current-number" id="remote-number">${state.current_slide + 1}/${LESSON.slides.length}</div><div class="remote-current-title" id="remote-title">${escapeHTML(slideTitle(slide))}</div></div>
      </header>
      <div class="remote-main">
        <div class="remote-nav"><button class="btn" data-action="prev">← Prev</button><button class="btn primary" data-action="next">Next →</button></div>
        <div class="remote-quick"><button class="btn good" data-action="start">Start</button><button class="btn" data-action="standby">Standby</button><button class="btn" data-action="toggle-blackout">Blackout</button><button class="btn danger" data-action="clear-all">Clear All</button></div>
        <details class="remote-section" open><summary>Scripture Bank</summary><div class="remote-section-body">${renderScriptureControls(true)}</div></details>
        <details class="remote-section"><summary>Polls</summary><div class="remote-section-body" id="remote-polls">${renderPollControls(true)}</div></details>
        <details class="remote-section"><summary>Slide Jump</summary><div class="remote-section-body"><div class="slide-list">${renderSlideList()}</div></div></details>
        <div class="route-links"><a class="btn" href="/admin">Full Admin</a><button class="btn" data-action="logout">Logout</button></div>
      </div>
    </main>`;
    updateRemote();
  }

  function updateRemote() {
    if (route !== 'remote' || !adminAuthenticated) return;
    setText('remote-number', `${state.current_slide + 1}/${LESSON.slides.length}`);
    setText('remote-title', state.started ? slideTitle(currentSlide()) : 'Standby');
    const polls = document.getElementById('remote-polls');
    if (polls) polls.innerHTML = renderPollControls(true);
    document.querySelectorAll('.remote-shell .slide-list').forEach(el => { el.innerHTML = renderSlideList(); });
  }

  function renderQuestionsPage() {
    app.innerHTML = `<main class="data-page"><header class="topbar"><a class="brand" href="/admin"><span>The</span> Kingdom <small>Questions</small></a><div><button class="mini-btn" data-action="refresh-questions">Refresh</button> <button class="mini-btn" data-action="logout">Logout</button></div></header><div class="data-inner"><div class="eyebrow">Presenter Inbox</div><h1 class="data-title">Audience Questions</h1><div class="data-grid"><section class="card"><div class="card-kicker">New</div><div id="questions-new"></div></section><section class="card"><div class="card-kicker">Answered / Hidden</div><div id="questions-archive"></div></section></div></div></main>`;
    updateQuestionsPage();
  }

  function updateQuestionsPage() {
    const newBox = document.getElementById('questions-new');
    const archive = document.getElementById('questions-archive');
    if (newBox) {
      const fresh = questions.filter(q => q.status === 'new');
      newBox.innerHTML = fresh.length ? fresh.map(q => renderQuestionControlsItem(q)).join('') : '<div class="empty-state">No new questions.</div>';
    }
    if (archive) {
      const old = questions.filter(q => q.status !== 'new');
      archive.innerHTML = old.length ? old.map(q => renderQuestionControlsItem(q)).join('') : '<div class="empty-state">No answered questions.</div>';
    }
  }

  function renderQuestionControlsItem(item) {
    return `<article class="question-card"><div class="question-text">${escapeHTML(item.text)}</div><div class="question-meta">${escapeHTML(formatDate(item.created_at))} · ${escapeHTML(item.status || 'new')}</div><div class="question-actions"><button class="mini-btn" data-action="question-status" data-question-id="${escapeHTML(item.id)}" data-status="answered">Answered</button><button class="mini-btn" data-action="question-status" data-question-id="${escapeHTML(item.id)}" data-status="hidden">Hide</button><button class="mini-btn" data-action="question-status" data-question-id="${escapeHTML(item.id)}" data-status="new">Restore</button></div></article>`;
  }

  function renderPollsPage() {
    app.innerHTML = `<main class="data-page"><header class="topbar"><a class="brand" href="/admin"><span>The</span> Kingdom <small>Polls</small></a><div><button class="mini-btn" data-action="refresh-polls">Refresh</button> <button class="mini-btn" data-action="logout">Logout</button></div></header><div class="data-inner"><div class="eyebrow">Live Responses</div><h1 class="data-title">Poll Results</h1><div class="data-grid" id="polls-page-grid"></div></div></main>`;
    updatePollsPage();
  }

  function updatePollsPage() {
    const grid = document.getElementById('polls-page-grid');
    if (!grid) return;
    grid.innerHTML = LESSON.polls.map(poll => `<section class="card"><div class="card-kicker">${state.active_poll_id === poll.id ? 'Live' : 'Lesson Poll'}</div><h2 class="card-title">${escapeHTML(poll.question)}</h2>${renderLargeResults(poll)}<div class="poll-admin-actions"><button class="mini-btn" data-action="launch-poll" data-poll-id="${escapeHTML(poll.id)}">Launch</button><button class="mini-btn" data-action="show-poll-results" data-poll-id="${escapeHTML(poll.id)}">Show on Projector</button><button class="mini-btn" data-action="close-poll" data-poll-id="${escapeHTML(poll.id)}">Close</button><button class="mini-btn" data-action="reset-poll" data-poll-id="${escapeHTML(poll.id)}">Reset</button></div></section>`).join('');
  }

  function renderLargeResults(poll) {
    const rows = pollResults.get(poll.id) || [];
    const counts = new Map(rows.map(row => [Number(row.option_index), Number(row.vote_count)]));
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return `<div class="poll-results-list">${poll.options.map((option, index) => {
      const count = counts.get(index) || 0;
      const pct = total ? Math.round((count / total) * 100) : 0;
      return `<div class="poll-result-row"><div class="poll-result-top"><span>${escapeHTML(option)}</span><span>${count} · ${pct}%</span></div><div class="poll-result-track"><div class="poll-result-fill" style="width:${pct}%"></div></div></div>`;
    }).join('')}<div class="poll-note">${total} response${total === 1 ? '' : 's'}</div></div>`;
  }

  function renderPollResultsOverlay(poll) {
    return `<div class="poll-results-overlay"><div class="poll-results-card"><div class="slide-kicker">Live Poll Results</div><div class="poll-results-question">${escapeHTML(poll.question)}</div>${renderLargeResults(poll)}</div></div>`;
  }

  function renderRoute() {
    if (ADMIN_ROUTES.has(route) && !adminAuthenticated) {
      renderLogin(route);
      return;
    }
    switch (route) {
      case 'projector': renderProjector(); break;
      case 'scriptures': renderScriptures(); break;
      case 'confidence': renderConfidence(); break;
      case 'obslowerthirds': renderObsLower(); break;
      case 'obsslides': renderObsSlides(); break;
      case 'admin': renderAdmin(); break;
      case 'remote': renderRemote(); break;
      case 'questions': renderQuestionsPage(); break;
      case 'polls': renderPollsPage(); break;
      default: renderHub(); break;
    }
    updateConnectionUI();
  }

  function updateView() {
    if (!app.firstElementChild) return renderRoute();
    if (route === 'hub') updateHub();
    if (route === 'projector') updateProjector();
    if (route === 'scriptures') updateScriptures();
    if (route === 'confidence') updateConfidence();
    if (route === 'obslowerthirds') updateObsLower();
    if (route === 'obsslides') updateObsSlides();
    if (route === 'admin') updateAdmin();
    if (route === 'remote') updateRemote();
    if (route === 'questions') updateQuestionsPage();
    if (route === 'polls') updatePollsPage();
    updateConnectionUI();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatDate(value) {
    if (!value) return 'Just now';
    try { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch { return String(value); }
  }

  function updateTimers() {
    const timer = document.getElementById('conf-timer');
    if (!timer) return;
    if (!state.started || !state.started_at) {
      timer.textContent = '00:00';
      return;
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(state.started_at).getTime()) / 1000));
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    timer.textContent = hours ? `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function updateConnectionUI(mode = null) {
    if (mode) connectionMode = mode;
    const label = document.getElementById('connection-label');
    const pill = document.getElementById('connection-pill');
    if (!label || !pill) return;
    const connected = ['realtime', 'polling', 'live'].includes(connectionMode) && initialStateLoaded;
    const error = connectionMode === 'error';
    pill.classList.toggle('live', connected);
    pill.classList.toggle('error', error);
    label.textContent = connected
      ? (connectionMode === 'realtime' ? 'Live Sync' : 'Synced')
      : error ? 'Offline' : 'Connecting';
  }

  async function loadPublicConfig() {
    let cfg = window.KINGDOM_CONFIG || {};
    if (cfg.supabaseUrl && (cfg.supabaseAnonKey || cfg.supabasePublishableKey)) return cfg;
    try {
      const response = await fetch('/api/config', { cache: 'no-store' });
      if (!response.ok) return cfg;
      const remote = await response.json();
      cfg = {
        supabaseUrl: remote.supabaseUrl || cfg.supabaseUrl || '',
        supabaseAnonKey: remote.supabaseAnonKey || remote.supabasePublishableKey || cfg.supabaseAnonKey || cfg.supabasePublishableKey || ''
      };
    } catch (error) {
      console.warn('Public config unavailable', error);
    }
    return cfg;
  }

  async function fetchPublicState() {
    if (statePollInFlight) return false;
    statePollInFlight = true;
    try {
      const response = await fetch(`/api/public-state?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.state) throw new Error(body.error || 'State sync unavailable');
      applyIncomingState(body.state, false);
      initialStateLoaded = true;
      if (!realtimeSubscribed) updateConnectionUI('polling');
      return true;
    } catch (error) {
      console.warn('Public state polling unavailable', error);
      if (!initialStateLoaded) updateConnectionUI('error');
      return false;
    } finally {
      statePollInFlight = false;
    }
  }

  function statePollDelay() {
    if (document.hidden) return 1800;
    return realtimeSubscribed ? 2000 : 300;
  }

  function scheduleNextStatePoll(delay = statePollDelay()) {
    clearTimeout(statePollTimer);
    if (statePollStopped) return;
    statePollTimer = setTimeout(async () => {
      await fetchPublicState();
      scheduleNextStatePoll();
    }, delay);
  }

  function startStatePolling() {
    statePollStopped = false;
    fetchPublicState().finally(() => scheduleNextStatePoll());
  }

  async function initRealtime() {
    try {
      const cfg = await loadPublicConfig();
      const publicKey = cfg.supabaseAnonKey || cfg.supabasePublishableKey || '';
      if (!cfg.supabaseUrl || !publicKey || !window.supabase) {
        if (!initialStateLoaded) updateConnectionUI('polling');
        return;
      }
      supabase = window.supabase.createClient(cfg.supabaseUrl, publicKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const { data, error } = await supabase.from('presentation_state').select('*').eq('id', STATE_ID).single();
      if (error) throw error;
      applyIncomingState(data, false);
      initialStateLoaded = true;
      updateConnectionUI('polling');
      realtimeChannel = supabase.channel('kingdom-presentation-state')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'presentation_state', filter: `id=eq.${STATE_ID}` }, payload => {
          if (payload.new) applyIncomingState(payload.new, false);
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            realtimeSubscribed = true;
            updateConnectionUI('realtime');
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            realtimeSubscribed = false;
            updateConnectionUI(initialStateLoaded ? 'polling' : 'error');
          }
        });
      schedulePollRefresh();
    } catch (error) {
      console.warn('Realtime unavailable; polling remains active', error);
      realtimeSubscribed = false;
      updateConnectionUI(initialStateLoaded ? 'polling' : 'error');
    }
  }

  function initBroadcastChannel() {
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = event => {
        if (event.data?.type === 'state') applyIncomingState(event.data.state, false);
      };
    } catch (error) {
      console.warn('BroadcastChannel unavailable', error);
    }
  }

  function applyIncomingState(next, broadcast = false) {
    if (!next) return false;
    const incomingVersion = String(next.updated_at || '');
    const currentVersion = String(state.updated_at || '');
    const sameStoredVersion = !broadcast && initialStateLoaded && incomingVersion && incomingVersion === currentVersion;
    if (sameStoredVersion) return false;
    const oldReload = Number(state.reload_token || 0);
    state = {
      ...state,
      ...next,
      current_slide: clampSlide(next.current_slide ?? state.current_slide),
      active_scripture: parseJSONMaybe(next.active_scripture ?? state.active_scripture)
    };
    if (broadcast && bc) bc.postMessage({ type: 'state', state });
    updateView();
    schedulePollRefresh();
    const newReload = Number(state.reload_token || 0);
    if (initialStateLoaded && OUTPUT_ROUTES.has(route) && newReload > oldReload) location.reload();
    return true;
  }

  function parseJSONMaybe(value) {
    if (!value || typeof value === 'object') return value || null;
    try { return JSON.parse(value); } catch { return null; }
  }

  async function patchState(patch) {
    const next = { ...state, ...patch, current_slide: clampSlide(patch.current_slide ?? state.current_slide), updated_at: new Date().toISOString() };
    applyIncomingState(next, true);
    try {
      const response = await fetch('/api/admin-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'State update failed');
      if (body.state) applyIncomingState(body.state, true);
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function startPresentation() {
    await patchState({ current_slide: 0, started: true, started_at: new Date().toISOString(), blackout: false });
  }

  async function standbyPresentation() {
    await patchState({ started: false, current_slide: 0, blackout: false, scripture_visible: false, active_scripture: null, active_poll_id: null, poll_results_visible: false });
  }

  async function clearAll() {
    await patchState({ blackout: false, scripture_visible: false, active_scripture: null, active_poll_id: null, poll_results_visible: false });
  }

  async function pushScripture(id) {
    const scripture = LESSON.scriptures.find(item => item.id === id);
    if (!scripture) return;
    await patchState({ active_scripture: scripture, scripture_visible: true });
  }

  async function clearScripture() {
    await patchState({ scripture_visible: false, active_scripture: null });
  }

  async function launchPoll(id) {
    const poll = LESSON.polls.find(item => item.id === id);
    if (!poll) return;
    try {
      const response = await fetch('/api/admin-poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'launch', poll }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Poll launch failed');
      applyIncomingState(body.state || { ...state, active_poll_id: id, poll_results_visible: false }, true);
      await refreshPollResults(id);
      showToast('Poll is live.');
    } catch (error) { showToast(error.message, true); }
  }

  async function pollAction(action, id = null) {
    const poll = id ? LESSON.polls.find(item => item.id === id) : currentPoll();
    try {
      const response = await fetch('/api/admin-poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, poll_id: id || poll?.id || null, poll }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Poll action failed');
      if (body.state) applyIncomingState(body.state, true);
      if (id) await refreshPollResults(id);
      showToast(action.replaceAll('_', ' '));
    } catch (error) { showToast(error.message, true); }
  }

  async function submitVote(pollId, optionIndex, button) {
    const status = document.getElementById('audience-poll-status');
    if (button) button.classList.add('selected');
    if (status) status.textContent = 'Saving response...';
    try {
      const response = await fetch('/api/poll-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, option_index: Number(optionIndex), voter_token: deviceToken() })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Could not save response');
      setPollVoted(pollId);
      updateHub();
      await refreshPollResults(pollId);
    } catch (error) {
      if (status) { status.textContent = error.message; status.className = 'poll-note error-note'; }
      if (button) button.classList.remove('selected');
    }
  }

  async function submitQuestion() {
    const input = document.getElementById('audience-question');
    const status = document.getElementById('question-status');
    const text = input?.value.trim() || '';
    if (!text) {
      if (status) { status.textContent = 'Type a question first.'; status.className = 'poll-note error-note'; }
      return;
    }
    if (status) { status.textContent = 'Sending...'; status.className = 'poll-note'; }
    try {
      const response = await fetch('/api/question-submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Could not send question');
      input.value = '';
      if (status) { status.textContent = 'Question sent anonymously.'; status.className = 'poll-note success-note'; }
    } catch (error) {
      if (status) { status.textContent = error.message; status.className = 'poll-note error-note'; }
    }
  }

  async function refreshPollResults(id = state.active_poll_id) {
    if (!id) return;
    try {
      let rows = null;
      if (supabase) {
        const { data, error } = await supabase.rpc('get_poll_results', { p_poll_id: id });
        if (!error) rows = Array.isArray(data) ? data : [];
      }
      if (rows === null) {
        const endpoint = adminAuthenticated ? '/api/admin-poll-results' : '/api/public-poll-results';
        const response = await fetch(`${endpoint}?poll_id=${encodeURIComponent(id)}&t=${Date.now()}`, { cache: 'no-store' });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Poll results failed');
        rows = Array.isArray(body.results) ? body.results : [];
      }
      pollResults.set(id, rows);
      updateView();
    } catch (error) {
      console.warn('Poll result refresh failed', error);
    }
  }

  async function refreshAllPollResults() {
    await Promise.all(LESSON.polls.map(poll => refreshPollResults(poll.id)));
    updateView();
  }

  function schedulePollRefresh() {
    clearInterval(pollRefreshTimer);
    const shouldRefresh = !!state.active_poll_id || route === 'polls' || (route === 'admin' && activeAdminTab === 'polls');
    if (!shouldRefresh) return;
    refreshPollResults(state.active_poll_id || LESSON.polls[0].id);
    pollRefreshTimer = setInterval(() => {
      if (route === 'polls' || (route === 'admin' && activeAdminTab === 'polls')) refreshAllPollResults();
      else refreshPollResults(state.active_poll_id);
    }, 1800);
  }

  async function refreshQuestions() {
    if (!adminAuthenticated) return;
    try {
      const response = await fetch('/api/admin-questions', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Question fetch failed');
      questions = Array.isArray(body.questions) ? body.questions : [];
      updateView();
    } catch (error) { console.warn(error); }
  }

  async function updateQuestionStatus(id, status) {
    try {
      const response = await fetch('/api/admin-questions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Question update failed');
      await refreshQuestions();
    } catch (error) { showToast(error.message, true); }
  }

  function scheduleQuestionRefresh() {
    clearInterval(questionRefreshTimer);
    if (!adminAuthenticated || !['admin', 'questions'].includes(route)) return;
    refreshQuestions();
    questionRefreshTimer = setInterval(refreshQuestions, 3000);
  }

  async function checkAdminSession() {
    if (!ADMIN_ROUTES.has(route)) return false;
    try {
      const response = await fetch('/api/admin-session', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      adminAuthenticated = response.ok && body.authenticated === true;
      return adminAuthenticated;
    } catch {
      adminAuthenticated = false;
      return false;
    }
  }

  async function loginAdmin(password) {
    const status = document.getElementById('login-status');
    if (status) status.textContent = 'Checking...';
    try {
      const response = await fetch('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Login failed');
      adminAuthenticated = true;
      renderRoute();
      scheduleQuestionRefresh();
      refreshAllPollResults();
    } catch (error) {
      if (status) { status.textContent = error.message; status.className = 'poll-note error-note'; }
    }
  }

  async function logoutAdmin() {
    try { await fetch('/api/admin-logout', { method: 'POST' }); } catch {}
    adminAuthenticated = false;
    location.href = '/';
  }

  function showToast(message, isError = false) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.className = '';
    Object.assign(toast.style, {
      position: 'fixed', right: '18px', bottom: '18px', zIndex: '9999',
      padding: '12px 14px', border: `1px solid ${isError ? 'rgba(214,96,80,.7)' : 'rgba(119,184,154,.7)'}`,
      background: 'rgba(5,8,12,.94)', color: isError ? '#ffaaa0' : '#a9dbc4',
      fontFamily: 'var(--condensed)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '.08em'
    });
    toast.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 2500);
  }

  app.addEventListener('submit', event => {
    if (event.target.id === 'admin-login-form') {
      event.preventDefault();
      loginAdmin(document.getElementById('admin-password')?.value || '');
    }
  });

  app.addEventListener('input', event => {
    const key = event.target.dataset?.reflectionKey;
    if (key) localStorage.setItem(key, event.target.value);
  });

  app.addEventListener('click', async event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'scroll-reflections') document.getElementById('reflections')?.scrollIntoView({ behavior: 'smooth' });
    if (action === 'vote') await submitVote(target.dataset.pollId, target.dataset.optionIndex, target);
    if (action === 'submit-question') await submitQuestion();
    if (action === 'prev') await patchState({ current_slide: clampSlide(state.current_slide - 1), started: true });
    if (action === 'next') await patchState({ current_slide: clampSlide(state.current_slide + 1), started: true });
    if (action === 'goto-slide') await patchState({ current_slide: clampSlide(target.dataset.slideIndex), started: true });
    if (action === 'start') await startPresentation();
    if (action === 'standby') await standbyPresentation();
    if (action === 'toggle-blackout') await patchState({ blackout: !state.blackout });
    if (action === 'clear-scripture') await clearScripture();
    if (action === 'clear-all') await clearAll();
    if (action === 'reload-outputs') await patchState({ reload_token: Number(state.reload_token || 0) + 1 });
    if (action === 'push-scripture' || action === 'preview-scripture') await pushScripture(target.dataset.scriptureId);
    if (action === 'launch-poll') await launchPoll(target.dataset.pollId);
    if (action === 'show-poll-results') {
      if (target.dataset.pollId && state.active_poll_id !== target.dataset.pollId) await launchPoll(target.dataset.pollId);
      await pollAction('show_results', target.dataset.pollId || state.active_poll_id);
    }
    if (action === 'hide-poll-results') await pollAction('hide_results', state.active_poll_id);
    if (action === 'close-poll') await pollAction('close', target.dataset.pollId);
    if (action === 'reset-poll') await pollAction('reset', target.dataset.pollId);
    if (action === 'admin-tab') {
      activeAdminTab = target.dataset.tab;
      updateAdmin();
      if (activeAdminTab === 'questions') refreshQuestions();
      if (activeAdminTab === 'polls') refreshAllPollResults();
      schedulePollRefresh();
    }
    if (action === 'question-status') await updateQuestionStatus(target.dataset.questionId, target.dataset.status);
    if (action === 'refresh-questions') await refreshQuestions();
    if (action === 'refresh-polls') await refreshAllPollResults();
    if (action === 'logout') await logoutAdmin();
  });

  window.addEventListener('resize', scalePreview);
  document.addEventListener('visibilitychange', () => scheduleNextStatePoll(0));
  window.addEventListener('beforeunload', () => {
    statePollStopped = true;
    clearTimeout(statePollTimer);
  });
  document.addEventListener('keydown', event => {
    if (!adminAuthenticated || !['admin', 'remote'].includes(route)) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); patchState({ current_slide: clampSlide(state.current_slide + 1), started: true }); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); patchState({ current_slide: clampSlide(state.current_slide - 1), started: true }); }
    if (event.key.toLowerCase() === 'b') patchState({ blackout: !state.blackout });
  });
  if (OUTPUT_ROUTES.has(route)) {
    document.addEventListener('dblclick', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    });
  }
  setInterval(updateTimers, 500);

  async function init() {
    if (!LESSON || !Array.isArray(LESSON.slides)) {
      app.textContent = 'Lesson data failed to load.';
      return;
    }
    initBroadcastChannel();
    if (ADMIN_ROUTES.has(route)) await checkAdminSession();
    renderRoute();
    scheduleQuestionRefresh();
    if (adminAuthenticated) refreshAllPollResults();
    startStatePolling();
    await initRealtime();
  }

  init();
})();
