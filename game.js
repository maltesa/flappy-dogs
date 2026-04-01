const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const menuOverlay = document.getElementById("menu-overlay");
const gameOverOverlay = document.getElementById("game-over-overlay");
const gameOverTitle = document.getElementById("game-over-title");
const gameOverCopy = document.getElementById("game-over-copy");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const changeDogButton = document.getElementById("change-dog-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const menuHint = document.getElementById("menu-hint");
const modeSwitch = document.getElementById("mode-switch");
const selectionLayout = document.getElementById("selection-layout");
const playerSelectP2 = document.getElementById("player-select-p2");
const dogGridP1 = document.getElementById("dog-grid-p1");
const dogGridP2 = document.getElementById("dog-grid-p2");
const controlsGuide = document.getElementById("controls-guide");
const controlsCardP2 = document.getElementById("controls-card-p2");

const STORAGE_KEY = "floppy-dogs-best-score";

const dogs = [
  {
    id: "sm",
    name: "Rocket",
    label: "leicht + schnell",
    description: "Kleiner, flinkerer Hund mit etwas mehr Sprungkraft.",
    asset: "assets/dog-sm.png",
    width: 88,
    height: 62,
    gravity: 980,
    flap: -340,
    scrollSpeed: 278,
    pipeGap: 214,
    hitboxScale: 0.72,
  },
  {
    id: "lg",
    name: "Tank",
    label: "gross + langsam",
    description: "Groesserer Hund mit mehr Masse, engerem Timing und mehr Flaeche.",
    asset: "assets/dog-lg.png",
    width: 122,
    height: 86,
    gravity: 1125,
    flap: -312,
    scrollSpeed: 232,
    pipeGap: 198,
    hitboxScale: 0.68,
  },
];

const PLAYER_CONFIG = [
  {
    id: "p1",
    label: "Spieler 1",
    shortLabel: "P1",
    flapKeys: ["Space", "ArrowUp"],
    brakeKeys: ["ArrowDown", "KeyS"],
    activateKeys: ["KeyE"],
    pointer: true,
    color: "#ffb449",
    xRatio: 0.24,
  },
  {
    id: "p2",
    label: "Spieler 2",
    shortLabel: "P2",
    flapKeys: ["KeyW"],
    brakeKeys: ["KeyX"],
    activateKeys: ["KeyQ"],
    pointer: false,
    color: "#8fe3ff",
    xRatio: 0.33,
  },
];

const assetCandidates = {
  background: ["assets/background.png"],
  clouds: ["assets/clouds.png"],
  cloudsEvil: ["assets/clouds-evil.png"],
  powerupRocket: ["assets/power-up-rocket.png"],
  parachute: ["assets/fallschirm.png"],
  ball: ["assets/ball.png"],
};

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  groundHeight: 92,
  pipeWidth: 108,
};

const state = {
  status: "menu",
  gameMode: "single",
  selectedDogs: {
    p1: null,
    p2: null,
  },
  players: [],
  course: {
    scrollSpeed: 255,
    pipeGap: 180,
  },
  pipes: [],
  powerups: [],
  balls: [],
  cloudPuffs: [],
  score: 0,
  bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
  pipeSpawnCount: 0,
  nextPowerupAt: 4,
  spawnDistance: 308,
  scrollOffset: 0,
  backgroundOffset: 0,
  cloudsOffset: 0,
  countdownTimer: 0,
  countdownValue: 3,
  elapsedRunTime: 0,
  isBraking: false,
  forceNextPipeGapCenterY: null,
  forcePipeAlignmentCount: 0,
  lastStandingPlayerId: null,
  lastTime: 0,
  assets: {
    dogs: new Map(),
    background: null,
    clouds: null,
    cloudsEvil: null,
    powerupRocket: null,
    parachute: null,
    ball: null,
  },
};

function isMultiplayerMode() {
  return state.gameMode !== "single";
}

function isCoopMode() {
  return state.gameMode === "multi_coop";
}

