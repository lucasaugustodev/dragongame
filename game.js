const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const cleanSprite = (name) => `assets/sprites/clean/${name}.png`;
const frameRange = (prefix, count) =>
  Array.from({ length: count }, (_, index) => cleanSprite(`${prefix}-${String(index + 1).padStart(2, "0")}`));

const spriteFrames = {
  dragonSleep: frameRange("dragon-clean-sleep-wake", 5),
  dragonWake: frameRange("dragon-clean-sleep-wake", 8).slice(4),
  dragonAttack: [
    ...frameRange("dragon-clean-combat", 8),
    ...frameRange("dragon-clean-fire-result", 4),
  ],
  dragonLoss: [
    cleanSprite("dragon-clean-fire-result-04"),
    cleanSprite("dragon-clean-fire-result-05"),
    cleanSprite("dragon-clean-fire-result-06"),
  ],
  dragonWin: [
    cleanSprite("dragon-clean-fire-result-07"),
    cleanSprite("dragon-clean-fire-result-08"),
    cleanSprite("dragon-clean-sleep-wake-01"),
  ],
  thiefReady: frameRange("thief-clean-steal-idle", 3),
  thiefSteal: frameRange("thief-clean-steal-idle", 8).slice(3),
  thiefEscape: frameRange("thief-clean-run-escape", 8),
  thiefCaught: [
    ...frameRange("thief-clean-danger-result", 6),
  ],
  thiefWin: [
    cleanSprite("thief-clean-danger-result-07"),
    cleanSprite("thief-clean-run-escape-08"),
    cleanSprite("thief-clean-danger-result-08"),
  ],
};

const videoAssets = {
  dragonSleep: {
    key: "dragonSleep",
    src: "assets/videos/dragon_sleep_alpha.webm",
    loop: true,
  },
  dragonWake: {
    key: "dragonWake",
    src: "assets/videos/dragon_wake_alpha.webm",
    loop: false,
  },
  dragonWakeFromSleep: {
    key: "dragonWakeFromSleep",
    src: "assets/videos/dragon_wake_from_sleep_alpha.webm",
    loop: false,
  },
  dragonAttack: {
    key: "dragonAttack",
    src: "assets/videos/dragon_attack_alpha.webm",
    loop: false,
  },
  dragonAttackFromWake: {
    key: "dragonAttackFromWake",
    src: "assets/videos/dragon_attack_from_wake_alpha.webm",
    loop: false,
  },
  dragonFire: {
    key: "dragonFire",
    src: "assets/videos/dragon_fire_alpha.webm",
    loop: false,
  },
  dragonFireFromWake: {
    key: "dragonFireFromWake",
    src: "assets/videos/dragon_fire_from_wake_alpha.webm",
    loop: false,
  },
  dragonFiringFull: {
    key: "dragonFiringFull",
    src: "assets/videos/dragon_firing_alpha.webm",
    loop: false,
  },
  dragonFiringNow: {
    key: "dragonFiringNow",
    src: "assets/videos/dragon_firing_now_alpha.webm",
    loop: false,
    holdLastFrame: true,
  },
  readyChest: {
    key: "readyChest",
    src: "assets/videos/catching_gold_alpha.webm",
    loop: false,
    autoplay: false,
    startTime: 0,
  },
  thiefCatchingGold: {
    key: "thiefCatchingGold",
    src: "assets/videos/catching_gold_alpha.webm",
    loop: false,
    holdLastFrame: true,
  },
  thiefRobbing: {
    key: "thiefRobbing",
    src: "assets/videos/robbing_alpha.webm",
    loop: false,
    holdLastFrame: true,
  },
  thiefCatchingFire: {
    key: "thiefCatchingFire",
    src: "assets/videos/catching_fire2_alpha.webm",
    loop: false,
    holdLastFrame: true,
  },
  thiefSteal: {
    key: "thiefSteal",
    src: "assets/videos/thief_steal_alpha.webm",
    loop: true,
  },
  thiefReady: {
    key: "thiefReady",
    src: "assets/videos/thief_scout_watch_36d_alpha.webm",
    loop: true,
  },
  thiefRun: {
    key: "thiefRun",
    src: "assets/videos/thief_run_alpha.webm",
    loop: true,
  },
  thiefLoss: {
    key: "thiefLoss",
    src: "assets/videos/thief_loss_alpha.webm",
    loop: false,
  },
};

