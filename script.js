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
let shockwaves = [];

// Background Variables
let roadOffset = 0;
let bgBuildings = [];

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
    color: '#00ccff', // Brightened the player slightly for the night theme
    isInvincible: false,
    invincibilityTimer: 0
};

const kong = {
    x: -10,
    y: GROUND_Y - 110,
    width: 90,
    height: 110,
    color: '#4E342E', 
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
// BACKGROUND GENERATION (CITY LIGHTS)
// ==========================================
function generateWindows(bWidth, bHeight) {
    let windows = [];
    let cols = Math.floor(bWidth / 15);
    let rows = Math.floor(bHeight / 20);
    let paddingX = (bWidth - (cols * 10)) / 2;
    let paddingY = 10;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // 40% chance for a window to be lit
            if (Math.random() > 0.6) { 
                windows.push({
                    wx: paddingX + c * 15, // Window X relative to building
                    wy: paddingY + r * 20, // Window Y relative to building
                    wWidth: 6,
                    wHeight: 10,
                    // Mostly yellow lights, sometimes warm orange
                    color: Math.random() > 0.2 ? '#ffeb3b' : '#ffc107' 
                });
            }
        }
    }
    return windows;
}

function initBackground() {
    bgBuildings = [];
    for (let i = 0; i < 15; i++) {
        let w = 60 + Math.random() * 60; // Slightly wider buildings
        let h = 80 + Math.random() * 200; // Taller buildings
        bgBuildings.push({
            x: i * 80, 
            width: w,
            height: h,
            windows: generateWindows(w, h)
        });
    }
}

// ==========================================
// CORE FUNCTIONS
// ==========================================
function startGame() {
    gameSpeed = BASE_GAME_SPEED;
    score = 0;
    lives = 3;
    frameCount = 0;
    roadOffset = 0;
    obstacles = [];
    shockwaves = [];
    
    initBackground();

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
        color: '#ff2222' 
    });
}

function spawnShockwave() {
    shockwaves.push({
        x: kong.x + kong.width, 
        y: GROUND_Y - 20, 
        width: 40,
        height: 20,
        speed: gameSpeed * 1.6, 
        color: '#ffeb3b' 
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

    // --- Background & Road Update ---
    roadOffset += gameSpeed;
    if (roadOffset > 80) roadOffset -= 80; 

    for (let i = 0; i < bgBuildings.length; i++) {
        bgBuildings[i].x -= gameSpeed * 0.3; 
        
        // Recycle buildings that go off-screen and generate new windows
        if (bgBuildings[i].x + bgBuildings[i].width < 0) {
            let maxX = Math.max(...bgBuildings.map(b => b.x));
            bgBuildings[i].x = maxX + 80;
            bgBuildings[i].width = 60 + Math.random() * 60;
            bgBuildings[i].height = 80 + Math.random() * 200; 
            bgBuildings[i].windows = generateWindows(bgBuildings[i].width, bgBuildings[i].height);
        }
    }

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

        if (kong.y + kong.height >= GROUND_Y) {
            kong.y = GROUND_Y - kong.height;
            kong.dy = 0;
            kong.isJumping = false;
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

    if (frameCount % 180 === 0 && !kong.isJumping) {
        kong.dy = -14; 
        kong.isJumping = true;
    }
}

function draw() {
    // 1. Draw Night Sky (This overrides the CSS sky blue)
    ctx.fillStyle = '#0a0a1a'; // Deep midnight blue/black
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Parallax Background City with Lights
    bgBuildings.forEach(b => {
        // Dark building silhouette
        ctx.fillStyle = '#1a1a2e'; 
        ctx.fillRect(b.x, GROUND_Y - b.height, b.width, b.height);
        
        // Draw lit windows
        b.windows.forEach(w => {
            ctx.fillStyle = w.color;
            ctx.fillRect(b.x + w.wx, GROUND_Y - b.height + w.wy, w.wWidth, w.wHeight);
        });
    });

    // 3. Draw Racing Road
    ctx.fillStyle = '#111'; // Very dark asphalt
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);

    // 4. Draw Racing Stripes on the road
    ctx.fillStyle = '#555'; // Dimmed the white lines slightly for night time
    for (let i = -roadOffset; i < CANVAS_WIDTH; i += 80) { 
        ctx.fillRect(i, GROUND_Y + 20, 40, 10);
    }

    // 5. Kong
    ctx.fillStyle = kong.color;
    ctx.fillRect(kong.x, kong.y, kong.width, kong.height);
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(kong.x + 20, kong.y + 20, kong.width - 20, 50);

    // 6. Player
    if (!player.isInvincible || Math.floor(frameCount / 5) % 2 === 0) {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // 7. Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // 8. Shockwaves
    shockwaves.forEach(wave => {
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

// Initial setup
initBackground();
draw();