bestScoreEl.textContent = String(state.bestScore);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function removeWhiteBackground(image) {
  const buffer = document.createElement("canvas");
  buffer.width = image.width;
  buffer.height = image.height;
  const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });
  bufferCtx.drawImage(image, 0, 0);

  const pixels = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);
  const data = pixels.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const brightness = (red + green + blue) / 3;
    const spread = Math.max(red, green, blue) - Math.min(red, green, blue);

    if (alpha === 0) {
      continue;
    }

    if (brightness > 245 && spread < 25) {
      data[index + 3] = 0;
      continue;
    }

    if (brightness > 225 && spread < 35) {
      data[index + 3] = Math.round(alpha * 0.35);
    }
  }

  bufferCtx.putImageData(pixels, 0, 0);

  let minX = buffer.width;
  let minY = buffer.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < buffer.height; y += 1) {
    for (let x = 0; x < buffer.width; x += 1) {
      const index = (y * buffer.width + x) * 4;
      if (data[index + 3] > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return Promise.resolve(image);
  }

  const padding = 8;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(buffer.width - cropX, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(buffer.height - cropY, maxY - minY + 1 + padding * 2);

  const trimmed = document.createElement("canvas");
  trimmed.width = cropWidth;
  trimmed.height = cropHeight;
  const trimmedCtx = trimmed.getContext("2d");
  trimmedCtx.drawImage(
    buffer,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return new Promise((resolve, reject) => {
    const processed = new Image();
    processed.onload = () => resolve(processed);
    processed.onerror = reject;
    processed.src = trimmed.toDataURL("image/png");
  });
}

async function loadOptionalAsset(candidates) {
  for (const src of candidates) {
    try {
      return await loadImage(src);
    } catch (error) {
      continue;
    }
  }
  return null;
}

async function loadAssets() {
  await Promise.all(
    dogs.map(async (dog) => {
      try {
        const image = await loadImage(dog.asset);
        state.assets.dogs.set(dog.id, await removeWhiteBackground(image));
      } catch (error) {
        state.assets.dogs.set(dog.id, null);
      }
    }),
  );

  const [background, clouds, cloudsEvil, powerupRocket, parachute, ball] = await Promise.all([
    loadOptionalAsset(assetCandidates.background),
    loadOptionalAsset(assetCandidates.clouds),
    loadOptionalAsset(assetCandidates.cloudsEvil),
    loadOptionalAsset(assetCandidates.powerupRocket),
    loadOptionalAsset(assetCandidates.parachute),
    loadOptionalAsset(assetCandidates.ball),
  ]);

  state.assets.background = background;
  state.assets.clouds = clouds;
  state.assets.cloudsEvil = cloudsEvil;
  state.assets.powerupRocket = powerupRocket
    ? await removeWhiteBackground(powerupRocket)
    : null;
  state.assets.parachute = parachute
    ? await removeWhiteBackground(parachute)
    : null;
  state.assets.ball = ball ? await removeWhiteBackground(ball) : null;
}

function createCloudPuffs() {
  const puffs = [];
  for (let index = 0; index < 8; index += 1) {
    puffs.push({
      x: Math.random() * WORLD.width,
      y: 50 + Math.random() * 210,
      width: 70 + Math.random() * 130,
      height: 24 + Math.random() * 28,
      speed: 10 + Math.random() * 22,
      alpha: 0.18 + Math.random() * 0.18,
    });
  }
  return puffs;
}

function createBird(dog, config) {
  return {
    x: WORLD.width * config.xRatio,
    y: WORLD.height * 0.48,
    velocityY: 0,
    bobPhase: 0,
    width: dog.width,
    height: dog.height,
  };
}

function getRequiredPlayerCount() {
  return isMultiplayerMode() ? 2 : 1;
}

function getAlivePlayers() {
  return state.players.filter((player) => player.alive);
}

function isPlayerPowerupActive(player, type) {
  return player.activePowerupType === type && player.powerupTimer > 0;
}

function isPlayerProtected(player) {
  return player.invulnerableTimer > 0 || Boolean(player.activePowerupType && player.powerupTimer > 0);
}

function getPowerupName(type) {
  return type === "parachute" ? "Fallschirm" : type === "rocket" ? "Duese" : "leer";
}

function getFirstActivePowerupPlayer() {
  return state.players
    .filter((player) => player.alive && player.activePowerupType && player.powerupTimer > 0)
    .sort((first, second) => first.powerupTimer - second.powerupTimer)[0] || null;
}

function hasActivePowerup() {
  return state.players.some(
    (player) => player.activePowerupType && player.powerupTimer > 0,
  );
}

function getPowerupOwnerColor(ownerId) {
  return ownerId === "p2" ? "#8fe3ff" : "#ffb449";
}

function getLeadX() {
  const alivePlayers = getAlivePlayers();
  const relevantPlayers = alivePlayers.length > 0 ? alivePlayers : state.players;
  if (relevantPlayers.length === 0) {
    return WORLD.width * 0.24;
  }
  return Math.max(...relevantPlayers.map((player) => player.bird.x));
}

function getAverageAliveY() {
  const alivePlayers = getAlivePlayers();
  const relevantPlayers = alivePlayers.length > 0 ? alivePlayers : state.players;
  if (relevantPlayers.length === 0) {
    return WORLD.height * 0.48;
  }
  const sum = relevantPlayers.reduce((total, player) => total + player.bird.y, 0);
  return sum / relevantPlayers.length;
}

function updateScore() {
  state.score = state.players.length > 0
    ? Math.max(...state.players.map((player) => player.score))
    : 0;
  scoreEl.textContent = String(state.score);
  bestScoreEl.textContent = String(state.bestScore);
}

function maybeSaveBestScore() {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    updateScore();
  }
}

function setGameMode(mode) {
  state.gameMode = mode;
  modeSwitch.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.mode === mode);
  });
  selectionLayout.classList.toggle("multi", isMultiplayerMode());
  playerSelectP2.classList.toggle("hidden-slot", !isMultiplayerMode());
  updateMenuHint();
  updateStartButtonState();
}

function updateMenuHint() {
  controlsGuide.classList.toggle("multi", isMultiplayerMode());
  controlsCardP2.classList.toggle("hidden-slot", !isMultiplayerMode());
  menuHint.textContent =
    state.gameMode === "multi_versus"
      ? "Versus: P1 mit Leertaste oder Pfeil hoch, Power-up mit E. P2 mit W, Power-up mit Q."
      : state.gameMode === "multi_coop"
        ? "Koop: P1 fliegt mit Leertaste oder Pfeil hoch und nutzt Power-ups mit E. P2 fliegt mit W und nutzt Power-ups mit Q."
      : "Solo: Leertaste, Pfeil nach oben, Mausklick oder Tap. Power-up mit E. Bremsen mit Pfeil nach unten oder S.";
}

function updateStartButtonState() {
  const ready =
    state.selectedDogs.p1 &&
    (!isMultiplayerMode() || state.selectedDogs.p2);
  startButton.disabled = !ready;
}

function renderDogGrid(slot, container) {
  container.innerHTML = "";

  dogs.forEach((dog) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "dog-option";
    option.dataset.dogId = dog.id;
    option.dataset.playerSlot = slot;

    const previewImage = state.assets.dogs.get(dog.id);
    const previewSrc = previewImage ? previewImage.src : dog.asset;

    const stats = dog.id === "sm"
      ? [
          ["Tempo", "hoch"],
          ["Hitbox", "klein"],
          ["Kontrolle", "direkt"],
        ]
      : [
          ["Tempo", "ruhiger"],
          ["Hitbox", "gross"],
          ["Kontrolle", "schwerer"],
        ];

    option.innerHTML = `
      <img src="${previewSrc}" alt="${dog.name}" />
      <div class="dog-option-title">
        <strong>${dog.name}</strong>
        <span class="tag">${dog.label}</span>
      </div>
      <p class="menu-copy">${dog.description}</p>
      ${stats.map(([label, value]) => `
        <div class="stat-row">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `).join("")}
    `;

    option.classList.toggle("selected", state.selectedDogs[slot] === dog.id);
    option.addEventListener("click", () => setSelection(slot, dog.id));
    container.appendChild(option);
  });
}

function buildDogOptions() {
  renderDogGrid("p1", dogGridP1);
  renderDogGrid("p2", dogGridP2);
}

function setSelection(slot, dogId) {
  state.selectedDogs[slot] = dogId;
  buildDogOptions();
  updateStartButtonState();
}

function computeCourseProfile() {
  const selectedPlayers = PLAYER_CONFIG.slice(0, getRequiredPlayerCount())
    .map((config) => dogs.find((dog) => dog.id === state.selectedDogs[config.id]))
    .filter(Boolean);

  const average = (items, key) =>
    items.reduce((sum, item) => sum + item[key], 0) / items.length;

  state.course.scrollSpeed = average(selectedPlayers, "scrollSpeed");
  state.course.pipeGap = Math.round(average(selectedPlayers, "pipeGap"));
}