const els = {
  stage: document.getElementById("stage"),
  stepTitle: document.getElementById("stepTitle"),
  stepSubtitle: document.getElementById("stepSubtitle"),
  balance: document.getElementById("balanceValue"),
  multiplier: document.getElementById("multiplierValue"),
  loot: document.getElementById("lootValue"),
  bet: document.getElementById("betValue"),
  decreaseBet: document.getElementById("decreaseBet"),
  increaseBet: document.getElementById("increaseBet"),
  stealButton: document.getElementById("stealButton"),
  stealButtonLabel: document.getElementById("stealButtonLabel"),
  nextMultiplierLabel: document.getElementById("nextMultiplierLabel"),
  cashoutButton: document.getElementById("cashoutButton"),
  cashoutValue: document.getElementById("cashoutValue"),
  riskTrack: document.getElementById("riskTrack"),
  dragonVideo: document.getElementById("dragonVideo"),
  thiefVideo: document.getElementById("thiefVideo"),
  thiefVideoBuffer: document.getElementById("thiefVideoBuffer"),
  dragonSprite: document.getElementById("dragonSprite"),
  thiefSprite: document.getElementById("thiefSprite"),
  resultPanel: document.getElementById("resultPanel"),
  resultTitle: document.getElementById("resultTitle"),
  resultAmount: document.getElementById("resultAmount"),
  resultMeta: document.getElementById("resultMeta"),
  playAgainButton: document.getElementById("playAgainButton"),
  statusText: document.getElementById("statusText"),
  resetButton: document.getElementById("resetButton"),
};

const initialBalance = 1250;
const betStep = 25;
const multiplierStep = 0.45;
const maxBet = 500;
let animationTick = 0;
let sequenceTimerId = null;
let fireImpactTimerId = null;
const thiefVideoPool = {
  active: els.thiefVideo,
  standby: els.thiefVideoBuffer,
  pendingKey: null,
  switchToken: 0,
};

const state = {
  phase: "ready",
  balance: loadBalance(),
  bet: 100,
  multiplier: 1,
  gold: 0,
  risk: 0,
  steals: 0,
  correctPath: null,
  resultKind: null,
  fireImpact: false,
  stealClip: "catchingGold",
  stealActionId: 0,
  status: "Escolha uma aposta e inicie o roubo.",
};

function loadBalance() {
  const raw = localStorage.getItem("dragonGameBalance");
  if (raw === null) {
    return initialBalance;
  }

  const saved = Number(raw);
  return Number.isFinite(saved) && saved >= 0 ? saved : initialBalance;
}

function saveBalance() {
  localStorage.setItem("dragonGameBalance", String(state.balance));
}

function createRiskSegments() {
  els.riskTrack.innerHTML = "";
  for (let i = 0; i < 10; i += 1) {
    const segment = document.createElement("div");
    segment.className = "risk-segment";
    els.riskTrack.appendChild(segment);
  }
}

function clampBetToBalance() {
  if (state.balance <= 0) {
    state.bet = betStep;
    return;
  }
  state.bet = Math.min(state.bet, Math.max(betStep, state.balance));
}

function roundMultiplier(value) {
  return Math.round(value * 100) / 100;
}

function startRound() {
  if (state.balance < state.bet) {
    state.status = "Saldo insuficiente para essa aposta.";
    render();
    return;
  }

  clearSequenceTimer();
  state.phase = "stealing";
  state.balance -= state.bet;
  state.multiplier = 1;
  state.gold = state.bet;
  state.risk = 10;
  state.steals = 1;
  state.correctPath = null;
  state.resultKind = null;
  state.fireImpact = false;
  state.stealClip = "catchingGold";
  state.stealActionId += 1;
  state.status = "Voce pegou o primeiro tesouro. Saque agora ou roube mais.";
  saveBalance();
  render();
}

