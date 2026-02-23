/**
 * Main entry point for the Doom-style FPS game
 */

// Game instance
let game = null;

// Configuration
const CONFIG = {
    canvas: {
        id: 'gameCanvas',
        defaultWidth: 800,
        defaultHeight: 600
    },
    graphics: {
        pixelRatio: window.devicePixelRatio || 1,
        enableVSync: true
    },
    input: {
        mouseSensitivity: 0.003,
        keyRepeatDelay: 150
    },
    performance: {
        targetFPS: 60,
        showFPS: true,
        enableProfiling: false
    },
    difficulty: 'normal'
};

// Difficulty presets
const DIFFICULTY = {
    easy: {
        label: 'Easy',
        enemyHealthMultiplier: 0.6,
        enemyDamageMultiplier: 0.5,
        enemySpeedMultiplier: 0.8,
        playerHealth: 150,
        extraEnemies: 0
    },
    normal: {
        label: 'Normal',
        enemyHealthMultiplier: 1.0,
        enemyDamageMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        playerHealth: 100,
        extraEnemies: 0
    },
    nightmare: {
        label: 'Nightmare',
        enemyHealthMultiplier: 1.5,
        enemyDamageMultiplier: 1.5,
        enemySpeedMultiplier: 1.3,
        playerHealth: 75,
        extraEnemies: 4
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for difficulty selection...');

    // Get canvas element
    const canvas = document.getElementById(CONFIG.canvas.id);
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Setup canvas
    setupCanvas(canvas);

    // Setup resize handling
    setupResizeHandling(canvas);

    // Setup difficulty selection
    setupDifficultySelection(canvas);
});

function setupDifficultySelection(canvas) {
    const overlay = document.getElementById('difficultyOverlay');
    if (!overlay) {
        // No overlay found, start with default difficulty
        startGame(canvas, 'normal');
        return;
    }

    const buttons = overlay.querySelectorAll('.difficulty-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const difficulty = btn.getAttribute('data-difficulty');
            overlay.classList.add('hidden');
            startGame(canvas, difficulty);
        });
    });
}

function startGame(canvas, difficulty) {
    CONFIG.difficulty = difficulty;
    console.log('Starting game with difficulty:', difficulty);

    try {
        game = new GameEngine(canvas);

        // Expose game instance globally for cross-system access
        window.game = game;

        // Apply difficulty settings
        applyDifficulty(difficulty);

        // Setup event listeners
        setupEventListeners();

        // Start the game
        game.start();

        console.log('Game started successfully!');

    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Failed to load game. Please refresh the page.');
    }
}

function applyDifficulty(difficulty) {
    const settings = DIFFICULTY[difficulty];
    if (!settings || !game) return;

    console.log('Applying difficulty:', settings.label);

    // Scale player health
    game.player.maxHealth = settings.playerHealth;
    game.player.health = settings.playerHealth;

    // Scale all enemies
    game.map.enemies.forEach(function(enemy) {
        enemy.health = Math.round(enemy.health * settings.enemyHealthMultiplier);
        enemy.maxHealth = Math.round(enemy.maxHealth * settings.enemyHealthMultiplier);
        enemy.speed = Math.round(enemy.speed * settings.enemySpeedMultiplier);

        if (enemy.enhancedAI) {
            enemy.enhancedAI.behavior.damage = Math.round(
                enemy.enhancedAI.behavior.damage * settings.enemyDamageMultiplier
            );
            enemy.enhancedAI.behavior.speed = Math.round(
                enemy.enhancedAI.behavior.speed * settings.enemySpeedMultiplier
            );
        }
    });

    // Nightmare: spawn extra enemies
    if (settings.extraEnemies > 0) {
        var extraTypes = ['imp', 'guard', 'soldier', 'berserker'];
        var tileSize = game.map.tileSize;
        for (var i = 0; i < settings.extraEnemies; i++) {
            // Spawn in open corridor areas
            var spawnPoints = [
                { x: 14 * tileSize, y: 8 * tileSize },
                { x: 4 * tileSize, y: 16 * tileSize },
                { x: 12 * tileSize, y: 16 * tileSize },
                { x: 8 * tileSize, y: 12 * tileSize }
            ];
            var sp = spawnPoints[i % spawnPoints.length];
            var enemyType = extraTypes[i % extraTypes.length];
            var extra = new Enemy(sp.x, sp.y, enemyType);
            extra.health = Math.round(extra.health * settings.enemyHealthMultiplier);
            extra.maxHealth = Math.round(extra.maxHealth * settings.enemyHealthMultiplier);
            extra.speed = Math.round(extra.speed * settings.enemySpeedMultiplier);
            if (extra.enhancedAI) {
                extra.enhancedAI.behavior.damage = Math.round(
                    extra.enhancedAI.behavior.damage * settings.enemyDamageMultiplier
                );
            }
            game.map.enemies.push(extra);
            console.log('Spawned extra ' + enemyType + ' for Nightmare mode');
        }
    }
}

function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');

    // Set canvas size - always use logical dimensions
    // The engine mixes putImageData (ignores ctx.scale) with drawImage/arc
    // (respects ctx.scale), so HiDPI scaling via ctx.scale causes mismatches.
    // Use CSS scaling for sharp display on HiDPI screens instead.
    canvas.width = CONFIG.canvas.defaultWidth;
    canvas.height = CONFIG.canvas.defaultHeight;
    canvas.style.width = CONFIG.canvas.defaultWidth + 'px';
    canvas.style.height = CONFIG.canvas.defaultHeight + 'px';

    // Setup rendering context
    ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering for retro feel

    console.log(`Canvas initialized: ${canvas.width}x${canvas.height}`);
}