function createPlayer(config) {
  const dog = dogs.find((entry) => entry.id === state.selectedDogs[config.id]);
  return {
    id: config.id,
    label: config.label,
    shortLabel: config.shortLabel,
    color: config.color,
    spawnRatio: config.xRatio,
    dog,
    bird: createBird(dog, config),
    alive: true,
    finishReason: null,
    inventoryPowerupType: null,
    activePowerupType: null,
    powerupTimer: 0,
    powerupHoldY: null,
    lives: 3,
    score: 0,
    postFiftyStreak: 0,
    invulnerableTimer: 0,
  };
}

function rebalanceCoopLives() {
  if (!isCoopMode() || state.players.length !== 2) {
    return;
  }

  const [first, second] = state.players;
  if (!first.alive || !second.alive || first.lives <= 0 || second.lives <= 0) {
    return;
  }

  if (Math.abs(first.lives - second.lives) <= 1) {
    return;
  }

  const totalLives = first.lives + second.lives;
  const lowerCurrent = first.lives <= second.lives ? first : second;
  const higherCurrent = lowerCurrent === first ? second : first;
  lowerCurrent.lives = Math.ceil(totalLives / 2);
  higherCurrent.lives = Math.floor(totalLives / 2);
}

function resetRun() {
  computeCourseProfile();
  state.players = PLAYER_CONFIG.slice(0, getRequiredPlayerCount()).map(createPlayer);
  state.pipes = [];
  state.powerups = [];
  state.balls = [];
  state.score = 0;
  state.pipeSpawnCount = 0;
  state.nextPowerupAt = isMultiplayerMode() ? 2 : 4;
  state.scrollOffset = 0;
  state.backgroundOffset = 0;
  state.cloudsOffset = 0;
  state.countdownTimer = 0;
  state.countdownValue = 3;
  state.elapsedRunTime = 0;
  state.isBraking = false;
  state.forceNextPipeGapCenterY = null;
  state.forcePipeAlignmentCount = 0;
  state.lastStandingPlayerId = null;
  state.lastTime = 0;
  state.cloudPuffs = createCloudPuffs();
  updateScore();
  spawnPipe(WORLD.width + 180);
}

function spawnPipe(x = WORLD.width + 120) {
  const gap = state.course.pipeGap;
  const topMargin = 72;
  const bottomMargin = WORLD.groundHeight + 42;
  const minGapY = topMargin;
  const maxGapY = WORLD.height - bottomMargin - gap;
  const ballDensity =
    state.gameMode === "single"
      ? {
          cooldownBase: 0.8,
          cooldownRange: 1.5,
          probabilityBase: 0.14,
          probabilityRamp: 0.24,
          maxBurst: 1,
        }
      : state.gameMode === "multi_versus"
        ? {
            cooldownBase: 0.95,
            cooldownRange: 1.55,
            probabilityBase: 0.16,
            probabilityRamp: 0.26,
            maxBurst: 1,
          }
        : {
            cooldownBase: 0.75,
            cooldownRange: 1.45,
            probabilityBase: 0.12,
            probabilityRamp: 0.28,
            maxBurst: 1,
          };
  let gapY;

  if (state.forceNextPipeGapCenterY !== null && state.forcePipeAlignmentCount > 0) {
    gapY = Math.min(
      maxGapY,
      Math.max(minGapY, state.forceNextPipeGapCenterY - gap / 2),
    );
    state.forcePipeAlignmentCount -= 1;
    if (state.forcePipeAlignmentCount <= 0) {
      state.forceNextPipeGapCenterY = null;
    }
  } else {
    gapY = topMargin + Math.random() * (WORLD.height - topMargin - bottomMargin - gap);
  }

  state.pipes.push({
    x,
    gapY,
    width: WORLD.pipeWidth,
    gap,
    scored: false,
    scoredBy: new Set(),
    ballCooldown: ballDensity.cooldownBase + Math.random() * ballDensity.cooldownRange,
    ballsLeft:
      Math.random() <
        ballDensity.probabilityBase +
          Math.min(1, state.elapsedRunTime / 40) * ballDensity.probabilityRamp
        ? 1 +
          Math.floor(
            Math.random() * (1 + Math.min(ballDensity.maxBurst, state.elapsedRunTime / 18)),
          )
        : 0,
    nextBallSide: Math.random() < 0.5 ? "top" : "bottom",
  });

  state.pipeSpawnCount += 1;
  maybeSpawnPowerup(x, gapY, gap);
}

function maybeSpawnPowerup(pipeX, gapY, gap) {
  if (hasActivePowerup() || state.powerups.length > 0) {
    return;
  }
  if (state.pipeSpawnCount < state.nextPowerupAt) {
    return;
  }

  state.nextPowerupAt += isMultiplayerMode()
    ? 2 + Math.floor(Math.random() * 2)
    : 4 + Math.floor(Math.random() * 2);
  const type = Math.random() < 0.55 ? "rocket" : "parachute";
  const eligibleOwners = getAlivePlayers()
    .filter((player) => !player.inventoryPowerupType)
    .map((player) => player.id);
  const ownerPool = eligibleOwners.length > 0 ? eligibleOwners : ["p1"];
  const ownerId = isMultiplayerMode()
    ? ownerPool[Math.floor(Math.random() * ownerPool.length)]
    : "p1";
  state.powerups.push({
    type,
    ownerId,
    x: pipeX + WORLD.pipeWidth * 0.5,
    y: gapY + gap * (0.35 + Math.random() * 0.3),
    size: 58,
    phase: Math.random() * Math.PI * 2,
  });
}

function spawnBallObstacle(pipe) {
  const intensity = Math.min(1, state.elapsedRunTime / 40);
  const launchFromTop = pipe.nextBallSide === "top";
  const size = 40 + Math.random() * 12 + intensity * 10;
  const upperLaneMin = size / 2 + 18;
  const upperLaneMax = Math.max(upperLaneMin + 8, pipe.gapY - size / 2 - 16);
  const lowerLaneMin = pipe.gapY + pipe.gap + size / 2 + 16;
  const lowerLaneMax = WORLD.height - WORLD.groundHeight - size / 2 - 14;
  const laneMin = launchFromTop ? upperLaneMin : lowerLaneMin;
  const laneMax = launchFromTop
    ? upperLaneMax
    : Math.max(lowerLaneMin + 8, lowerLaneMax);
  const spawnY = laneMin + Math.random() * Math.max(1, laneMax - laneMin);
  const baseDrift = 18 + Math.random() * 20 + intensity * 14;

  state.balls.push({
    x: pipe.x + pipe.width / 2 + 10,
    y: spawnY,
    baseY: spawnY,
    size,
    speedMultiplier: 0.68 + Math.random() * 0.34 + intensity * 0.24,
    driftY: launchFromTop ? baseDrift : -baseDrift,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.9 + Math.random() * 1.4,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * (2.2 + intensity * 1.8),
    lane: launchFromTop ? "top" : "bottom",
    laneMin,
    laneMax,
  });
}