function stealMore() {
  if (state.phase === "ready") {
    startRound();
    return;
  }

  if (state.phase !== "stealing") {
    return;
  }

  const wakeChance = Math.min(0.1 + state.risk * 0.0042, 0.58);
  const forcedWake = state.risk >= 100;

  if (forcedWake || Math.random() < wakeChance) {
    wakeDragon();
    return;
  }

  state.steals += 1;
  state.multiplier = roundMultiplier(state.multiplier + multiplierStep);
  state.gold = Math.round(state.bet * state.multiplier);
  state.risk = Math.min(100, state.risk + 12 + Math.floor(Math.random() * 7));
  state.stealClip = "robbing";
  state.stealActionId += 1;
  state.status = `Roubo perfeito. O tesouro agora vale ${money.format(state.gold)}.`;
  render();
}

function cashOut() {
  if (state.phase !== "stealing") {
    return;
  }

  state.balance += state.gold;
  clearSequenceTimer();
  finishRound("cashout", state.gold, "Voce saiu antes do dragao acordar.");
}

function wakeDragon() {
  clearSequenceTimer();
  state.phase = "firing";
  state.risk = 100;
  state.correctPath = null;
  state.fireImpact = false;
  state.status = "O dragao acordou antes do cashout. Voce perdeu o ouro.";
  fireImpactTimerId = window.setTimeout(showFireImpact, 6100);
  sequenceTimerId = window.setTimeout(finishLossFromDragon, 11200);
  render();
}

function showFireImpact() {
  fireImpactTimerId = null;
  if (state.phase !== "firing") {
    return;
  }

  state.fireImpact = true;
  render();
}

function finishLossFromDragon() {
  if (state.phase !== "firing" && state.phase !== "caught") {
    return;
  }

  finishRound("loss", 0, "O dragao acordou antes do cashout. Voce perdeu o ouro.");
}

function beginFireWarning() {
  sequenceTimerId = null;
  if (state.phase !== "waking") {
    return;
  }

  state.phase = "firing";
  state.status = "O dragao acordou antes do cashout. Voce perdeu o ouro.";
  sequenceTimerId = window.setTimeout(() => {
    playCaughtSequence("O dragao acordou antes do cashout. Voce perdeu o ouro.");
  }, 3600);
  render();
}

function clearSequenceTimer() {
  if (sequenceTimerId) {
    window.clearTimeout(sequenceTimerId);
    sequenceTimerId = null;
  }

  if (fireImpactTimerId) {
    window.clearTimeout(fireImpactTimerId);
    fireImpactTimerId = null;
  }
}

function playCaughtSequence(message) {
  clearSequenceTimer();
  state.phase = "caught";
  state.resultKind = "loss";
  state.resultAmount = 0;
  state.status = message;
  sequenceTimerId = window.setTimeout(() => {
    sequenceTimerId = null;
    finishRound("loss", 0, message);
  }, 2400);
  render();
}

function finishRound(kind, amount, message) {
  clearSequenceTimer();
  state.phase = "result";
  state.resultKind = kind;
  state.status = message;
  state.resultAmount = amount;
  saveBalance();
  clampBetToBalance();
  render();
}

function playAgain() {
  clearSequenceTimer();
  state.phase = "ready";
  state.multiplier = 1;
  state.gold = 0;
  state.risk = 0;
  state.steals = 0;
  state.correctPath = null;
  state.resultKind = null;
  state.resultAmount = 0;
  state.fireImpact = false;
  state.stealClip = "catchingGold";
  state.stealActionId += 1;
  state.status = state.balance > 0
    ? "Escolha uma aposta e inicie o roubo."
    : "Saldo zerado. Resete o saldo para jogar novamente.";
  clampBetToBalance();
  render();
}