function setupEventListeners() {
    // Window focus/blur
    window.addEventListener('focus', function() {
        console.log('Window gained focus');
        if (game && game.isPaused()) {
            // Don't auto-resume, let player decide
        }
    });
    
    window.addEventListener('blur', function() {
        console.log('Window lost focus');
        if (game && game.isRunning() && !game.isPaused()) {
            // Auto-pause when window loses focus
            game.pause();
            showMessage('Game paused (window lost focus)', 2000);
        }
    });
    
    // Visibility API
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && game && game.isRunning() && !game.isPaused()) {
            game.pause();
            showMessage('Game paused (tab hidden)', 2000);
        }
    });
    
    // Fullscreen change handling
    document.addEventListener('fullscreenchange', function() {
        const canvas = document.getElementById(CONFIG.canvas.id);
        if (canvas) {
            // Small delay to let the browser settle fullscreen dimensions
            setTimeout(function() {
                handleResize(canvas);
            }, 100);
        }
    });

    // Error handling
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        showError('An error occurred. Check console for details.');
    });
    
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
    });
}

function setupResizeHandling(canvas) {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            handleResize(canvas);
        }, 250); // Debounce resize events
    });
}

function handleResize(canvas) {
    const isFullscreen = !!document.fullscreenElement;
    const container = canvas.parentElement;
    const maxWidth = isFullscreen ? window.innerWidth : container.clientWidth;
    const maxHeight = isFullscreen ? window.innerHeight : container.clientHeight;

    // Maintain aspect ratio
    const aspectRatio = CONFIG.canvas.defaultWidth / CONFIG.canvas.defaultHeight;
    let newWidth, newHeight;

    if (isFullscreen) {
        // In fullscreen, fill as much space as possible while keeping aspect ratio
        if (maxWidth / maxHeight > aspectRatio) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        } else {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
        }
    } else {
        if (maxWidth / maxHeight > aspectRatio) {
            newHeight = Math.min(maxHeight, CONFIG.canvas.defaultHeight);
            newWidth = newHeight * aspectRatio;
        } else {
            newWidth = Math.min(maxWidth, CONFIG.canvas.defaultWidth);
            newHeight = newWidth / aspectRatio;
        }
    }

    // Update canvas size
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';

    // Update game engine
    if (game) {
        game.onResize(newWidth, newHeight);
    }

    console.log(`Canvas resized to ${newWidth}x${newHeight}`);
}

// UI Helper functions
function showMessage(text, duration = 3000) {
    const messageElement = createMessageElement(text, 'info');
    showMessageElement(messageElement, duration);
}

function showError(text, duration = 5000) {
    const messageElement = createMessageElement(text, 'error');
    showMessageElement(messageElement, duration);
}

function createMessageElement(text, type) {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${type === 'error' ? '#ff0000' : '#333333'};
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        text-align: center;
        max-width: 400px;
    `;
    return element;
}

function showMessageElement(element, duration) {
    document.body.appendChild(element);
    
    // Fade in
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease-in-out';
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
    
    // Auto remove
    setTimeout(() => {
        element.style.opacity = '0';
        setTimeout(() => {
            if (element.parentNode) {
                document.body.removeChild(element);
            }
        }, 300);
    }, duration);
}

// Development helpers
function enableDebugMode() {
    if (game) {
        game.debugMode = true;
        window.DEBUG_MODE = true;
        console.log('Debug mode enabled');
        showMessage('Debug mode enabled (F1 to toggle)', 2000);
    }
}

function getGameStats() {
    if (!game) return null;
    
    return {
        fps: game.fps,
        frameTime: game.getAverageFrameTime(),
        playerPosition: game.player.getPosition(),
        playerAngle: MathUtils.radToDeg(game.player.angle),
        gameState: game.getCurrentState(),
        running: game.isRunning(),
        paused: game.isPaused()
    };
}

// Global dev tools
window.gameDebug = {
    enableDebug: enableDebugMode,
    getStats: getGameStats,
    togglePause: () => game && game.pause(),
    restart: () => {
        if (game) {
            game.destroy();
            const canvas = document.getElementById(CONFIG.canvas.id);
            game = new GameEngine(canvas);
            game.start();
        }
    },
    getGame: () => game,
    getConfig: () => CONFIG
};

// Performance monitoring
if (CONFIG.performance.enableProfiling) {
    let performanceData = {
        frameCount: 0,
        totalFrameTime: 0,
        maxFrameTime: 0,
        minFrameTime: Infinity
    };
    
    function updatePerformanceStats() {
        if (game) {
            const frameTime = game.getAverageFrameTime();
            performanceData.frameCount++;
            performanceData.totalFrameTime += frameTime;
            performanceData.maxFrameTime = Math.max(performanceData.maxFrameTime, frameTime);
            performanceData.minFrameTime = Math.min(performanceData.minFrameTime, frameTime);
            
            // Log performance every 60 frames
            if (performanceData.frameCount % 60 === 0) {
                const avgFrameTime = performanceData.totalFrameTime / performanceData.frameCount;
                console.log('Performance stats:', {
                    avgFrameTime: avgFrameTime.toFixed(2) + 'ms',
                    maxFrameTime: performanceData.maxFrameTime.toFixed(2) + 'ms',
                    minFrameTime: performanceData.minFrameTime.toFixed(2) + 'ms',
                    fps: game.fps
                });
            }
        }
        
        requestAnimationFrame(updatePerformanceStats);
    }
    
    updatePerformanceStats();
}

// Export for global access
window.CONFIG = CONFIG;
window.DIFFICULTY = DIFFICULTY;
window.applyDifficulty = applyDifficulty;