function startGame() {
  if (startButton.disabled) {
    return;
  }

  enterFullscreen();
  resetRun();
  state.status = "countdown";
  state.countdownTimer = 3;
  state.countdownValue = 3;
  menuOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
}

function openMenu() {
  state.status = "menu";
  state.isBraking = false;
  menuOverlay.classList.remove("hidden");
  gameOverOverlay.classList.add("hidden");
}

async function enterFullscreen() {
  const root = document.documentElement;

  if (document.fullscreenElement) {
    updateFullscreenButtonLabel();
    return;
  }

  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen();
    }
  } catch (error) {
    document.body.classList.add("game-fullscreen");
  }

  updateFullscreenButtonLabel();
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      document.body.classList.remove("game-fullscreen");
    }
    updateFullscreenButtonLabel();
    return;
  }

  if (document.body.classList.contains("game-fullscreen")) {
    document.body.classList.remove("game-fullscreen");
    updateFullscreenButtonLabel();
    return;
  }

  await enterFullscreen();
}

function updateFullscreenButtonLabel() {
  const isFullscreen =
    Boolean(document.fullscreenElement) ||
    document.body.classList.contains("game-fullscreen");
  fullscreenButton.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
  document.body.classList.toggle("game-fullscreen", isFullscreen);
}

function flap(playerId) {
  if (state.status === "menu") {
    startGame();
    return;
  }

  if (state.status !== "playing") {
    return;
  }

  const player = state.players.find((entry) => entry.id === playerId && entry.alive);
  if (!player || isPlayerPowerupActive(player, "rocket")) {
    return;
  }

  player.bird.velocityY = player.dog.flap;
}

function getBirdHitbox(player) {
  const scale = player.dog.hitboxScale;
  const width = player.bird.width * scale;
  const height = player.bird.height * scale;
  return {
    x: player.bird.x - width / 2,
    y: player.bird.y - height / 2,
    width,
    height,
  };
}

function getPowerupHitbox(powerup) {
  return {
    x: powerup.x - powerup.size / 2,
    y: powerup.y - powerup.size / 2,
    width: powerup.size,
    height: powerup.size,
  };
}

