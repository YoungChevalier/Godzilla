// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

let obstacles = [];
let shockwaves = []; // Replaced flames with shockwaves

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
    color: '#0055ff', 
    isInvincible: false,
    invincibilityTimer: 0
};

// Kong replaces Godzilla and gets jump physics
const kong = {
    x: -10,
    y: GROUND_Y - 110,
    width: 90,
    height: 110,
    color: '#4E342E', // Dark Brown
    dy: 0,
    isJumping: false 
};

// ==========================================
// DOM ELEMENTS (UI)
// ==========================================
const uiStartScreen = document.getElementById('start-screen');
const uiGameOverScreen = document.getElementById('game-over-screen');
const uiHud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// ==========================================
// INPUT HANDLING
// ==========================================
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameActive) {
        if (player.isGrounded) {
            player.dy = JUMP_FORCE;
            player.isGrounded = false;
        }
    }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// ==========================================
// CORE FUNCTIONS
// ==========================================
function startGame() {
    gameSpeed = BASE_GAME_SPEED;
    score = 0;
    lives = 3;
    frameCount = 0;
    obstacles = [];
    shockwaves = [];
    
    player.y = GROUND_Y - player.height;
    player.dy = 0;
    player.isInvincible = false;
    
    kong.y = GROUND_Y - kong.height;
    kong.dy = 0;
    kong.isJumping = false;
    
    updateHUD();

    uiStartScreen.classList.add('hidden');
    uiGameOverScreen.classList.add('hidden');
    uiHud.classList.remove('hidden');

    gameActive = true;
    gameLoop();
}

function gameOver() {
    gameActive = false;
    uiHud.classList.add('hidden');
    uiGameOverScreen.classList.remove('hidden');
    finalScoreDisplay.innerText = Math.floor(score);
}

function takeDamage() {
    if (player.isInvincible) return; 
    
    lives--;
    updateHUD();
    
    if (lives <= 0) {
        gameOver();
    } else {
        player.isInvincible = true;
        player.invincibilityTimer = 60; 
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
    let minHeight = 20;
    let maxHeight = 70;
    let height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    
    obstacles.push({
        x: CANVAS_WIDTH,
        y: GROUND_Y - height,
        width: 30,
        height: height,
        color: '#555'
    });
}

function spawnShockwave() {
    // Spawns at ground level right in front of Kong
    shockwaves.push({
        x: kong.x + kong.width, 
        y: GROUND_Y - 20, 
        width: 40,
        height: 20,
        speed: gameSpeed * 1.6, 
        color: '#8D6E63' // Light dirt/rock color
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
    score += 0.1; 
    
    if (frameCount % 600 === 0) gameSpeed += 0.5;

    updateHUD();

    // --- Player Physics ---
    player.dy += GRAVITY;
    player.y += player.dy;

    if (player.y + player.height >= GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.dy = 0;
        player.isGrounded = true;
    }

    if (player.isInvincible) {
        player.invincibilityTimer--;
        if (player.invincibilityTimer <= 0) player.isInvincible = false;
    }

    // --- Kong Physics ---
    if (kong.isJumping) {
        kong.dy += GRAVITY;
        kong.y += kong.dy;

        // Kong hits the ground
        if (kong.y + kong.height >= GROUND_Y) {
            kong.y = GROUND_Y - kong.height;
            kong.dy = 0;
            kong.isJumping = false;
            
            // The attack triggers on impact!
            spawnShockwave();
        }
    }

    // --- Move & Clean Obstacles ---
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        if (checkCollision(player, obs)) takeDamage();
        if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }

    // --- Move & Clean Shockwaves ---
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        let wave = shockwaves[i];
        wave.x += (wave.speed - gameSpeed); 

        if (checkCollision(player, wave)) {
            takeDamage();
            shockwaves.splice(i, 1); 
            continue;
        }

        if (wave.x > CANVAS_WIDTH) shockwaves.splice(i, 1);
    }

    // --- Spawn Logic ---
    let spawnRate = Math.max(60, 120 - (gameSpeed * 5)); 
    if (frameCount % Math.floor(spawnRate) === 0) {
        spawnObstacle();
    }

    // Kong jumps roughly every 3 seconds
    if (frameCount % 180 === 0 && !kong.isJumping) {
        kong.dy = -14; // Kong leaps up
        kong.isJumping = true;
    }
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground
    ctx.fillStyle = '#654321'; 
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);

    // Kong
    ctx.fillStyle = kong.color;
    ctx.fillRect(kong.x, kong.y, kong.width, kong.height);
    // Kong's chest (to make him look more like a gorilla)
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(kong.x + 20, kong.y + 20, kong.width - 20, 50);

    // Player
    if (!player.isInvincible || Math.floor(frameCount / 5) % 2 === 0) {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Shockwaves
    shockwaves.forEach(wave => {
        // Draw jagged shockwave
        ctx.fillStyle = wave.color;
        ctx.beginPath();
        ctx.moveTo(wave.x, wave.y + wave.height);
        ctx.lineTo(wave.x + wave.width / 2, wave.y);
        ctx.lineTo(wave.x + wave.width, wave.y + wave.height);
        ctx.fill();
    });
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

draw();
