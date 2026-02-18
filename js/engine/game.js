/**
 * Game Engine - Core game loop and system coordination
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.running = false;
        this.paused = false;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // Game state
        this.currentState = 'playing'; // playing, paused, menu, loading
        
        // Performance monitoring
        this.frameTimeHistory = [];
        this.maxFrameTimeHistory = 60;
        
        // Systems (will be initialized)
        this.renderer = null;
        this.inputManager = null;
        this.map = null;
        this.player = null;
        
        // Debug mode
        this.debugMode = false;
        
        // Initialize systems
        this.initialize();
    }
    
    initialize() {
        console.log('Initializing Game Engine...');
        
        // Initialize input manager
        this.inputManager = new InputManager(this.canvas);
        console.log('Input Manager initialized');
        
        // Initialize map (will be created in map.js)
        this.map = new GameMap();
        console.log('Map initialized');
        
        // Initialize player
        this.player = new Player(this.map.spawnX, this.map.spawnY, this.map.spawnAngle);
        console.log('Player initialized');
        
        // Initialize renderer
        this.renderer = new Renderer(this.canvas, this.map);
        console.log('Renderer initialized');
        
        // Initialize HUD
        this.hud = new HUD(this.canvas);
        console.log('HUD initialized');
        
        // Initialize pickup system
        this.pickupManager = new PickupManager();
        this.pickupManager.spawnRandomPickups(this.map, 6);
        console.log('Pickup system initialized');
        
        // Bind debug toggle
        this.bindDebugToggle();
        
        // Initialize audio system
        this.initializeAudio();
        
        console.log('Game Engine initialization complete');
    }
    
    start() {
        if (this.running) return;
        
        console.log('Starting game engine...');
        this.running = true;
        this.lastTime = performance.now();
        
        // Start the game loop
        this.gameLoop();
    }
    
    stop() {
        console.log('Stopping game engine...');
        this.running = false;
    }
    
    pause() {
        this.paused = !this.paused;
        console.log(this.paused ? 'Game paused' : 'Game resumed');
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.running) return;
        
        // Calculate delta time
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS();
        
        // Game loop phases
        if (!this.paused) {
            this.handleInput();
            this.update(this.deltaTime);
        }
        
        this.render();
        this.updateUI();
        
        // Performance tracking
        this.trackPerformance(currentTime);
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    handleInput() {
        // Handle debug toggle
        if (this.inputManager.isKeyPressed('debug')) {
            this.debugMode = !this.debugMode;
            window.DEBUG_MODE = this.debugMode;
        }
        
        // Handle menu toggle
        if (this.inputManager.isKeyPressed('menu')) {
            this.pause();
        }
        
        // Player input handling
        this.player.handleInput(this.inputManager, this.deltaTime, this.map);
        
        // Update input manager (clear frame-specific states)
        this.inputManager.update();
    }
    
    update(deltaTime) {
        // Skip updates while player is dead
        if (this.player.isDead) return;

        // Update game systems
        this.player.update(deltaTime, this.map);

        // Update enemies (with coordination)
        this.map.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player, this.map, this.map.enemies);
        });

        // Update pickups
        this.pickupManager.update(deltaTime, this.player);
    }
    
    render() {
        // Render the 3D world first (this includes putImageData which overwrites canvas)
        this.renderer.render(this.player);
        
        // CRITICAL: HUD must render AFTER all world rendering is complete
        // This ensures it cannot be overwritten by putImageData or other world rendering
        this.hud.render(this.player, this);
        
        // Render debug information if enabled (last layer)
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }
    
    updateUI() {
        // Update HUD elements
        const healthElement = document.getElementById('health');
        const ammoElement = document.getElementById('ammo');
        const fpsElement = document.getElementById('fps');
        const playerXElement = document.getElementById('playerX');
        const playerYElement = document.getElementById('playerY');
        const playerAngleElement = document.getElementById('playerAngle');
        
        if (healthElement) healthElement.textContent = this.player.health;
        if (ammoElement) ammoElement.textContent = this.player.ammo;
        if (fpsElement) fpsElement.textContent = Math.round(this.fps);
        if (playerXElement) playerXElement.textContent = Math.round(this.player.x);
        if (playerYElement) playerYElement.textContent = Math.round(this.player.y);
        if (playerAngleElement) {
            playerAngleElement.textContent = Math.round(MathUtils.radToDeg(this.player.angle));
        }
    }
    
    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.fpsUpdateTime >= 1000) { // Update every second
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
    }
    
    trackPerformance(currentTime) {
        // Track frame time for performance analysis
        const frameTime = currentTime - this.lastTime;
        this.frameTimeHistory.push(frameTime);
        
        if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
            this.frameTimeHistory.shift();
        }
        
        // Log performance warnings
        if (frameTime > this.frameTime * 2) {
            console.warn(`Long frame detected: ${frameTime.toFixed(2)}ms`);
        }
    }
    
    renderDebugInfo() {
        const ctx = this.canvas.getContext('2d');
        
        // Save context state
        ctx.save();
        
        // Debug text style
        ctx.fillStyle = '#00FF00';
        ctx.font = '12px monospace';
        
        let y = 20;
        const lineHeight = 15;
        
        // Performance info
        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        const maxFrameTime = Math.max(...this.frameTimeHistory);
        
        ctx.fillText(`FPS: ${this.fps}`, 10, y); y += lineHeight;
        ctx.fillText(`Frame Time: ${avgFrameTime.toFixed(2)}ms (max: ${maxFrameTime.toFixed(2)}ms)`, 10, y); y += lineHeight;
        ctx.fillText(`Delta Time: ${(this.deltaTime * 1000).toFixed(2)}ms`, 10, y); y += lineHeight;
        
        y += lineHeight;
        
        // Player info
        ctx.fillText(`Player Position: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)})`, 10, y); y += lineHeight;
        ctx.fillText(`Player Angle: ${MathUtils.radToDeg(this.player.angle).toFixed(1)}°`, 10, y); y += lineHeight;
        ctx.fillText(`Player Velocity: (${this.player.velocityX.toFixed(2)}, ${this.player.velocityY.toFixed(2)})`, 10, y); y += lineHeight;
        
        y += lineHeight;
        
        // Input info
        const inputDebug = this.inputManager.getDebugInfo();
        ctx.fillText(`Mouse Locked: ${inputDebug.mouseLocked}`, 10, y); y += lineHeight;
        ctx.fillText(`Active Keys: ${inputDebug.activeKeys.join(', ') || 'None'}`, 10, y); y += lineHeight;
        
        // Restore context state
        ctx.restore();
    }
    
    bindDebugToggle() {
        // Debug and HUD key bindings
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'F1':
                    event.preventDefault();
                    this.debugMode = !this.debugMode;
                    window.DEBUG_MODE = this.debugMode;
                    this.hud.showDebugInfo = this.debugMode;
                    console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
                    break;
                    
                case 'F2':
                    event.preventDefault();
                    this.hud.toggleFPS();
                    console.log('FPS display:', this.hud.showFPS ? 'ON' : 'OFF');
                    break;
                    
                case 'F3':
                    event.preventDefault();
                    this.hud.toggleCrosshair();
                    console.log('Crosshair:', this.hud.showCrosshair ? 'ON' : 'OFF');
                    break;
                    
                case 'F4':
                    event.preventDefault();
                    this.hud.toggleWeaponSprite();
                    console.log('Weapon Sprite:', this.hud.showWeaponSprite ? 'ON' : 'OFF');
                    break;
            }
        });
    }
    
    async initializeAudio() {
        // Add click handler to start audio
        const startAudio = async () => {
            if (window.soundEngine && !window.soundEngine.isInitialized) {
                const success = await window.soundEngine.init();
                if (success) {
                    // Start ambient drone
                    window.soundEngine.playAmbientDrone();
                    console.log('🔊 Audio system activated - game sounds enabled!');
                    
                    // Remove the event listeners after first activation
                    document.removeEventListener('click', startAudio);
                    document.removeEventListener('keydown', startAudio);
                }
            }
        };
        
        // Listen for user interaction to start audio
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
    }
    
    // Utility methods
    getAverageFrameTime() {
        return this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    }
    
    getGameTime() {
        return performance.now();
    }
    
    isRunning() {
        return this.running;
    }
    
    isPaused() {
        return this.paused;
    }
    
    getCurrentState() {
        return this.currentState;
    }
    
    setState(newState) {
        console.log(`Game state changed: ${this.currentState} -> ${newState}`);
        this.currentState = newState;
    }
    
    // Event handling
    onResize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.renderer) {
            this.renderer.width = width;
            this.renderer.height = height;
            this.renderer.halfHeight = height / 2;
            this.renderer.rayCount = width;
            this.renderer.rayAngleStep = this.renderer.fov / this.renderer.rayCount;
            this.renderer.imageData = this.renderer.ctx.createImageData(width, height);
            this.renderer.pixelBuffer = new Uint32Array(this.renderer.imageData.data.buffer);
        }
        
        console.log(`Canvas resized to ${width}x${height}`);
    }
    
    // Cleanup
    destroy() {
        this.stop();
        // Clean up resources, event listeners, etc.
        console.log('Game engine destroyed');
    }
}

// Export to global scope
window.GameEngine = GameEngine;