function getBallHitbox(ball) {
  const size = ball.size * 0.74;
  return {
    x: ball.x - size / 2,
    y: ball.y - size / 2,
    width: size,
    height: size,
  };
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clearPlayerPowerup(player, { alignPipes = false } = {}) {
  if (!player) {
    return;
  }

  if (alignPipes && isPlayerPowerupActive(player, "rocket")) {
    state.forceNextPipeGapCenterY = player.bird.y;
    state.forcePipeAlignmentCount = 2;
  }

  player.activePowerupType = null;
  player.powerupTimer = 0;
  player.powerupHoldY = null;
}

function awardPipePoint(player) {
  player.score += 1;

  if (player.score === 50) {
    player.postFiftyStreak = 0;
    return;
  }

  if (player.score > 50) {
    player.postFiftyStreak += 1;
    if (player.postFiftyStreak >= 5) {
      player.lives += 1;
      player.postFiftyStreak = 0;
      rebalanceCoopLives();
    }
  }
}

function respawnPlayer(player) {
  player.bird = createBird(player.dog, { xRatio: player.spawnRatio });
  player.bird.y = Math.min(
    WORLD.height - WORLD.groundHeight - player.bird.height / 2 - 20,
    Math.max(player.bird.height / 2 + 20, getAverageAliveY()),
  );
  player.bird.velocityY = -40;
  player.powerupHoldY = null;
  player.invulnerableTimer = 2.8;
}

function finishRound() {
  maybeSaveBestScore();

  if (state.gameMode === "single") {
    const player = state.players[0];
    const title =
      player.finishReason === "ground"
        ? "Hart gelandet."
        : player.finishReason === "ball"
          ? "Ballkontakt."
          : "Rohrkontakt.";
    gameOverTitle.textContent = title;
    gameOverCopy.textContent = `${player.dog.name} hat ${player.score} Punkte gesammelt.`;
  } else if (state.gameMode === "multi_versus") {
    const winner = state.players.find((player) => player.id === state.lastStandingPlayerId) || null;
    if (winner) {
      gameOverTitle.textContent = `${winner.shortLabel} gewinnt!`;
      gameOverCopy.textContent = `${winner.dog.name} hat laenger ueberlebt und ${winner.score} Punkte gesammelt.`;
    } else {
      gameOverTitle.textContent = "Unentschieden.";
      gameOverCopy.textContent = `Beide Hunde sind raus. Gemeinsamer Score: ${state.score}.`;
    }
  } else {
    gameOverTitle.textContent = "Koop-Runde vorbei.";
    gameOverCopy.textContent = `Ein Hund hat keine Leben mehr. Gemeinsamer Score: ${state.score}.`;
  }

  state.status = "gameover";
  state.isBraking = false;
  gameOverOverlay.classList.remove("hidden");
}

function eliminatePlayer(player, reason) {
  if (!player.alive || isPlayerProtected(player)) {
    return;
  }

  player.lives -= 1;
  player.postFiftyStreak = 0;
  clearPlayerPowerup(player);

  if (isCoopMode()) {
    if (player.lives <= 0) {
      state.players.forEach((entry) => {
        entry.alive = false;
        entry.finishReason = entry.id === player.id ? reason : "team";
        entry.bird.velocityY = 0;
      });
      finishRound();
      return;
    }

    rebalanceCoopLives();
    player.finishReason = reason;
    respawnPlayer(player);
    return;
  }

  if (player.lives > 0) {
    player.finishReason = reason;
    respawnPlayer(player);
    return;
  }

  player.alive = false;
  player.finishReason = reason;
  player.bird.velocityY = 0;

  const alivePlayers = getAlivePlayers();
  if (state.gameMode === "multi_versus" && alivePlayers.length === 1) {
    state.lastStandingPlayerId = alivePlayers[0].id;
  }

  if (alivePlayers.length === 0) {
    finishRound();
  }
}

function activateStoredPowerup(playerId) {
  if (state.status !== "playing") {
    return;
  }

  const player = state.players.find((entry) => entry.id === playerId && entry.alive);
  if (!player || !player.inventoryPowerupType || player.activePowerupType) {
    return;
  }

  const type = player.inventoryPowerupType;
  player.inventoryPowerupType = null;
  player.activePowerupType = type;
  player.powerupTimer = type === "rocket" ? 3 : 5;

  if (type === "rocket") {
    player.powerupHoldY = Math.min(
      WORLD.height - WORLD.groundHeight - player.bird.height / 2 - 12,
      Math.max(player.bird.height / 2 + 12, player.bird.y),
    );
    player.bird.y = player.powerupHoldY;
    player.bird.velocityY = 0;
    return;
  }

  player.powerupHoldY = null;
  player.bird.velocityY = Math.min(player.bird.velocityY, 70);
}

function update(dt) {
  if (state.players.length === 0) {
    return;
  }

  if (state.status === "countdown") {
    state.players.forEach((player) => {
      if (player.alive) {
        player.bird.bobPhase += dt * 7;
      }
    });
    state.countdownTimer = Math.max(0, state.countdownTimer - dt);
    state.countdownValue = Math.max(1, Math.ceil(state.countdownTimer));

    if (state.countdownTimer <= 0) {
      state.status = "playing";
      state.players.forEach((player) => {
        player.bird.velocityY = 0;
      });
    }
    return;
  }

  if (state.status !== "playing") {
    return;
  }

  state.elapsedRunTime += dt;
  const rocketActive = state.players.some((player) => isPlayerPowerupActive(player, "rocket"));
  const scrollFactor = rocketActive ? 2.55 : state.isBraking ? 0.55 : 1;
  const scrollSpeed = state.course.scrollSpeed * scrollFactor;

  state.scrollOffset += scrollSpeed * dt;
  state.backgroundOffset += scrollSpeed * 0.08 * dt;
  state.cloudsOffset += scrollSpeed * 0.18 * dt;

  const floorY = WORLD.height - WORLD.groundHeight;

  state.players.forEach((player) => {
    if (!player.alive) {
      return;
    }

    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
    }

    if (player.activePowerupType) {
      player.powerupTimer = Math.max(0, player.powerupTimer - dt);
    }

    if (isPlayerPowerupActive(player, "rocket")) {
      player.bird.velocityY = 0;
      player.bird.y = player.powerupHoldY ?? player.bird.y;
      player.bird.bobPhase += dt * 18;
    } else {
      const gravityScale = isPlayerPowerupActive(player, "parachute") ? 0.34 : 1;
      player.bird.velocityY += player.dog.gravity * gravityScale * dt;
      if (isPlayerPowerupActive(player, "parachute")) {
        player.bird.velocityY = Math.min(player.bird.velocityY, 140);
      }
      player.bird.y += player.bird.velocityY * dt;
      player.bird.bobPhase += dt * (isPlayerPowerupActive(player, "parachute") ? 7 : 11);
    }

    if (player.bird.y + player.bird.height / 2 >= floorY) {
      player.bird.y = floorY - player.bird.height / 2;
      eliminatePlayer(player, "ground");
      return;
    }

    if (player.bird.y - player.bird.height / 2 <= 0) {
      player.bird.y = player.bird.height / 2;
      player.bird.velocityY = Math.max(player.bird.velocityY, 40);
    }
  });

  if (state.status === "gameover") {
    return;
  }

  state.players.forEach((player) => {
    if (player.activePowerupType && player.powerupTimer <= 0) {
      clearPlayerPowerup(player, { alignPipes: true });
    }
  });

  for (const cloud of state.cloudPuffs) {
    cloud.x -= cloud.speed * dt;
    if (cloud.x + cloud.width < -20) {
      cloud.x = WORLD.width + Math.random() * 120;
      cloud.y = 40 + Math.random() * 210;
    }
  }

  const lastPipe = state.pipes[state.pipes.length - 1];
  if (!lastPipe || lastPipe.x < WORLD.width - state.spawnDistance) {
    spawnPipe();
  }

  state.powerups.forEach((powerup) => {
    powerup.x -= scrollSpeed * dt;
    powerup.phase += dt * 6;

    getAlivePlayers().forEach((player) => {
      if (
        !powerup.collected &&
        powerup.ownerId === player.id &&
        !player.inventoryPowerupType &&
        intersects(getBirdHitbox(player), getPowerupHitbox(powerup))
      ) {
        player.inventoryPowerupType = powerup.type;
        powerup.collected = true;
      }
    });
  });

  state.powerups = state.powerups.filter(
    (powerup) => !powerup.collected && powerup.x + powerup.size > -40,
  );

  state.balls.forEach((ball) => {
    ball.x -= scrollSpeed * ball.speedMultiplier * dt;
    ball.baseY += ball.driftY * dt;
    ball.wobblePhase += dt * ball.wobbleSpeed;
    ball.rotation += dt * ball.spin;

    if (ball.baseY <= ball.laneMin || ball.baseY >= ball.laneMax) {
      ball.baseY = Math.min(ball.laneMax, Math.max(ball.laneMin, ball.baseY));
      ball.driftY *= -1;
    }

    const wobbleLimit = Math.min(8 + ball.size * 0.05, (ball.laneMax - ball.laneMin) * 0.25);
    ball.y = ball.baseY + Math.sin(ball.wobblePhase) * wobbleLimit;

    getAlivePlayers().forEach((player) => {
      if (
        state.status === "playing" &&
        !isPlayerPowerupActive(player, "rocket") &&
        !isPlayerProtected(player) &&
        intersects(getBirdHitbox(player), getBallHitbox(ball))
      ) {
        eliminatePlayer(player, "ball");
      }
    });
  });

  state.balls = state.balls.filter((ball) => ball.x + ball.size > -80);

  state.pipes.forEach((pipe) => {
    pipe.x -= scrollSpeed * dt;
    pipe.ballCooldown -= dt;

    if (pipe.ballsLeft > 0 && pipe.x < WORLD.width - 40 && pipe.ballCooldown <= 0) {
      spawnBallObstacle(pipe);
      pipe.ballsLeft -= 1;
      pipe.nextBallSide = pipe.nextBallSide === "top" ? "bottom" : "top";
      pipe.ballCooldown =
        Math.max(0.38, 1.1 - Math.min(1, state.elapsedRunTime / 45) * 0.45) +
        Math.random() * 0.45;
    }

    getAlivePlayers().forEach((player) => {
      if (!pipe.scoredBy.has(player.id) && pipe.x + pipe.width < player.bird.x) {
        pipe.scoredBy.add(player.id);
        awardPipePoint(player);
        updateScore();
        maybeSaveBestScore();
      }
    });

    const topPipe = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapY };
    const bottomPipe = {
      x: pipe.x,
      y: pipe.gapY + pipe.gap,
      width: pipe.width,
      height: floorY - (pipe.gapY + pipe.gap),
    };

    getAlivePlayers().forEach((player) => {
      if (
        state.status === "playing" &&
        !isPlayerPowerupActive(player, "rocket") &&
        !isPlayerProtected(player) &&
        (intersects(getBirdHitbox(player), topPipe) ||
          intersects(getBirdHitbox(player), bottomPipe))
      ) {
        eliminatePlayer(player, "pipe");
      }
    });
  });

  state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.width > -40);
}

