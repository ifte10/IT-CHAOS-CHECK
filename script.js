'use strict';

const scene = document.getElementById('scene');
const progressFill = document.getElementById('progress-fill');
const progress = document.getElementById('progress');
const stepStatus = document.getElementById('step-status');
const bottomStatus = document.getElementById('bottom-status');
const toast = document.getElementById('toast');
const params = new URLSearchParams(window.location.search);
const inviter = (params.get('challengedBy') || '').trim().slice(0, 24);
const ticket = Math.floor(100000 + Math.random() * 899999);
document.getElementById('ticket-number').textContent = `TICKET #${ticket}`;

const state = {
  step: 0, name: '', wifi: null, skill: 35, security: null,
  scamClicks: 0, printerClicks: 0, printerDone: false, sound: false
};
let audio = null;
let toastTimer = null;

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
}
function sound(freq = 570, duration = .09) {
  if (!state.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audio.currentTime);
    gain.gain.setValueAtTime(.07, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch (_) { /* Optional sound; the game works without it. */ }
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3300);
}
function goto(step) {
  state.step = Math.max(0, Math.min(5, step));
  sound(420 + step * 100);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function btn(text, id, type = 'primary', extra = '') {
  return `<button type="button" class="btn btn-${type}" data-action="${id}" ${extra}>${text}</button>`;
}
function heading(kicker, title, copy) {
  return `<div class="kicker">${kicker}</div><h1 class="headline">${title}</h1><p class="copy">${copy}</p>`;
}

const wifiOptions = [
  { emoji:'🔌', title:'Turn it off and on', desc:'A timeless, spiritually powerful ritual.', reply:'You have the soul of an IT technician.', score:3 },
  { emoji:'📣', title:'Yell “HELLO IT?”', desc:'At the router. Loudly. For dominance.', reply:'The router has reported you to HR.', score:0 },
  { emoji:'📱', title:'Use mobile data', desc:'Pretend the problem does not exist.', reply:'A masterclass in strategic avoidance.', score:1 },
  { emoji:'🧯', title:'Open 47 support tickets', desc:'One problem deserves an entire backlog.', reply:'Congratulations, you are upper management.', score:2 }
];

function drawIntro() {
  const from = inviter ? `<span class="pill">⚡ CHALLENGED BY ${escapeHtml(inviter.toUpperCase())}</span>` : '<span class="pill">⚡ TOTALLY LEGIT IT ASSESSMENT</span>';
  return `<div class="scene-inner desktop-layout">
    <div><div class="kicker">Welcome to the helpdesk</div>${from}
      <h1 class="hero-title">YOUR BRAIN<br>HAS <span class="highlight">404</span><br>ERRORS.</h1>
      <p class="copy">Six questions. One printer. A scientifically questionable diagnosis of your IT personality. Your dignity may not survive.</p>
      <label class="text-field" for="player-name">FIRST, WHAT SHOULD WE CALL YOU?</label>
      <div class="input-row"><input id="player-name" class="name-input" type="text" maxlength="24" autocomplete="nickname" placeholder="e.g. Lord of Wi-Fi" value="${escapeHtml(state.name)}">${btn('START DIAGNOSIS ↗','start')}</div>
      <p class="subnote">No sign-up. No downloads. Your answers stay in this browser session.</p>
    </div>
    <div class="sticker-canvas" aria-hidden="true"><div class="sticker"><span class="sticker-face">💻</span></div><span class="float-label">SYSTEM: COOKED</span><span class="float-label bottom">99+ ERRORS</span></div>
  </div>`;
}
function drawWifi() {
  const opts = wifiOptions.map((item, i) => `<button type="button" class="choice ${state.wifi === i ? 'selected' : ''}" data-action="wifi" data-index="${i}" aria-pressed="${state.wifi === i}"><span class="choice-emoji" aria-hidden="true">${item.emoji}</span><span><span class="choice-title">${item.title}</span><span class="choice-desc">${item.desc}</span></span>${state.wifi === i ? '<span class="choice-tick">✓</span>' : ''}</button>`).join('');
  return `<div class="scene-inner">${heading('Question 01 · Incident response','THE WI-FI <span class="pink">DIED.</span>','You are two minutes into an important meeting. The internet has chosen violence. What is your first move?')}
    <div class="choice-grid">${opts}</div>
    <div class="feedback" ${state.wifi === null ? 'hidden' : ''}>${state.wifi === null ? '' : `> ${wifiOptions[state.wifi].reply}`}</div>
    <div class="button-row">${btn('NEXT INCIDENT →','next','primary',state.wifi === null ? 'disabled' : '')}${btn('← BACK','back','secondary')}</div>
  </div>`;
}
function skillVerdict(n) {
  if (n <= 15) return ['🐣','Can you find the power button first?'];
  if (n <= 40) return ['🫠','Expert in clearing cache and hoping.'];
  if (n <= 70) return ['🧠','You have Googled a Stack Overflow answer.'];
  if (n <= 89) return ['🤖','The keyboard fears your power.'];
  return ['👑','Calm down. You are not the entire cloud.'];
}
function drawSkill() {
  const [emoji, verdict] = skillVerdict(state.skill);
  return `<div class="scene-inner">${heading('Question 02 · Confidence audit','HOW <span class="highlight">TECHNICAL</span><br>ARE YOU?','Drag the slider. There are no wrong answers, only wildly overconfident ones.')}
    <div class="range-panel"><div class="meter-top"><div><span id="meter-value" class="meter-value">${state.skill}</span><span class="meter-max"> / 100</span></div><span id="meter-face" class="meter-face" aria-hidden="true">${emoji}</span></div>
      <label for="skill-range" class="sr-only">Your self-rated tech skill from 0 to 100</label><input class="range-input" id="skill-range" type="range" min="0" max="100" value="${state.skill}" style="--fill:${state.skill}%">
      <div class="meter-labels"><span>WHAT IS A PDF?</span><span>I AM THE MAINFRAME</span></div>
      <div class="verdict" id="skill-verdict">“${verdict}”</div></div>
    <div class="button-row">${btn('SUBMIT MY DELUSION →','next')}${btn('← BACK','back','secondary')}</div>
  </div>`;
}
function drawSecurity() {
  return `<div class="scene-inner">${heading('Question 03 · Cybersecurity','A VERY <span class="pink">NORMAL</span><br>EMAIL ARRIVED.','This is a real-world simulation* and definitely not a trap. *It is a trap.')}
    <div class="warning-card"><div class="warning-top">⚠ EXTERNAL SENDER · SUPER TRUSTWORTHY</div>
      <div class="warning-header">SUBJECT: You won 8TB of FREE RAM 🥳</div>
      <p class="warning-copy">dear valued human,<br>pls click <span class="fake-link">www.not-a-virus-totally.biz</span> to unlock FREE RAM for your laptop.<br><strong>password:</strong> kindly send us your password. thx xoxo<br><br>— prince of microsoft customer happiness</p>
    </div><p class="copy" style="margin-bottom:8px">What's the professional response?</p>
    <div class="button-row security-buttons">${btn('REPORT PHISHING 🛡️','report')}${btn('GIMME THE FREE RAM 😈','scam','secondary')}</div>
    <div class="mini-dialog" id="security-gag" aria-live="polite">${state.scamClicks > 0 ? scamMessages[Math.min(state.scamClicks - 1, scamMessages.length - 1)] : ''}</div>
    ${btn('← BACK','back','secondary','style="margin-top:8px"')}
  </div>`;
}
const scamMessages = [
  'ERROR: You cannot download hardware from an email. 💀',
  'WINDOWS DEFENDER: Brother, please.',
  'Your cybersecurity training has started crying.',
  'Fine. The free RAM is imaginary. Please report it. 😭'
];
function drawPrinter() {
  const lines = [
    'It says PAPER JAM. There is no paper.',
    'You restarted it. It is now printing in Latin.',
    'The printer has requested annual leave.',
    'SUCCESS! It printed one page. It is a photo of you crying.'
  ];
  const num = state.printerClicks;
  return `<div class="scene-inner">${heading('Question 04 · Final boss','THE <span class="pink">PRINTER</span><br>IS SENTIENT.','All IT careers eventually lead to this moment. You must face your greatest enemy.')}
    <div class="printer-zone"><div class="printer-graphic"><span class="printer-emoji" aria-hidden="true">${state.printerDone ? '🖨️✨' : '🖨️'}</span><span class="printer-error">${state.printerDone ? 'STATUS: TECHNICALLY FIXED' : 'ERROR 0x000LOL'}</span></div>
      <div><div class="printer-status">SUPPORT ATTEMPT ${String(Math.min(num,3)).padStart(2,'0')} / 03</div><p class="printer-message">${lines[Math.min(num,3)]}</p>
      <div class="attempt-row" aria-label="${num} out of 3 fixes tried"><span class="attempt ${num>=1?'done':''}"></span><span class="attempt ${num>=2?'done':''}"></span><span class="attempt ${num>=3?'done':''}"></span></div>
      ${state.printerDone ? btn('REVEAL MY IT DESTINY ✨','next') : btn(num === 0 ? 'FIX THE PRINTER 🔧' : num === 1 ? 'TRY TURNING IT OFF AGAIN ↻' : 'APPEASE THE PRINTER GODS 🙏','fix')}
      <div style="margin-top:12px">${btn('← BACK','back','secondary')}</div></div></div>
  </div>`;
}
function getResult() {
  const pts = (state.wifi === null ? 0 : wifiOptions[state.wifi].score) + (state.skill >= 65 ? 2 : state.skill >= 30 ? 1 : 0) + (state.security === 'reported' ? 2 : 0);
  if (pts >= 6) return { emoji:'🧙‍♂️', name:'THE WIFI WIZARD', badge:'NETWORK NECROMANCER', desc:'You can restart a router with the force of your disappointment. People ask you to fix their laptops at family dinners. You are never truly off the clock.', motto:'MOST LIKELY TO SAY: “It works on my machine.”', level:'LEGENDARY' };
  if (pts >= 4) return { emoji:'🦆', name:'THE RUBBER DUCK DEBUGGER', badge:'PROFESSIONAL GOOGLER', desc:'You do not know the answer, but you know EXACTLY what to type into Google. Somehow, that is 87% of IT support.', motto:'MOST LIKELY TO SAY: “Interesting…”', level:'ADVANCED' };
  if (pts >= 2) return { emoji:'🔥', name:'THE CHAOS ENGINEER', badge:'INCIDENT GENERATOR', desc:'Every time you touch a setting, another meeting gets scheduled. You mean well, but the helpdesk has a group chat about you.', motto:'MOST LIKELY TO SAY: “What does this button do?”', level:'DANGEROUS' };
  return { emoji:'🥔', name:'THE CERTIFIED TECH POTATO', badge:'HUMAN LOADING SCREEN', desc:'You treat your laptop like a microwave. Your troubleshooting strategy is vibes, prayer, and asking someone called Dave.', motto:'MOST LIKELY TO SAY: “I didn’t touch anything.”', level:'ICONIC' };
}
function drawResults() {
  const result = getResult();
  return `<div class="scene-inner result-shell"><div><div class="result-label">✓ DIAGNOSIS COMPLETE · ${escapeHtml((state.name || 'MYSTERY EMPLOYEE').toUpperCase())}</div>
    <h1 class="result-rank">YOU ARE<br><span class="highlight">${result.name}</span></h1>
    <p class="result-summary">${result.desc}</p>
    <div class="stats"><span class="stat">SKILL: ${state.skill}% (SELF-REPORTED)</span><span class="stat">VIBE: ${result.level}</span><span class="stat">PRINTER: DEFEATED*</span></div>
    <div class="button-row result-button-row">${btn('CHALLENGE A FRIEND ↗','share')}${btn('COPY LINK 🔗','copy','secondary')}${btn('PLAY AGAIN ↻','restart','secondary')}</div>
    <p class="share-hint">${result.motto}<br>* No actual printers were harmed. Unfortunately.</p>
  </div><div class="result-card" aria-label="Your IT personality certificate"><div class="result-emoji" aria-hidden="true">${result.emoji}</div><div class="cert-small">OFFICIALLY UNOFFICIAL</div><div class="cert-title">${result.badge}</div><div class="cert-small">CERTIFIED IT CHAOS</div><div class="cert-id">ISSUED BY: CHAOS.IT · VALID FOREVER*</div></div></div>`;
}
function render() {
  const pages = [drawIntro, drawWifi, drawSkill, drawSecurity, drawPrinter, drawResults];
  scene.classList.remove('flash');
  void scene.offsetWidth;
  scene.classList.add('flash');
  scene.innerHTML = pages[state.step]();
  const current = state.step + 1;
  stepStatus.textContent = `STEP ${String(current).padStart(2, '0')} / 06`;
  progress.setAttribute('aria-valuenow', String(current));
  progressFill.style.width = `${current / 6 * 100}%`;
  bottomStatus.textContent = [
    'UPTIME: QUESTIONABLE', 'INCIDENT: OPEN', 'CONFIDENCE: UNVERIFIED',
    'THREAT LEVEL: SILLY', 'PRINTER: HOSTILE', 'TICKET: RESOLVED(ISH)'
  ][state.step];
  if (state.step === 5) celebrate();
  if (state.step === 0) {
    const field = document.getElementById('player-name');
    field.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
  }
  if (state.step === 2) {
    document.getElementById('skill-range').addEventListener('input', e => {
      state.skill = Number(e.target.value);
      const [emoji, verdict] = skillVerdict(state.skill);
      document.getElementById('meter-value').textContent = String(state.skill);
      document.getElementById('meter-face').textContent = emoji;
      document.getElementById('skill-verdict').textContent = `“${verdict}”`;
      e.target.style.setProperty('--fill', `${state.skill}%`);
    });
  }
}
function start() {
  state.name = (document.getElementById('player-name')?.value || '').trim().slice(0, 24) || 'MYSTERY EMPLOYEE';
  goto(1);
}
function next() {
  if (state.step === 1 && state.wifi === null) return notify('Pick an answer first. The ticket is waiting.');
  if (state.step === 4 && !state.printerDone) return notify('The printer is still plotting against you.');
  goto(state.step + 1);
}
function celebrate() {
  const container = document.getElementById('confetti');
  container.replaceChildren();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#d5ff58','#ff7aa9','#89acff','#ffba75','#ffffff'];
  for (let i = 0; i < 76; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${2.3 + Math.random() * 2.4}s`;
    piece.style.animationDelay = `${Math.random() * 1.2}s`;
    piece.style.setProperty('--drift', `${Math.random() * 240 - 120}px`);
    piece.style.setProperty('--rotation', `${Math.random() * 1500}deg`);
    container.appendChild(piece);
  }
  setTimeout(() => container.replaceChildren(), 6000);
  sound(880,.2);
}
function shareUrl() {
  if (location.protocol === 'file:') return null;
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  url.searchParams.set('challengedBy', state.name);
  return url.toString();
}
async function copyLink() {
  const url = shareUrl();
  if (!url) return notify('Publish to GitHub Pages first to get a shareable URL.');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      notify('Challenge link copied. Send the chaos! 🔗');
    } else {
      const input = document.createElement('textarea');
      input.value = url; document.body.append(input); input.select();
      const copied = document.execCommand('copy'); input.remove();
      if (!copied) throw new Error('Copy unavailable');
      notify('Challenge link copied. Send the chaos! 🔗');
    }
  } catch (_) { window.prompt('Copy this challenge link:', url); }
}
async function share() {
  const url = shareUrl();
  if (!url) return notify('Publish to GitHub Pages first to get a shareable URL.');
  const result = getResult();
  const text = `I took the IT CHAOS CHECK and got “${result.name}” 💻💀. Your turn. No cheating.`;
  if (navigator.share) {
    try { await navigator.share({ title:'IT CHAOS CHECK™', text, url }); }
    catch (err) { if (err?.name !== 'AbortError') await copyLink(); }
  } else { await copyLink(); }
}
function restart() {
  state.wifi = null; state.skill = 35; state.security = null;
  state.scamClicks = 0; state.printerClicks = 0; state.printerDone = false;
  document.getElementById('confetti').replaceChildren();
  goto(0);
}

scene.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'start') start();
  else if (action === 'wifi') {
    state.wifi = Number(target.dataset.index); sound(620); render();
  }
  else if (action === 'next') next();
  else if (action === 'back') goto(state.step - 1);
  else if (action === 'report') { state.security = 'reported'; sound(870); goto(4); notify('Excellent. Cybersecurity approves. 🛡️'); }
  else if (action === 'scam') {
    state.scamClicks++;
    sound(210, .2);
    const gag = document.getElementById('security-gag');
    gag.textContent = scamMessages[Math.min(state.scamClicks - 1, scamMessages.length - 1)];
    if (state.scamClicks >= 4) {
      target.textContent = 'OKAY FINE, REPORT IT 🛡️';
      target.dataset.action = 'report';
      notify('Plot twist: cybersecurity won.');
    } else { target.style.transform = `translate(${[12,-10,8][(state.scamClicks-1)%3]}px,-3px) rotate(${state.scamClicks%2 ? -3:3}deg)`; }
  }
  else if (action === 'fix') {
    state.printerClicks = Math.min(3, state.printerClicks + 1);
    state.printerDone = state.printerClicks >= 3;
    sound(state.printerDone ? 900 : 280 + 80 * state.printerClicks, .13);
    render();
    if (state.printerDone) notify('PRINTER DEFEATED. Emotional damage: permanent.');
  }
  else if (action === 'share') await share();
  else if (action === 'copy') await copyLink();
  else if (action === 'restart') restart();
});
document.getElementById('sound-toggle').addEventListener('click', event => {
  state.sound = !state.sound;
  event.currentTarget.setAttribute('aria-pressed', String(state.sound));
  document.getElementById('sound-symbol').textContent = state.sound ? '♫' : '♪';
  document.getElementById('sound-label').textContent = state.sound ? 'SOUND ON' : 'SOUND OFF';
  sound(720, .11);
});
render();