function adjustBet(delta) {
  if (state.phase !== "ready") {
    return;
  }

  const next = state.bet + delta;
  state.bet = Math.max(betStep, Math.min(maxBet, next));
  clampBetToBalance();
  render();
}

function resetBalance() {
  state.balance = initialBalance;
  state.bet = 100;
  playAgain();
  saveBalance();
}

function renderRisk() {
  const active = Math.ceil(state.risk / 10);
  [...els.riskTrack.children].forEach((segment, index) => {
    const zone = index < 4 ? "safe" : index < 7 ? "warn" : "danger";
    segment.className = `risk-segment ${index < active ? `active ${zone}` : ""}`;
  });
}

function renderSprites() {
  const pick = (frames, speed = 1) => frames[Math.floor(animationTick / speed) % frames.length];

  if (state.phase === "waking") {
    els.dragonSprite.src = pick(spriteFrames.dragonWake);
    els.thiefSprite.src = pick(spriteFrames.thiefSteal);
    return;
  }

  if (state.phase === "firing") {
    els.dragonSprite.src = pick(spriteFrames.dragonAttack);
    els.thiefSprite.src = pick(spriteFrames.thiefSteal);
    return;
  }

  if (state.phase === "caught") {
    els.dragonSprite.src = pick(spriteFrames.dragonLoss, 2);
    els.thiefSprite.src = pick(spriteFrames.thiefCaught, 2);
    return;
  }

  if (state.phase === "result") {
    if (state.resultKind === "loss") {
      els.dragonSprite.src = pick(spriteFrames.dragonLoss, 2);
      els.thiefSprite.src = pick(spriteFrames.thiefCaught, 2);
      return;
    }

    els.dragonSprite.src = pick(spriteFrames.dragonWin, 2);
    els.thiefSprite.src = pick(spriteFrames.thiefWin, 2);
    return;
  }

  if (state.phase === "stealing") {
    els.dragonSprite.src = pick(spriteFrames.dragonSleep, 2);
    els.thiefSprite.src = pick(spriteFrames.thiefSteal);
    return;
  }

  els.dragonSprite.src = pick(spriteFrames.dragonSleep, 2);
  els.thiefSprite.src = pick(spriteFrames.thiefReady, 2);
}

function getStealVideoConfig() {
  const base = state.stealClip === "robbing"
    ? videoAssets.thiefRobbing
    : videoAssets.thiefCatchingGold;

  return {
    ...base,
    key: `${base.key}-${state.stealActionId}`,
  };
}

function getVideoConfig() {
  if (state.phase === "ready") {
    return {
      dragon: videoAssets.dragonSleep,
      thief: videoAssets.readyChest,
    };
  }

  if (state.phase === "stealing") {
    return {
      dragon: videoAssets.dragonSleep,
      thief: getStealVideoConfig(),
    };
  }

  if (state.phase === "waking") {
    return {
      dragon: videoAssets.dragonWakeFromSleep,
      thief: videoAssets.thiefSteal,
    };
  }

  if (state.phase === "firing") {
    return {
      dragon: videoAssets.dragonFiringNow,
      thief: state.fireImpact ? videoAssets.thiefCatchingFire : getStealVideoConfig(),
    };
  }

  if (state.phase === "caught") {
    return {
      dragon: videoAssets.dragonFiringNow,
      thief: videoAssets.thiefCatchingFire,
    };
  }

  if (state.phase === "result" && state.resultKind === "loss") {
    return {
      dragon: videoAssets.dragonFiringNow,
      thief: videoAssets.thiefCatchingFire,
    };
  }

  return {
    dragon: null,
    thief: null,
  };
}

function configureVideoElement(video, config, resetTime = true) {
  const srcChanged = video.dataset.videoSrc !== config.src;
  video.dataset.videoKey = config.key;
  video.dataset.videoSrc = config.src;
  video.dataset.autoplay = String(config.autoplay !== false);
  video.loop = config.loop;

  if (srcChanged) {
    video.src = config.src;
  }

  if (resetTime) {
    try {
      video.currentTime = config.startTime || 0;
    } catch {}
  }

  if (srcChanged) {
    video.load();
  }
}

