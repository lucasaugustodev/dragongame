const clips = {
  dragonSleep: "assets/videos/dragon_sleep_alpha.webm",
  dragonWake: "assets/videos/dragon_wake_from_sleep_alpha.webm",
  dragonAttack: "assets/videos/dragon_attack_from_wake_alpha.webm",
  dragonFire: "assets/videos/dragon_fire_from_wake_alpha.webm",
  dragonFiringFull: "assets/videos/dragon_firing_alpha.webm",
  dragonFiringNow: "assets/videos/dragon_firing_now_alpha.webm",
  thiefSteal: "assets/videos/thief_steal_alpha.webm",
  catchingGold: "assets/videos/catching_gold_alpha.webm",
  catchingFire2: "assets/videos/catching_fire2_alpha.webm",
  thiefLoss: "assets/videos/thief_loss_alpha.webm",
};

const preClips = [
  { id: "thief_scout_watch_36d_alpha", label: "Scout 36f D", src: "assets/videos/thief_scout_watch_36d_alpha.webm" },
  { id: "thief_scout_watch_36_alpha", label: "Scout 36f curto", src: "assets/videos/thief_scout_watch_36_alpha.webm" },
  { id: "thief_scout_watch_36b_alpha", label: "Scout 36f B", src: "assets/videos/thief_scout_watch_36b_alpha.webm" },
  { id: "thief_scout_watch_36c_alpha", label: "Scout 36f C", src: "assets/videos/thief_scout_watch_36c_alpha.webm" },
  { id: "thief_scout_watch_48_alpha", label: "Scout 48f medio", src: "assets/videos/thief_scout_watch_48_alpha.webm" },
  { id: "thief_scout_watch_72_alpha", label: "Scout 72f longo", src: "assets/videos/thief_scout_watch_72_alpha.webm" },
  { id: "thief_scout_alpha", label: "Scout atual", src: "assets/videos/thief_scout_alpha.webm" },
  { id: "thief_ready_alpha", label: "Ready antigo", src: "assets/videos/thief_ready_alpha.webm" },
];

const attackClips = [
  { id: "dragonFiringNow", label: "Firing now", src: clips.dragonFiringNow },
  { id: "dragonFiringFull", label: "Firing completo", src: clips.dragonFiringFull },
  { id: "dragonFire", label: "Fogo from wake", src: clips.dragonFire },
  { id: "dragonAttack", label: "Ataque from wake", src: clips.dragonAttack },
];

const els = {
  stage: document.getElementById("stage"),
  dragonVideo: document.getElementById("dragonVideo"),
  thiefVideo: document.getElementById("thiefVideo"),
  phaseTag: document.getElementById("phaseTag"),
  preSelect: document.getElementById("preSelect"),
  attackSelect: document.getElementById("attackSelect"),
  preButton: document.getElementById("preButton"),
  stealButton: document.getElementById("stealButton"),
  attackButton: document.getElementById("attackButton"),
  sequenceButton: document.getElementById("sequenceButton"),
  preMs: document.getElementById("preMs"),
  stealMs: document.getElementById("stealMs"),
  attackMs: document.getElementById("attackMs"),
  bgMode: document.getElementById("bgMode"),
  status: document.getElementById("status"),
};

const sliders = ["thiefX", "thiefY", "thiefW", "dragonX", "dragonY", "dragonW"].reduce((acc, id) => {
  acc[id] = document.getElementById(id);
  return acc;
}, {});

let timers = [];

function fillSelect(select, items) {
  select.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    select.appendChild(option);
  });
}

function selected(items, id) {
  return items.find((item) => item.id === id) || items[0];
}

function playVideo(video, src, loop) {
  if (video.dataset.src !== src) {
    video.dataset.src = src;
    video.src = src;
    video.currentTime = 0;
    video.load();
  } else {
    video.currentTime = 0;
  }
  video.loop = loop;
  video.play().catch(() => {});
}

function clearTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers = [];
}

function setPhase(name, dragon, thief, options = {}) {
  clearTimers();
  els.stage.classList.toggle("full-firing", Boolean(options.fullFiring));
  els.phaseTag.textContent = name;
  playVideo(els.dragonVideo, dragon.src, dragon.loop);
  playVideo(els.thiefVideo, thief.src, thief.loop);
  updateStatus(options.note || name);
}

function prePhase() {
  const pre = selected(preClips, els.preSelect.value);
  setPhase("PRE-ROUBO", { src: clips.dragonSleep, loop: true }, { src: pre.src, loop: true }, {
    note: `pre=${pre.id}`,
  });
}

function stealPhase() {
  setPhase("ROUBO", { src: clips.dragonSleep, loop: true }, { src: clips.catchingGold, loop: false }, {
    note: "roubo=catching_gold_alpha",
  });
}

function wakePhase() {
  setPhase("ACORDAR", { src: clips.dragonWake, loop: false }, { src: clips.thiefSteal, loop: true }, {
    note: "dragao=dragon_wake_from_sleep_alpha",
  });
}

function attackPhase() {
  const attack = selected(attackClips, els.attackSelect.value);
  setPhase("ATAQUE", { src: attack.src, loop: false }, { src: clips.catchingGold, loop: false }, {
    fullFiring: attack.id === "dragonFiringFull" || attack.id === "dragonFiringNow",
    note: `ataque=${attack.id}`,
  });
  timers.push(window.setTimeout(() => {
    playVideo(els.thiefVideo, clips.catchingFire2, false);
    updateStatus(`ataque=${attack.id} / impacto=catching_fire2`);
  }, 6100));
}

function sequence() {
  clearTimers();
  prePhase();
  timers.push(window.setTimeout(() => {
    stealPhase();
    timers.push(window.setTimeout(attackPhase, Number(els.stealMs.value)));
  }, Number(els.preMs.value)));
}

function updateBackground() {
  els.stage.classList.remove("checker", "black", "white");
  if (els.bgMode.value !== "cave") {
    els.stage.classList.add(els.bgMode.value);
  }
}

function applySliders() {
  document.documentElement.style.setProperty("--thief-x", `${sliders.thiefX.value}%`);
  document.documentElement.style.setProperty("--thief-y", `${sliders.thiefY.value}%`);
  document.documentElement.style.setProperty("--thief-w", `${sliders.thiefW.value}%`);
  document.documentElement.style.setProperty("--dragon-x", `${sliders.dragonX.value}%`);
  document.documentElement.style.setProperty("--dragon-y", `${sliders.dragonY.value}%`);
  document.documentElement.style.setProperty("--dragon-w", `${sliders.dragonW.value}%`);
}

function updateStatus(note) {
  els.status.textContent = [
    note,
    `dragon=${els.dragonVideo.dataset.src?.split("/").pop() || ""}`,
    `thief=${els.thiefVideo.dataset.src?.split("/").pop() || ""}`,
    `t=${els.thiefVideo.currentTime.toFixed(2)}s / ${Number.isFinite(els.thiefVideo.duration) ? els.thiefVideo.duration.toFixed(2) : "?"}s`,
  ].join("\n");
}

fillSelect(els.preSelect, preClips);
fillSelect(els.attackSelect, attackClips);

els.preButton.addEventListener("click", prePhase);
els.stealButton.addEventListener("click", stealPhase);
els.attackButton.addEventListener("click", attackPhase);
els.sequenceButton.addEventListener("click", sequence);
els.preSelect.addEventListener("change", prePhase);
els.attackSelect.addEventListener("change", attackPhase);
els.bgMode.addEventListener("change", updateBackground);

Object.values(sliders).forEach((slider) => {
  slider.addEventListener("input", applySliders);
});

window.setInterval(() => updateStatus(els.phaseTag.textContent), 500);

applySliders();
updateBackground();
prePhase();
