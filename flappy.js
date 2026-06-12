const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScoreSpan = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game state
let gameLoop;
let isPlaying = false;
let frames = 0;
let score = 0;

// Load images
const supermanImg = new Image();
supermanImg.src = 'superman.png';

// Superman Object
const superman = {
    x: 50,
    y: 150,
    width: 80,  // Increased size
    height: 30, // Increased size
    velocity: 0,
    gravity: 0.25,
    jump: -5.5,
    draw() {
        if (supermanSprite) {
            ctx.drawImage(supermanSprite, this.x, this.y, this.width, this.height);
        } else if (supermanImg.complete && supermanImg.naturalHeight !== 0) {
            ctx.drawImage(supermanImg, this.x, this.y, this.width, this.height);
        } else {
            // Fallback just in case image fails to load
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
    },
    flap() {
        this.velocity = this.jump;
    },
    reset() {
        this.y = 150;
        this.velocity = 0;
    }
};

// Pipes Object
const pipes = {
    items: [],
    width: 60,
    gap: 130, // Hueco por el que pasa superman
    dx: 2.5,  // Velocidad de avance
    draw() {
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];

            // Draw pipes (kryptonite green color for Superman)
            ctx.fillStyle = '#2ECC71';
            ctx.strokeStyle = '#27AE60';
            ctx.lineWidth = 4;

            // Top pipe
            ctx.fillRect(p.x, 0, this.width, p.top);
            ctx.strokeRect(p.x, 0, this.width, p.top);

            // Bottom pipe
            ctx.fillRect(p.x, canvas.height - p.bottom, this.width, p.bottom);
            ctx.strokeRect(p.x, canvas.height - p.bottom, this.width, p.bottom);
        }
    },
    update() {
        // Add new pipe
        if (frames % 100 === 0) {
            let topPosition = Math.random() * (canvas.height - this.gap - 60) + 30;
            this.items.push({
                x: canvas.width,
                top: topPosition,
                bottom: canvas.height - (topPosition + this.gap),
                passed: false
            });
        }

        // Move pipes
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= this.dx;

            // Collision detection
            // Margins for a more forgiving hitbox
            const hitMarginX = 5;
            const hitMarginY = 25;

            // Check top pipe
            if (superman.x + superman.width - hitMarginX > p.x &&
                superman.x + hitMarginX < p.x + this.width &&
                superman.y + hitMarginY < p.top) {
                gameOver();
            }
            // Check bottom pipe
            if (superman.x + superman.width - hitMarginX > p.x &&
                superman.x + hitMarginX < p.x + this.width &&
                superman.y + superman.height - hitMarginY > canvas.height - p.bottom) {
                gameOver();
            }

            // Score update
            if (p.x + this.width < superman.x && !p.passed) {
                score++;
                scoreDisplay.textContent = score;
                p.passed = true;
            }

            // Remove off-screen pipes
            if (p.x + this.width < 0) {
                this.items.shift();
                i--;
            }
        }
    },
    reset() {
        this.items = [];
    }
};

function drawBackground() {
    // Cielo
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
    superman.update();
    pipes.update();

    // Check ground or roof collision
    if (superman.y + superman.height >= canvas.height || superman.y <= 0) {
        gameOver();
    }
}

function draw() {
    drawBackground();
    pipes.draw();
    superman.draw();
}

function loop() {
    if (!isPlaying) return;
    update();
    draw();
    frames++;
    gameLoop = requestAnimationFrame(loop);
}

function startGame() {
    superman.reset();
    pipes.reset();
    score = 0;
    frames = 0;
    scoreDisplay.textContent = score;
    isPlaying = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    loop();
}

function gameOver() {
    isPlaying = false;
    finalScoreSpan.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Input handling
function jump(e) {
    if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;

    if (isPlaying) {
        superman.flap();
    } else if (!gameOverScreen.classList.contains('hidden') || !startScreen.classList.contains('hidden')) {
        // Optional: you could make spacebar restart the game too
    }
}

canvas.addEventListener('mousedown', jump);
document.addEventListener('keydown', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling on mobile tap
    jump(e);
}, { passive: false });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

let supermanSprite = null;

function removeWhiteBackground(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.naturalWidth || img.width;
    tempCanvas.height = img.naturalHeight || img.height;
    if (tempCanvas.width === 0 || tempCanvas.height === 0) return null;

    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCtx.drawImage(img, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;

    // Asumimos que la esquina superior izquierda es el color de fondo (usualmente blanco)
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
        // Tolerancia para quitar el fondo
        if (Math.abs(data[i] - bgR) < 25 &&
            Math.abs(data[i + 1] - bgG) < 25 &&
            Math.abs(data[i + 2] - bgB) < 25) {
            data[i + 3] = 0; // Hacer transparente
        }
    }
    tempCtx.putImageData(imgData, 0, 0);
    return tempCanvas;
}

// Initial draw before game starts
supermanImg.onload = () => {
    supermanSprite = removeWhiteBackground(supermanImg);
    drawBackground();
    superman.draw();
};

// Fallback if image is cached
setTimeout(() => {
    if (!supermanSprite && supermanImg.complete) {
        supermanSprite = removeWhiteBackground(supermanImg);
        drawBackground();
        superman.draw();
    }
}, 100);
