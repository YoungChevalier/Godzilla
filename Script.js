// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const GROUND_HEIGHT = 50;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const BASE_GAME_SPEED = 5;

// ==========================================
// GAME STATE VARIABLES
// ==========================================
let gameSpeed = BASE_GAME_SPEED;
let score = 0;
let lives = 3;
let gameActive = false;
let frameCount = 0;

// Arrays to hold entities
let obstacles = [];
let flames = [];

// ==========================================
// ENTITY DEFINITIONS
// ==========================================
const player = {
  x: 150,
  y: GROUND_Y - 40,
  width: 40,
  height: 40,
  dy: 0,
  isGrounded: true,
  color: "#0055ff", // Blue
  isInvincible: false,
  invincibilityTimer: 0,
};

const godzilla = {
  x: -20,
  y: GROUND_Y - 120,
  width: 100,
  height: 120,
  color: "#2e8b57", // Sea Green
};

// ==========================================
// DOM ELEMENTS (UI)
// ==========================================
const uiStartScreen = document.getElementById("start-screen");
const uiGameOverScreen = document.getElementById("game-over-screen");
const uiHud = document.getElementById("hud");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const finalScoreDisplay = document.getElementById("final-score");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// ==========================================
// INPUT HANDLING
// ==========================================
window.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "ArrowUp") && gameActive) {
    if (player.isGrounded) {
      player.dy = JUMP_FORCE;
      player.isGrounded = false;
    }
  }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// ==========================================
// CORE FUNCTIONS
// ==========================================
function startGame() {
  // Reset State
  gameSpeed = BASE_GAME_SPEED;
  score = 0;
  lives = 3;
  frameCount = 0;
  obstacles = [];
  flames = [];

  player.y = GROUND_Y - player.height;
  player.dy = 0;
  player.isInvincible = false;

  updateHUD();

  // Manage UI
  uiStartScreen.classList.add("hidden");
  uiGameOverScreen.classList.add("hidden");
  uiHud.classList.remove("hidden");

  gameActive = true;
  gameLoop();
}

function gameOver() {
  gameActive = false;
  uiHud.classList.add("hidden");
  uiGameOverScreen.classList.remove("hidden");
  finalScoreDisplay.innerText = Math.floor(score);
}

function takeDamage() {
  if (player.isInvincible) return; // Prevent multiple hits instantly

  lives--;
  updateHUD();

  if (lives <= 0) {
    gameOver();
  } else {
    // Give player brief invincibility frames (i-frames)
    player.isInvincible = true;
    player.invincibilityTimer = 60; // 60 frames (~1 second)
  }
}

function updateHUD() {
  scoreDisplay.innerText = Math.floor(score);
  livesDisplay.innerText = lives;
}

// ==========================================
// SPAWNING LOGIC
// ==========================================
function spawnObstacle() {
  // Basic buildings
  let minHeight = 20;
  let maxHeight = 70;
  let height = Math.floor(
    Math.random() * (maxHeight - minHeight + 1) + minHeight,
  );

  obstacles.push({
    x: CANVAS_WIDTH,
    y: GROUND_Y - height,
    width: 30,
    height: height,
    color: "#555",
  });
}

function spawnFlame() {
  // Godzilla shoots atomic breath
  flames.push({
    x: godzilla.x + godzilla.width, // Spawns from Godzilla's mouth
    y: godzilla.y + 20,
    width: 60,
    height: 15,
    speed: gameSpeed * 1.5, // Faster than obstacles
    color: "#ff4500", // Orange/Red
  });
}

// ==========================================
// COLLISION DETECTION (AABB)
// ==========================================
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// ==========================================
// GAME LOOP: UPDATE & DRAW
// ==========================================
function update() {
  frameCount++;
  score += 0.1; // Score increases with time

  // Increase difficulty over time
  if (frameCount % 600 === 0) {
    // Every ~10 seconds
    gameSpeed += 0.5;
  }

  updateHUD();

  // Player Physics
  player.dy += GRAVITY;
  player.y += player.dy;

  if (player.y + player.height >= GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.dy = 0;
    player.isGrounded = true;
  }

  // Invincibility Logic
  if (player.isInvincible) {
    player.invincibilityTimer--;
    if (player.invincibilityTimer <= 0) player.isInvincible = false;
  }

  // Move & Clean Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= gameSpeed;

    if (checkCollision(player, obs)) takeDamage();

    // Remove off-screen obstacles
    if (obs.x + obs.width < 0) obstacles.splice(i, 1);
  }

  // Move & Clean Flames
  for (let i = flames.length - 1; i >= 0; i--) {
    let flame = flames[i];
    flame.x += flame.speed - gameSpeed; // Relative speed

    if (checkCollision(player, flame)) {
      takeDamage();
      flames.splice(i, 1); // Destroy flame on hit
      continue;
    }

    // Remove off-screen flames
    if (flame.x > CANVAS_WIDTH) flames.splice(i, 1);
  }

  // Spawn Logic
  // Randomize obstacle spawn based on speed to keep gaps fair
  let spawnRate = Math.max(60, 120 - gameSpeed * 5);
  if (frameCount % Math.floor(spawnRate) === 0) {
    spawnObstacle();
  }

  // Godzilla fires every ~3 seconds roughly
  if (frameCount % 180 === 0) {
    spawnFlame();
  }
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw Ground
  ctx.fillStyle = "#654321"; // Brown
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);

  // Draw Godzilla
  ctx.fillStyle = godzilla.color;
  ctx.fillRect(godzilla.x, godzilla.y, godzilla.width, godzilla.height);
  // Godzilla Eye
  ctx.fillStyle = "red";
  ctx.fillRect(godzilla.x + 70, godzilla.y + 15, 10, 10);

  // Draw Player (Blinks if invincible)
  if (!player.isInvincible || Math.floor(frameCount / 5) % 2 === 0) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Draw Obstacles
  obstacles.forEach((obs) => {
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });

  // Draw Flames
  flames.forEach((flame) => {
    ctx.fillStyle = flame.color;
    ctx.fillRect(flame.x, flame.y, flame.width, flame.height);
    // Flame inner core
    ctx.fillStyle = "yellow";
    ctx.fillRect(flame.x + 10, flame.y + 4, flame.width - 20, flame.height - 8);
  });
}

function gameLoop() {
  if (!gameActive) return;

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

// Initial draw to show background before starting
draw();
