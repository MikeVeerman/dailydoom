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
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Get canvas element
    const canvas = document.getElementById(CONFIG.canvas.id);
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Setup canvas
    setupCanvas(canvas);
    
    // Create and start game
    try {
        game = new GameEngine(canvas);
        
        // Expose game instance globally for cross-system access
        window.game = game;
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup resize handling
        setupResizeHandling(canvas);
        
        // Start the game
        game.start();
        
        console.log('Game started successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Failed to load game. Please refresh the page.');
    }
});

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
    const container = canvas.parentElement;
    const maxWidth = container.clientWidth;
    const maxHeight = container.clientHeight;
    
    // Maintain aspect ratio
    const aspectRatio = CONFIG.canvas.defaultWidth / CONFIG.canvas.defaultHeight;
    let newWidth, newHeight;
    
    if (maxWidth / maxHeight > aspectRatio) {
        newHeight = Math.min(maxHeight, CONFIG.canvas.defaultHeight);
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = Math.min(maxWidth, CONFIG.canvas.defaultWidth);
        newHeight = newWidth / aspectRatio;
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