function syncVideoPlayback(video, config) {
  video.hidden = false;
  video.loop = config.loop;
  video.dataset.autoplay = String(config.autoplay !== false);

  if (config.autoplay === false) {
    const freeze = () => {
      try {
        video.currentTime = config.startTime || 0;
      } catch {}
      video.pause();
    };

    if (video.readyState < 1) {
      video.addEventListener("loadedmetadata", freeze, { once: true });
    } else {
      freeze();
    }

    return;
  }

  if (config.holdLastFrame && video.ended) {
    video.pause();
    return;
  }

  video.play().catch(() => {});
}

function setActorVideo(video, config) {
  if (!config) {
    if (!video.hidden) {
      video.pause();
      video.hidden = true;
    }
    return false;
  }

  if (video.dataset.videoKey !== config.key) {
    configureVideoElement(video, config);
  }

  syncVideoPlayback(video, config);
  return true;
}

function retireBufferedVideo(video, key) {
  window.setTimeout(() => {
    if (video.dataset.videoKey !== key || video === thiefVideoPool.active) {
      return;
    }

    video.pause();
    video.hidden = true;
  }, 260);
}

function activateBufferedVideo(pool, incoming, outgoing, config, token) {
  if (token !== pool.switchToken) {
    return;
  }

  pool.pendingKey = null;
  incoming.hidden = false;
  incoming.classList.add("is-active");
  outgoing.classList.remove("is-active");
  syncVideoPlayback(incoming, config);

  const outgoingKey = outgoing.dataset.videoKey;
  pool.active = incoming;
  pool.standby = outgoing;
  retireBufferedVideo(outgoing, outgoingKey);
}

function setBufferedActorVideo(pool, config) {
  if (!config) {
    [pool.active, pool.standby].forEach((video) => {
      video.pause();
      video.hidden = true;
      video.classList.remove("is-active");
    });
    pool.pendingKey = null;
    return false;
  }

  if (pool.active.dataset.videoKey === config.key) {
    pool.active.classList.add("is-active");
    syncVideoPlayback(pool.active, config);
    return true;
  }

  if (!pool.active.hidden && pool.active.dataset.videoSrc === config.src) {
    pool.pendingKey = null;
    pool.switchToken += 1;
    configureVideoElement(pool.active, config);
    pool.active.classList.add("is-active");
    syncVideoPlayback(pool.active, config);
    return true;
  }

  const incoming = pool.standby;
  const outgoing = pool.active;
  const token = pool.switchToken + 1;
  pool.switchToken = token;
  pool.pendingKey = config.key;

  incoming.hidden = false;
  incoming.classList.remove("is-active");
  configureVideoElement(incoming, config);
  syncVideoPlayback(incoming, config);

  const activate = () => activateBufferedVideo(pool, incoming, outgoing, config, token);

  if (incoming.readyState >= 2) {
    window.requestAnimationFrame(activate);
  } else {
    incoming.addEventListener("loadeddata", activate, { once: true });
    incoming.addEventListener("canplay", activate, { once: true });
  }

  return true;
}

function renderVideos() {
  const config = getVideoConfig();
  const hasDragonVideo = setActorVideo(els.dragonVideo, config.dragon);
  const hasThiefVideo = setBufferedActorVideo(thiefVideoPool, config.thief);

  els.stage.classList.toggle("use-dragon-video", hasDragonVideo);
  els.stage.classList.toggle("use-thief-video", hasThiefVideo);
}

function renderResult() {
  const isResult = state.phase === "result";
  els.resultPanel.hidden = !isResult;
  if (!isResult) {
    return;
  }

  const titles = {
    win: "3A. Fugiu com sucesso!",
    cashout: "Cash out feito!",
    loss: "3B. O dragao te pegou!",
  };

  els.resultTitle.textContent = titles[state.resultKind] || "Resultado";
  els.resultAmount.textContent = money.format(state.resultAmount || 0);
  els.resultMeta.textContent = state.resultKind === "loss"
    ? "Voce perdeu"
    : `${state.multiplier.toFixed(2)}x`;
}