function drawRoundedRect(x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  skyGradient.addColorStop(0, "#5dc0ff");
  skyGradient.addColorStop(0.55, "#99ddff");
  skyGradient.addColorStop(1, "#f5deb5");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  if (state.assets.background) {
    const image = state.assets.background;
    const scale = WORLD.height / image.height;
    const width = image.width * scale;
    const offset = -(state.backgroundOffset % width);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(image, offset, 0, width, WORLD.height);
    ctx.drawImage(image, offset + width, 0, width, WORLD.height);
    ctx.globalAlpha = 1;
    return;
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.arc(140, 108, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(40, 124, 190, 0.18)";
  ctx.fillRect(0, WORLD.height - 160, WORLD.width, 40);

  const hills = [
    { x: 30, width: 320, height: 140, color: "#4d875a" },
    { x: 260, width: 320, height: 120, color: "#4b9660" },
    { x: 520, width: 360, height: 148, color: "#5aa468" },
    { x: 760, width: 300, height: 126, color: "#4d875a" },
  ];

  hills.forEach((hill) => {
    ctx.fillStyle = hill.color;
    ctx.beginPath();
    ctx.ellipse(
      hill.x,
      WORLD.height - WORLD.groundHeight + 12,
      hill.width,
      hill.height,
      0,
      Math.PI,
      Math.PI * 2,
      true,
    );
    ctx.fill();
  });
}

function drawClouds() {
  if (state.assets.clouds || state.assets.cloudsEvil) {
    if (state.assets.clouds) {
      const image = state.assets.clouds;
      const scale = 0.62;
      const width = image.width * scale;
      const height = image.height * scale;
      const offset = -(state.cloudsOffset % width);
      ctx.globalAlpha = 0.82;
      ctx.drawImage(image, offset, 32, width, height);
      ctx.drawImage(image, offset + width, 32, width, height);
    }

    if (state.assets.cloudsEvil) {
      const image = state.assets.cloudsEvil;
      const scale = 0.66;
      const width = image.width * scale;
      const height = image.height * scale;
      const offset = -((state.cloudsOffset * 0.74) % width);
      ctx.globalAlpha = 0.56;
      ctx.drawImage(image, offset, 118, width, height);
      ctx.drawImage(image, offset + width, 118, width, height);
    }

    ctx.globalAlpha = 1;
    return;
  }

  state.cloudPuffs.forEach((cloud) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${cloud.alpha})`;
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.width, cloud.height, 0, 0, Math.PI * 2);
    ctx.ellipse(
      cloud.x + cloud.width * 0.32,
      cloud.y - 12,
      cloud.width * 0.62,
      cloud.height * 0.95,
      0,
      0,
      Math.PI * 2,
    );
    ctx.ellipse(
      cloud.x - cloud.width * 0.34,
      cloud.y - 8,
      cloud.width * 0.54,
      cloud.height * 0.78,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
}

function drawPipe(pipe) {
  const floorY = WORLD.height - WORLD.groundHeight;
  const colorTop = "#5dd05f";
  const colorSide = "#3ea14f";
  const capHeight = 26;

  drawRoundedRect(pipe.x, 0, pipe.width, pipe.gapY, 22, colorTop);
  drawRoundedRect(pipe.x - 8, pipe.gapY - capHeight, pipe.width + 16, capHeight, 16, colorSide);

  const bottomY = pipe.gapY + pipe.gap;
  drawRoundedRect(pipe.x, bottomY, pipe.width, floorY - bottomY, 22, colorTop);
  drawRoundedRect(pipe.x - 8, bottomY, pipe.width + 16, capHeight, 16, colorSide);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(pipe.x + 14, 0, 16, pipe.gapY);
  ctx.fillRect(pipe.x + 14, bottomY, 16, floorY - bottomY);
}

function drawPowerups() {
  state.powerups.forEach((powerup) => {
    const pulse = 1 + Math.sin(powerup.phase) * 0.08;
    const size = powerup.size * pulse;
    const x = powerup.x - size / 2;
    const y = powerup.y - size / 2;
    const ownerColor = getPowerupOwnerColor(powerup.ownerId);
    const sprite =
      powerup.type === "parachute"
        ? state.assets.parachute
        : state.assets.powerupRocket;

    ctx.save();
    ctx.shadowColor = ownerColor;
    ctx.shadowBlur = 26;
    ctx.fillStyle = powerup.ownerId === "p2"
      ? "rgba(143, 227, 255, 0.16)"
      : "rgba(255, 185, 92, 0.18)";
    ctx.beginPath();
    ctx.arc(powerup.x, powerup.y, size * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = ownerColor;
    ctx.stroke();

    if (sprite) {
      ctx.drawImage(sprite, x, y, size, size);
    }

    if (isMultiplayerMode()) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f6f0e5";
      ctx.textAlign = "center";
      ctx.font = '700 12px "Avenir Next", "Trebuchet MS", sans-serif';
      ctx.fillText(powerup.ownerId === "p2" ? "P2" : "P1", powerup.x, powerup.y + size * 0.9);
      ctx.textAlign = "start";
    }

    ctx.restore();
  });
}

function drawBallObstacles() {
  state.balls.forEach((ball) => {
    const image = state.assets.ball;
    const size = ball.size;

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    ctx.shadowColor = "rgba(15, 20, 35, 0.28)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    if (image) {
      ctx.drawImage(image, -size / 2, -size / 2, size, size);
    } else {
      const gradient = ctx.createRadialGradient(-size * 0.12, -size * 0.14, size * 0.1, 0, 0, size * 0.55);
      gradient.addColorStop(0, "#ffe07c");
      gradient.addColorStop(0.55, "#ff9f1c");
      gradient.addColorStop(1, "#d14d15");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawRocketFlame(player) {
  if (!isPlayerPowerupActive(player, "rocket") || !player.alive) {
    return;
  }

  const centerY = player.bird.y + Math.sin(player.bird.bobPhase * 1.4) * 2;
  const flameLength = 34 + Math.sin(player.bird.bobPhase * 2.6) * 7;
  const tailX = player.bird.x - player.bird.width / 2 + 2;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const outer = ctx.createLinearGradient(tailX - flameLength, centerY, tailX, centerY);
  outer.addColorStop(0, "rgba(255, 70, 0, 0)");
  outer.addColorStop(0.2, "rgba(255, 96, 24, 0.65)");
  outer.addColorStop(0.65, "rgba(255, 190, 70, 0.95)");
  outer.addColorStop(1, "rgba(255, 255, 214, 0.92)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(tailX, centerY);
  ctx.lineTo(tailX - flameLength, centerY - 16);
  ctx.lineTo(tailX - flameLength * 0.84, centerY);
  ctx.lineTo(tailX - flameLength, centerY + 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 250, 220, 0.9)";
  ctx.beginPath();
  ctx.moveTo(tailX + 2, centerY);
  ctx.lineTo(tailX - flameLength * 0.52, centerY - 7);
  ctx.lineTo(tailX - flameLength * 0.72, centerY);
  ctx.lineTo(tailX - flameLength * 0.52, centerY + 7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawParachute(player) {
  if (!isPlayerPowerupActive(player, "parachute") || !player.alive) {
    return;
  }

  const canopyWidth = player.bird.width * 1.2;
  const canopyHeight = player.bird.height * 1.15;
  const centerX = player.bird.x;
  const topY = player.bird.y - player.bird.height / 2 - canopyHeight * 0.72;
  const image = state.assets.parachute;

  if (image) {
    ctx.drawImage(
      image,
      centerX - canopyWidth / 2,
      topY,
      canopyWidth,
      canopyHeight,
    );
  } else {
    ctx.fillStyle = "rgba(143, 227, 255, 0.88)";
    ctx.beginPath();
    ctx.arc(centerX, topY + canopyHeight * 0.55, canopyWidth / 2, Math.PI, 0);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255, 244, 232, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - canopyWidth * 0.22, topY + canopyHeight * 0.72);
  ctx.lineTo(centerX - player.bird.width * 0.18, player.bird.y - player.bird.height * 0.15);
  ctx.moveTo(centerX + canopyWidth * 0.22, topY + canopyHeight * 0.72);
  ctx.lineTo(centerX + player.bird.width * 0.18, player.bird.y - player.bird.height * 0.15);
  ctx.stroke();
}

function drawPlayers() {
  state.players.forEach((player) => {
    if (!player.alive) {
      return;
    }

    const image = state.assets.dogs.get(player.dog.id);
    const bob = Math.sin(player.bird.bobPhase) * 3;

    drawParachute(player);
    drawRocketFlame(player);

    ctx.save();
    if (player.invulnerableTimer > 0) {
      ctx.globalAlpha = Math.sin(performance.now() / 70) > 0 ? 0.45 : 0.95;
    }
    ctx.translate(player.bird.x, player.bird.y + bob);

    if (image) {
      ctx.drawImage(
        image,
        -player.bird.width / 2,
        -player.bird.height / 2,
        player.bird.width,
        player.bird.height,
      );
    } else {
      ctx.fillStyle = player.dog.id === "sm" ? "#ffd166" : "#ff8c42";
      ctx.beginPath();
      ctx.ellipse(0, 0, player.bird.width / 2, player.bird.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (isMultiplayerMode()) {
      drawRoundedRect(
        player.bird.x - 48,
        player.bird.y - player.bird.height / 2 - 32,
        96,
        24,
        12,
        "rgba(8, 18, 38, 0.55)",
      );
      ctx.fillStyle = player.color;
      ctx.font = '700 13px "Avenir Next", "Trebuchet MS", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        `${player.shortLabel}  L${player.lives}`,
        player.bird.x,
        player.bird.y - player.bird.height / 2 - 15,
      );
      ctx.textAlign = "start";
    }
  });
}

function drawGround() {
  const floorY = WORLD.height - WORLD.groundHeight;
  ctx.fillStyle = "#d79f54";
  ctx.fillRect(0, floorY, WORLD.width, WORLD.groundHeight);

  ctx.fillStyle = "#8a5d34";
  ctx.fillRect(0, floorY, WORLD.width, 12);

  const stripeWidth = 54;
  const offset = -(state.scrollOffset % stripeWidth);

  for (let x = offset; x < WORLD.width + stripeWidth; x += stripeWidth) {
    ctx.fillStyle = (Math.floor((x - offset) / stripeWidth) % 2 === 0) ? "#f0c56e" : "#e6ae4c";
    ctx.fillRect(x, floorY + 12, stripeWidth, WORLD.groundHeight - 12);
  }

  ctx.strokeStyle = "rgba(118, 65, 28, 0.32)";
  ctx.lineWidth = 3;
  for (let x = offset; x < WORLD.width + stripeWidth; x += stripeWidth) {
    ctx.beginPath();
    ctx.moveTo(x, floorY + 14);
    ctx.lineTo(x + stripeWidth, WORLD.height);
    ctx.stroke();
  }
}

function drawHudText() {
  const titleWidth = isMultiplayerMode() ? 560 : 430;
  const titleHeight = isMultiplayerMode() ? 108 : 82;
  drawRoundedRect(18, 18, titleWidth, titleHeight, 20, "rgba(8, 18, 38, 0.38)");
  ctx.fillStyle = "#f6f0e5";
  ctx.font = '700 22px "Avenir Next", "Trebuchet MS", sans-serif';
  ctx.fillText(
    state.gameMode === "multi_versus"
      ? "2 Spieler local versus"
      : state.gameMode === "multi_coop"
        ? "2 Spieler koop"
        : `${state.players[0]?.dog.name || "Hund"} fliegt`,
    34,
    48,
  );
  ctx.fillStyle = "rgba(246, 240, 229, 0.76)";
  ctx.font = '500 15px "Avenir Next", "Trebuchet MS", sans-serif';

  if (state.status === "playing") {
    if (isMultiplayerMode()) {
      const p1 = state.players.find((player) => player.id === "p1");
      const p2 = state.players.find((player) => player.id === "p2");
      const p1Active = p1?.activePowerupType
        ? ` aktiv ${getPowerupName(p1.activePowerupType)} ${p1.powerupTimer.toFixed(1)}s`
        : "";
      const p2Active = p2?.activePowerupType
        ? ` aktiv ${getPowerupName(p2.activePowerupType)} ${p2.powerupTimer.toFixed(1)}s`
        : "";
      ctx.fillText(
        `P1 ${p1?.score ?? 0}P L${p1?.lives ?? 0} Slot ${getPowerupName(p1?.inventoryPowerupType)}${p1Active}`,
        34,
        72,
      );
      ctx.fillText(
        `P2 ${p2?.score ?? 0}P L${p2?.lives ?? 0} Slot ${getPowerupName(p2?.inventoryPowerupType)}${p2Active}`,
        34,
        94,
      );
    } else {
      const solo = state.players[0];
      const streakText =
        solo && solo.score >= 50
          ? ` | Bonus ${solo.postFiftyStreak}/5`
          : "";
      const powerupText = solo?.activePowerupType
        ? ` | ${getPowerupName(solo.activePowerupType)} aktiv ${solo.powerupTimer.toFixed(1)}s`
        : solo?.inventoryPowerupType
          ? ` | E: ${getPowerupName(solo.inventoryPowerupType)} einsetzen`
          : "";
      const brakeText = state.isBraking ? " | Bremse aktiv" : "";
      ctx.fillText(
        `Tippen oder Leertaste | Leben ${solo?.lives ?? 0}${streakText}${powerupText}${brakeText}`,
        34,
        72,
      );
    }
  } else if (state.status === "countdown") {
    ctx.fillText(
      isMultiplayerMode()
        ? "P1: Space/Up, Power-up E | P2: W, Power-up Q"
        : "Bereit machen, Start in 3 Sekunden",
      34,
      72,
    );
  } else if (state.status === "menu") {
    ctx.fillText("Hund waehlen und starten", 34, 72);
  } else {
    ctx.fillText("Nochmal fliegen oder Hund wechseln", 34, 72);
  }
}

function drawPowerupWarning() {
  const player = getFirstActivePowerupPlayer();
  if (!player || player.powerupTimer <= 0 || player.powerupTimer > 2) {
    return;
  }

  const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 110);
  const secondsLeft = player.powerupTimer.toFixed(1);
  drawRoundedRect(
    WORLD.width / 2 - 180,
    28,
    360,
    62,
    18,
    player.activePowerupType === "parachute"
      ? `rgba(24, 109, 141, ${0.28 + pulse * 0.22})`
      : `rgba(183, 46, 28, ${0.28 + pulse * 0.22})`,
  );
  ctx.fillStyle = "#fff4e8";
  ctx.textAlign = "center";
  ctx.font = '700 18px "Avenir Next", "Trebuchet MS", sans-serif';
  ctx.fillText(
    player.activePowerupType === "parachute"
      ? `${isMultiplayerMode() ? `${player.shortLabel}: ` : ""}Fallschirm endet gleich`
      : `${isMultiplayerMode() ? `${player.shortLabel}: ` : ""}Duese endet gleich`,
    WORLD.width / 2,
    52,
  );
  ctx.font = '600 16px "Avenir Next", "Trebuchet MS", sans-serif';
  ctx.fillText(`${secondsLeft}s bis Power-up-Ende`, WORLD.width / 2, 72);
  ctx.textAlign = "start";
}

function drawCountdown() {
  if (state.status !== "countdown") {
    return;
  }

  drawRoundedRect(
    WORLD.width / 2 - 110,
    WORLD.height / 2 - 110,
    220,
    220,
    36,
    "rgba(8, 18, 38, 0.44)",
  );

  ctx.fillStyle = "#f8f2e8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 112px Georgia, "Times New Roman", serif';
  ctx.fillText(String(state.countdownValue), WORLD.width / 2, WORLD.height / 2 + 8);
  ctx.font = '600 20px "Avenir Next", "Trebuchet MS", sans-serif';
  ctx.fillStyle = "rgba(248, 242, 232, 0.86)";
  ctx.fillText(
    isMultiplayerMode() ? "P1 Space/Up, P2 W" : "Gleich geht's los",
    WORLD.width / 2,
    WORLD.height / 2 + 76,
  );
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function render() {
  drawBackground();
  drawClouds();
  drawPowerups();
  drawBallObstacles();
  state.pipes.forEach(drawPipe);
  drawGround();
  drawPlayers();
  drawHudText();
  drawPowerupWarning();
  drawCountdown();
}

function frame(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.025);
  state.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(frame);
}

function handleBrakeKey(code, isPressed) {
  const brakeCodes = PLAYER_CONFIG.flatMap((player) => player.brakeKeys);
  if (brakeCodes.includes(code)) {
    state.isBraking = isPressed;
    return true;
  }
  return false;
}

function setupControls() {
  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);
  changeDogButton.addEventListener("click", openMenu);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);

  modeSwitch.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => setGameMode(button.dataset.mode));
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyF") {
      event.preventDefault();
      toggleFullscreen();
      return;
    }

    if (handleBrakeKey(event.code, true)) {
      event.preventDefault();
      return;
    }

    for (const player of PLAYER_CONFIG) {
      if (player.activateKeys.includes(event.code)) {
        event.preventDefault();
        activateStoredPowerup(player.id);
        return;
      }

      if (player.flapKeys.includes(event.code)) {
        event.preventDefault();

        if (state.status === "gameover") {
          startGame();
          return;
        }

        flap(player.id);
        return;
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    handleBrakeKey(event.code, false);
  });

  window.addEventListener("blur", () => {
    state.isBraking = false;
  });

  canvas.addEventListener("pointerdown", () => {
    if (state.status === "gameover") {
      startGame();
      return;
    }

    flap("p1");
  });
}

async function init() {
  await loadAssets();
  buildDogOptions();
  setupControls();
  state.cloudPuffs = createCloudPuffs();
  setGameMode("single");
  render();
  requestAnimationFrame(frame);
}

init();