function renderButtons() {
  const ready = state.phase === "ready";
  const stealing = state.phase === "stealing";
  const canStart = ready && state.balance >= state.bet;
  const betLocked = state.phase !== "ready";

  els.stealButton.disabled = !(canStart || stealing);
  els.cashoutButton.disabled = !stealing;
  els.decreaseBet.disabled = betLocked || state.bet <= betStep;
  els.increaseBet.disabled = betLocked || state.bet >= Math.min(maxBet, state.balance);

  els.stealButtonLabel.textContent = ready ? "Iniciar roubo" : "Roubar mais";
  els.nextMultiplierLabel.textContent = stealing
    ? `Proximo: +${multiplierStep.toFixed(2)}x`
    : "Primeiro bau";
}

function renderStageClass() {
  let className = "stage";
  if (state.phase === "ready") className += " ready";
  if (state.phase === "stealing") className += " stealing";
  if (state.phase === "waking") className += " waking";
  if (state.phase === "firing") className += " firing";
  if (state.phase === "caught") className += " caught";
  if (state.phase === "result") className += ` result-${state.resultKind}`;
  els.stage.className = className;
}

function renderStepCopy() {
  if (state.phase === "waking") {
    els.stepTitle.textContent = "2. O dragao acordou!";
    els.stepSubtitle.textContent = "Ele esta levantando.";
    return;
  }

  if (state.phase === "firing") {
    els.stepTitle.textContent = "2. Fogo!";
    els.stepSubtitle.textContent = "O dragao cuspiu fogo.";
    return;
  }

  if (state.phase === "caught") {
    els.stepTitle.textContent = "3B. O dragao te pegou!";
    els.stepSubtitle.textContent = "Ataque em andamento.";
    return;
  }

  if (state.phase === "result") {
    if (state.resultKind === "loss") {
      els.stepTitle.textContent = "3B. O dragao te pegou!";
      els.stepSubtitle.textContent = "Voce perdeu o ouro.";
      return;
    }

    els.stepTitle.textContent = state.resultKind === "cashout"
      ? "3. Cash out feito!"
      : "3A. Fugiu com sucesso!";
    els.stepSubtitle.textContent = "O ouro foi levado para o saldo.";
    return;
  }

  els.stepTitle.textContent = "1. Roube o ouro";
  els.stepSubtitle.textContent = "O dragao esta dormindo...";
}

function render() {
  renderStageClass();
  renderStepCopy();
  renderSprites();
  renderVideos();
  renderRisk();
  renderResult();
  renderButtons();

  els.balance.textContent = money.format(state.balance);
  els.bet.textContent = money.format(state.bet);
  els.multiplier.textContent = `${state.multiplier.toFixed(2)}x`;
  els.loot.textContent = money.format(state.gold);
  els.cashoutValue.textContent = money.format(state.gold);
  els.statusText.textContent = state.status;
}

els.stealButton.addEventListener("click", stealMore);
els.cashoutButton.addEventListener("click", cashOut);
els.decreaseBet.addEventListener("click", () => adjustBet(-betStep));
els.increaseBet.addEventListener("click", () => adjustBet(betStep));
els.playAgainButton.addEventListener("click", playAgain);
els.resetButton.addEventListener("click", resetBalance);
[els.dragonVideo, els.thiefVideo, els.thiefVideoBuffer].forEach((video) => {
  video.addEventListener("canplay", () => {
    if (video.dataset.autoplay === "false") {
      video.pause();
      return;
    }

    video.play().catch(() => {});
  });
});

[els.thiefVideo, els.thiefVideoBuffer].forEach((video) => {
  video.addEventListener("ended", () => {
    if (video.dataset.videoKey === "thiefCatchingFire" && state.phase === "firing") {
      finishLossFromDragon();
    }
  });
});

createRiskSegments();
clampBetToBalance();
render();

window.setInterval(() => {
  animationTick += 1;
  renderSprites();
}, 420);
