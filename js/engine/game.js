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

        // Level completion tracking
        this.levelStartTime = 0;
        this.totalEnemyCount = 0;
        this.levelComplete = false;
        this.levelCompleteTime = 0;

        // High score persistence
        this.STORAGE_KEY = 'dailydoom_highscores';
        this.BEST_RUN_KEY = 'dailydoom_bestrun';
        this.currentScore = 0;
        this.showDeathScreen = false;
        this.deathScreenTime = 0;

        // Dynamic difficulty scaling
        this.difficultyScaler = {
            lastCheckTime: 0,
            checkInterval: 30000, // 30 seconds
            currentModifier: 0, // -15 to +15 (percentage)
            maxModifier: 15,
            stepSize: 5,
            killsAtLastCheck: 0,
            damageAtLastCheck: 0,
            enabled: false // Set based on difficulty after game starts
        };

        // Pause menu
        this.pauseMenuSelection = -1;
        this._pauseMenuItems = [];

        // Wave spawner system
        this.waveSystem = {
            active: false,
            currentWave: 0,
            state: 'idle', // idle, announcing, spawning, fighting
            announceTime: 0,
            announceDuration: 2000, // 2s announcement
            delayBetweenWaves: 3000, // 3s between waves
            lastWaveClearTime: 0,
            spawnPoints: [
                { x: 14, y: 8 },
                { x: 4, y: 16 },
                { x: 12, y: 16 },
                { x: 8, y: 12 },
                { x: 20, y: 8 },
                { x: 8, y: 4 },
                { x: 16, y: 12 },
                { x: 4, y: 12 },
                { x: 18, y: 16 },
                { x: 12, y: 4 },
                { x: 4, y: 20 },
                { x: 16, y: 20 }
            ]
        };

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
        this.pickupManager.spawnWeaponPickups(this.map);
        this.pickupManager.spawnRandomPickups(this.map, 6);
        this.pickupManager.spawnModPickups(this.map);
        console.log('Pickup system initialized');

        // Initialize projectile system
        this.projectileManager = new ProjectileManager();
        console.log('Projectile system initialized');
        
        // Bind debug toggle
        this.bindDebugToggle();

        // Bind pause menu click handler
        this.canvas.addEventListener('click', (e) => {
            if (!this.paused || this._pauseMenuItems.length === 0) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            for (const item of this._pauseMenuItems) {
                if (clickX >= item.x && clickX <= item.x + item.w &&
                    clickY >= item.y && clickY <= item.y + item.h) {
                    switch (item.action) {
                        case 'resume':
                            this.resume();
                            break;
                        case 'restart':
                            this.restartLevel();
                            break;
                        case 'toggleMusic':
                            if (window.soundEngine && window.soundEngine.isInitialized) {
                                window.soundEngine.toggleMusic();
                            }
                            break;
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                }
            }
        });

        // Track mouse position on canvas for hover detection
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.paused) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.inputManager.mouse.x = (e.clientX - rect.left) * scaleX;
            this.inputManager.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        // Initialize audio system
        this.initializeAudio();
        
        console.log('Game Engine initialization complete');
    }
    
    start() {
        if (this.running) return;

        console.log('Starting game engine...');
        this.running = true;
        this.lastTime = performance.now();
        this.levelStartTime = performance.now();
        this.totalEnemyCount = this.map.enemies.length;

        // Start wave system immediately — initial enemies are wave 1
        this.waveSystem.active = true;
        this.waveSystem.currentWave = 1;
        this.waveSystem.state = 'fighting';

        // Initialize dynamic difficulty scaling
        this.initDifficultyScaler();

        // Start the game loop
        this.gameLoop();
    }
    
    stop() {
        console.log('Stopping game engine...');
        this.running = false;
    }
    
    pause() {
        this.paused = !this.paused;
        this.pauseMenuSelection = -1;
        if (this.paused) {
            // Release pointer lock so mouse can interact with menu
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
        console.log(this.paused ? 'Game paused' : 'Game resumed');
    }

    resume() {
        this.paused = false;
        this.pauseMenuSelection = -1;
    }

    restartLevel() {
        this.paused = false;
        this.pauseMenuSelection = -1;
        this.levelComplete = false;
        this.levelCompleteTime = 0;

        // Re-initialize map and player
        this.map = new GameMap();
        this.player = new Player(this.map.spawnX, this.map.spawnY, this.map.spawnAngle);
        this.renderer = new Renderer(this.canvas, this.map);
        this.pickupManager = new PickupManager();
        this.pickupManager.spawnWeaponPickups(this.map);
        this.pickupManager.spawnRandomPickups(this.map, 6);
        this.pickupManager.spawnModPickups(this.map);
        this.projectileManager.clear();
        this.hud.resetFog();
        this.levelStartTime = performance.now();
        this.totalEnemyCount = this.map.enemies.length;

        // Reset wave system — start at wave 1 immediately
        this.waveSystem.active = true;
        this.waveSystem.currentWave = 1;
        this.waveSystem.state = 'fighting';

        console.log('Level restarted');
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.running) return;
        
        // Calculate delta time
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS();
        
        // Game loop phases
        if (this.paused) {
            this.handlePauseInput();
        } else {
            this.handleInput();
            this.update(this.deltaTime);
        }

        this.render();
        this.updateUI();

        // Render pause menu overlay if paused
        if (this.paused) {
            this.renderPauseMenu();
        }
        
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

        // Handle fullscreen toggle
        if (this.inputManager.isKeyPressed('fullscreen')) {
            this.toggleFullscreen();
        }

        // Handle music toggle (N key)
        if (this.inputManager.isKeyPressed('toggleMusic')) {
            if (window.soundEngine && window.soundEngine.isInitialized) {
                const musicOn = window.soundEngine.toggleMusic();
                if (window.game && window.game.hud) {
                    window.game.hud.addKillFeedMessage(
                        musicOn ? 'MUSIC ON' : 'MUSIC OFF',
                        '#88CCFF'
                    );
                }
            }
        }
        
        // Player input handling
        this.player.handleInput(this.inputManager, this.deltaTime, this.map);
        
        // Update input manager (clear frame-specific states)
        this.inputManager.update();
    }
    
    update(deltaTime) {
        // Skip updates while player is dead or level is complete
        if (this.player.isDead || this.levelComplete || this.showDeathScreen) return;

        // Update game systems
        this.player.update(deltaTime, this.map);

        // Update enemies (with coordination)
        this.map.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player, this.map, this.map.enemies);
        });

        // Update pickups
        this.pickupManager.update(deltaTime, this.player);

        // Update projectiles
        this.projectileManager.update(deltaTime, this.map, this.player);

        // Update doors (proximity-based opening + animation)
        this.map.updateDoors(this.player.x, this.player.y, deltaTime);

        // Hazard zone damage (acid: 5 HP/sec, lava: 8 HP/sec)
        const inAcid = this.map.isAcidAtPosition(this.player.x, this.player.y);
        const inLava = this.map.isLavaAtPosition(this.player.x, this.player.y);
        if (inAcid) {
            if (!this._lastAcidTick || Date.now() - this._lastAcidTick > 500) {
                this.player.takeDamage(2.5); // 2.5 per tick = 5/sec
                if (this.hud) this.hud.onPlayerDamage();
                this._lastAcidTick = Date.now();
            }
        }
        if (inLava) {
            if (!this._lastLavaTick || Date.now() - this._lastLavaTick > 500) {
                this.player.takeDamage(4); // 4 per tick = 8/sec
                if (this.hud) this.hud.onPlayerDamage();
                this._lastLavaTick = Date.now();
            }
        }
        // Update HUD hazard warning
        if (this.hud) {
            this.hud.inHazardZone = inAcid || inLava;
            this.hud.hazardType = inLava ? 'lava' : (inAcid ? 'acid' : null);
        }
        this.map.enemies.forEach(enemy => {
            if (!enemy.active || enemy.dying) return;
            if (this.map.isAcidAtPosition(enemy.x, enemy.y)) {
                if (!enemy._lastAcidTick || Date.now() - enemy._lastAcidTick > 500) {
                    enemy.takeDamage(2.5);
                    enemy._lastAcidTick = Date.now();
                }
            }
        });

        // Update adaptive music and ambient audio
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.updateMusicState(this.player, this.map.enemies);
            window.soundEngine.updateAmbientAudio(this.player.x, this.player.y);
        }

        // Dynamic difficulty scaling
        this.updateDifficultyScaling();

        // Check level completion
        this.checkLevelComplete();
    }

    checkLevelComplete() {
        if (this.levelComplete) return;

        const activeEnemies = this.map.enemies.filter(e => e.active && !e.dying);
        if (activeEnemies.length === 0 && this.totalEnemyCount > 0) {
            // Wave system: spawn next wave instead of ending level
            this.updateWaveSystem();
        }
    }

    updateWaveSystem() {
        const ws = this.waveSystem;
        const now = performance.now();

        if (ws.state === 'idle') {
            // First time all enemies cleared — start wave countdown
            ws.active = true;
            ws.lastWaveClearTime = now;
            ws.state = 'waiting';
        }

        if (ws.state === 'waiting') {
            if (now - ws.lastWaveClearTime >= ws.delayBetweenWaves) {
                ws.currentWave++;
                ws.state = 'announcing';
                ws.announceTime = now;

                // Show wave announcement in HUD
                if (this.hud && this.hud.addKillFeedMessage) {
                    this.hud.addKillFeedMessage(`WAVE ${ws.currentWave} INCOMING!`, '#FF4444');
                }

                // Play wave announcement sound
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playWaveAnnounce(ws.currentWave);
                }

                console.log(`Wave ${ws.currentWave} incoming!`);
            }
        }

        if (ws.state === 'announcing') {
            if (now - ws.announceTime >= ws.announceDuration) {
                this.spawnWave(ws.currentWave);
                ws.state = 'fighting';
            }
        }

        if (ws.state === 'fighting') {
            const alive = this.map.enemies.filter(e => e.active && !e.dying);
            if (alive.length === 0) {
                ws.lastWaveClearTime = now;
                ws.state = 'waiting';
            }
        }
    }

    spawnWave(waveNumber) {
        const ws = this.waveSystem;
        const tileSize = this.map.tileSize;
        const difficulty = window.CONFIG ? window.CONFIG.difficulty : 'normal';
        const diffSettings = window.DIFFICULTY ? window.DIFFICULTY[difficulty] : null;

        // Wave composition scales with wave number
        const baseCount = 8 + Math.floor(waveNumber * 3.5);
        const count = difficulty === 'nightmare' ? baseCount + 6 :
                      difficulty === 'easy' ? Math.max(4, baseCount - 3) : baseCount;

        // Enemy types available per wave (harder types appear in later waves)
        const earlyTypes = ['guard', 'imp', 'exploder'];
        const midTypes = ['guard', 'imp', 'soldier', 'berserker', 'exploder', 'phantom'];
        const lateTypes = ['guard', 'imp', 'soldier', 'berserker', 'spitter', 'shield_guard', 'phantom', 'sniper'];
        const bossTypes = ['guard', 'imp', 'soldier', 'berserker', 'spitter', 'shield_guard', 'demon', 'boss', 'phantom', 'exploder', 'sniper'];

        let typePool;
        if (waveNumber <= 2) typePool = earlyTypes;
        else if (waveNumber <= 4) typePool = midTypes;
        else if (waveNumber <= 7) typePool = lateTypes;
        else typePool = bossTypes;

        // Filter spawn points far enough from player
        const playerX = this.player.x;
        const playerY = this.player.y;
        const minSpawnDist = 5 * tileSize;
        const validSpawns = ws.spawnPoints.filter(sp => {
            const dx = sp.x * tileSize - playerX;
            const dy = sp.y * tileSize - playerY;
            return Math.sqrt(dx * dx + dy * dy) >= minSpawnDist;
        });
        const spawns = validSpawns.length > 0 ? validSpawns : ws.spawnPoints;

        for (let i = 0; i < count; i++) {
            const sp = spawns[i % spawns.length];
            const type = typePool[Math.floor(Math.random() * typePool.length)];
            const enemy = new Enemy(sp.x * tileSize, sp.y * tileSize, type);

            // Apply difficulty scaling
            if (diffSettings) {
                enemy.health = Math.round(enemy.health * diffSettings.enemyHealthMultiplier);
                enemy.maxHealth = Math.round(enemy.maxHealth * diffSettings.enemyHealthMultiplier);
                enemy.speed = Math.round(enemy.speed * diffSettings.enemySpeedMultiplier);
                if (enemy.enhancedAI && enemy.enhancedAI.behavior) {
                    enemy.enhancedAI.behavior.damage = Math.round(
                        enemy.enhancedAI.behavior.damage * diffSettings.enemyDamageMultiplier
                    );
                }
            }

            this.map.enemies.push(enemy);
        }

        this.totalEnemyCount += count;
        console.log(`Wave ${waveNumber}: spawned ${count} enemies`);
    }

    // ========== HIGH SCORE SYSTEM ==========

    calculateScore() {
        const stats = this.player.stats;
        const elapsed = (this.levelCompleteTime - this.levelStartTime) / 1000;
        const accuracy = stats.shotsFired > 0
            ? (stats.shotsHit / stats.shotsFired) * 100
            : 0;

        // Score formula: kills * 100 + accuracy bonus + time bonus - damage penalty + combo bonus
        const killScore = stats.enemiesKilled * 100;
        const accuracyBonus = Math.round(accuracy * 10);
        const timeBonus = Math.max(0, 300 - Math.floor(elapsed)) * 5; // Faster = more points
        const damagePenalty = Math.round(stats.damageTaken);
        const levelBonus = (this.player.level - 1) * 200;
        const comboInfo = this.player.getComboInfo ? this.player.getComboInfo() : null;
        const comboBonus = comboInfo ? (comboInfo.bestStreak * 50 + comboInfo.totalComboKills * 25) : 0;

        return Math.max(0, killScore + accuracyBonus + timeBonus - damagePenalty + levelBonus + comboBonus);
    }

    getHighScores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load high scores:', e);
            return [];
        }
    }

    saveHighScore(score) {
        try {
            const scores = this.getHighScores();
            const stats = this.player.stats;
            const elapsed = (this.levelCompleteTime - this.levelStartTime) / 1000;
            const accuracy = stats.shotsFired > 0
                ? Math.round((stats.shotsHit / stats.shotsFired) * 100)
                : 0;

            scores.push({
                score: score,
                kills: stats.enemiesKilled,
                accuracy: accuracy,
                time: Math.floor(elapsed),
                difficulty: window.CONFIG ? window.CONFIG.difficulty : 'normal',
                level: this.player.level,
                date: new Date().toISOString()
            });

            // Sort descending and keep top 5
            scores.sort((a, b) => b.score - a.score);
            scores.splice(5);

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
            console.log(`High score saved: ${score} (rank ${scores.findIndex(s => s.score === score) + 1})`);
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }

    getPersonalBest() {
        const scores = this.getHighScores();
        return scores.length > 0 ? scores[0] : null;
    }

    // ========== BEST RUN RECORDS ==========

    getBestRun() {
        try {
            const data = localStorage.getItem(this.BEST_RUN_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    saveBestRun(stats, elapsed) {
        try {
            const prev = this.getBestRun() || {};
            const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
            const headshotPct = stats.shotsHit > 0 ? Math.round((stats.headshots / stats.shotsHit) * 100) : 0;
            const comboInfo = this.player.getComboInfo ? this.player.getComboInfo() : null;
            const bestStreak = comboInfo ? comboInfo.bestStreak : 0;

            const newBests = {};
            const record = {
                kills: stats.enemiesKilled,
                accuracy: accuracy,
                headshots: stats.headshots || 0,
                headshotPct: headshotPct,
                bestStreak: bestStreak,
                damageDealt: Math.round(stats.damageDealt),
                survivalTime: Math.floor(elapsed),
                level: this.player.level
            };

            // Check for new records
            for (const key of Object.keys(record)) {
                if (prev[key] === undefined || record[key] > prev[key]) {
                    newBests[key] = true;
                }
            }

            // Save best of each stat
            const merged = {};
            for (const key of Object.keys(record)) {
                merged[key] = Math.max(record[key], prev[key] || 0);
            }
            localStorage.setItem(this.BEST_RUN_KEY, JSON.stringify(merged));

            return newBests;
        } catch (e) {
            return {};
        }
    }

    // ========== DEATH SCREEN ==========

    onPlayerDeath() {
        this.showDeathScreen = true;
        this.deathScreenTime = performance.now();

        // Calculate and save best run records
        const elapsed = (performance.now() - this.levelStartTime) / 1000;
        this._deathNewBests = this.saveBestRun(this.player.stats, elapsed);
        this._deathElapsed = elapsed;
    }

    renderDeathScreen() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Red-tinted dark overlay
        ctx.fillStyle = 'rgba(80, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('YOU DIED', w / 2, h * 0.10);

        // Stats panel
        const stats = this.player.stats;
        const elapsed = this._deathElapsed || 0;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
        const headshots = stats.headshots || 0;
        const headshotPct = stats.shotsHit > 0 ? Math.round((headshots / stats.shotsHit) * 100) : 0;
        const comboInfo = this.player.getComboInfo ? this.player.getComboInfo() : null;
        const bestStreak = comboInfo ? comboInfo.bestStreak : 0;
        const newBests = this._deathNewBests || {};

        const panelX = w * 0.2;
        const panelY = h * 0.15;
        const panelW = w * 0.6;
        const panelH = h * 0.58;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '16px monospace';
        const startX = panelX + 20;
        let y = panelY + 32;
        const lineH = 28;

        const statLines = [
            ['Survival Time', timeStr, 'survivalTime'],
            ['Enemies Killed', `${stats.enemiesKilled}`, 'kills'],
            ['Accuracy', `${accuracy}%`, 'accuracy'],
            ['Headshots', `${headshots} (${headshotPct}%)`, 'headshots'],
            ['Damage Dealt', `${Math.round(stats.damageDealt)}`, 'damageDealt'],
            ['Damage Taken', `${Math.round(stats.damageTaken)}`, null],
            ['Best Combo', `${bestStreak}x`, 'bestStreak'],
            ['Level Reached', `${this.player.level}`, 'level'],
            ['Secrets Found', `${this.map.secretsFound}/${this.map.totalSecrets}`, null]
        ];

        for (const [label, value, bestKey] of statLines) {
            ctx.fillStyle = '#AAAAAA';
            ctx.textAlign = 'left';
            ctx.fillText(label, startX, y);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'right';
            ctx.fillText(value, panelX + panelW - 20, y);

            // NEW BEST indicator
            if (bestKey && newBests[bestKey]) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('NEW BEST', panelX + panelW - 20, y + 14);
                ctx.font = '16px monospace';
            }
            y += lineH + (bestKey && newBests[bestKey] ? 10 : 0);
        }

        // Restart button
        const btnW = 200;
        const btnH = 45;
        const btnX = (w - btnW) / 2;
        const btnY = panelY + panelH + 15;

        ctx.fillStyle = '#CC3300';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TRY AGAIN', w / 2, btnY + 30);

        // Store button bounds for click handling
        this._deathRestartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

        // Attach click handler once
        if (!this._deathClickBound) {
            this._deathClickBound = true;
            this.canvas.addEventListener('click', (e) => {
                if (!this.showDeathScreen || !this._deathRestartBtn) return;
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const mx = (e.clientX - rect.left) * scaleX;
                const my = (e.clientY - rect.top) * scaleY;
                const btn = this._deathRestartBtn;
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    this.showDeathScreen = false;
                    this.restartLevel();
                }
            });
        }
    }

    // ========== DYNAMIC DIFFICULTY SCALING ==========

    updateDifficultyScaling() {
        const scaler = this.difficultyScaler;
        if (!scaler.enabled) return;

        const now = Date.now();
        if (now - scaler.lastCheckTime < scaler.checkInterval) return;
        scaler.lastCheckTime = now;

        const stats = this.player.stats;
        const healthPercent = this.player.health / this.player.maxHealth;

        // Kill rate since last check
        const killsSinceCheck = stats.enemiesKilled - scaler.killsAtLastCheck;
        const damageSinceCheck = stats.damageTaken - scaler.damageAtLastCheck;
        scaler.killsAtLastCheck = stats.enemiesKilled;
        scaler.damageAtLastCheck = stats.damageTaken;

        // Determine adjustment direction
        let adjustment = 0;

        // Player dominating: high health + high kill rate = make harder
        if (healthPercent > 0.8 && killsSinceCheck >= 2) {
            adjustment = scaler.stepSize;
        }
        // Player struggling: low health or high damage taken = make easier
        else if (healthPercent < 0.3 || damageSinceCheck > 40) {
            adjustment = -scaler.stepSize;
        }

        if (adjustment === 0) return;

        // Clamp to max modifier range
        const newModifier = Math.max(-scaler.maxModifier,
            Math.min(scaler.maxModifier, scaler.currentModifier + adjustment));

        if (newModifier === scaler.currentModifier) return;

        scaler.currentModifier = newModifier;
        this.applyDifficultyModifier(newModifier);

        const direction = adjustment > 0 ? 'harder' : 'easier';
        console.log(`Difficulty adjustment: enemies ${Math.abs(adjustment)}% ${direction} (total: ${newModifier > 0 ? '+' : ''}${newModifier}%)`);
    }

    applyDifficultyModifier(modifierPercent) {
        const multiplier = 1 + modifierPercent / 100;

        this.map.enemies.forEach(enemy => {
            if (!enemy.active) return;

            if (enemy.enhancedAI && enemy.enhancedAI.behavior) {
                const baseBehavior = EnemyBehaviors[enemy.type];
                if (baseBehavior) {
                    enemy.enhancedAI.behavior.damage = Math.round(baseBehavior.damage * multiplier);
                    enemy.enhancedAI.behavior.speed = Math.round(baseBehavior.speed * multiplier);
                }
            }

            // Scale base enemy stats
            const baseHealth = enemy.maxHealth;
            enemy.speed = Math.round((enemy._baseSpeed || enemy.speed) * multiplier);
            if (!enemy._baseSpeed) enemy._baseSpeed = enemy.speed;
        });
    }

    initDifficultyScaler() {
        const difficulty = window.CONFIG ? window.CONFIG.difficulty : 'normal';
        // Only enable on Normal and Nightmare
        this.difficultyScaler.enabled = difficulty !== 'easy';
        this.difficultyScaler.lastCheckTime = Date.now();
        this.difficultyScaler.currentModifier = 0;
        this.difficultyScaler.killsAtLastCheck = 0;
        this.difficultyScaler.damageAtLastCheck = 0;

        if (this.difficultyScaler.enabled) {
            console.log('Dynamic difficulty scaling enabled');
        }
    }

    restartLevel() {
        console.log('Restarting level...');
        this.levelComplete = false;
        this.showDeathScreen = false;

        // Re-initialize map and enemies
        this.map = new GameMap();
        this.player.x = this.map.spawnX;
        this.player.y = this.map.spawnY;
        this.player.angle = this.map.spawnAngle;
        this.player.health = this.player.maxHealth;
        this.player.armor = 0;
        this.player.isDead = false;
        this.player.stats = {
            enemiesKilled: 0, shotsFired: 0, shotsHit: 0, headshots: 0,
            damageTaken: 0, damageDealt: 0, itemsCollected: 0,
            deaths: 0, timeSurvived: 0
        };
        this.player.weaponManager = new WeaponManager();
        this.player.combo = { count: 0, lastKillTime: 0, window: 3000, bestStreak: 0, totalComboKills: 0 };

        // Re-initialize pickups
        this.pickupManager = new PickupManager();
        this.pickupManager.spawnWeaponPickups(this.map);
        this.pickupManager.spawnRandomPickups(this.map, 6);
        this.pickupManager.spawnModPickups(this.map);

        // Clear projectiles
        this.projectileManager.clear();

        // Re-apply difficulty
        if (window.CONFIG && window.CONFIG.difficulty) {
            window.applyDifficulty(window.CONFIG.difficulty);
        }

        // Reset fog of war
        if (this.hud) {
            this.hud.resetFog();
        }

        // Update renderer with new map
        this.renderer.map = this.map;

        this.totalEnemyCount = this.map.enemies.length;
        this.levelStartTime = performance.now();

        // Reset wave system — start at wave 1 immediately
        this.waveSystem.active = true;
        this.waveSystem.currentWave = 1;
        this.waveSystem.state = 'fighting';

        // Reset dynamic difficulty
        this.initDifficultyScaler();
    }

    render() {
        // Apply screen shake offset
        const shake = this.hud.getScreenShakeOffset();
        if (shake.x !== 0 || shake.y !== 0) {
            this.canvas.style.transform = `translate(${shake.x}px, ${shake.y}px)`;
        } else {
            this.canvas.style.transform = '';
        }

        // Render the 3D world first (this includes putImageData which overwrites canvas)
        this.renderer.render(this.player);

        // CRITICAL: HUD must render AFTER all world rendering is complete
        // This ensures it cannot be overwritten by putImageData or other world rendering
        this.hud.render(this.player, this);

        // Render level completion screen
        if (this.levelComplete) {
            this.renderCompletionScreen();
        }

        // Render death stats screen
        if (this.showDeathScreen) {
            this.renderDeathScreen();
        }

        // Render debug information if enabled (last layer)
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }

    renderCompletionScreen() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Semi-transparent dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('LEVEL COMPLETE', w / 2, h * 0.10);

        // Score display
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`SCORE: ${this.currentScore}`, w / 2, h * 0.16);

        // Personal best indicator
        const personalBest = this.getPersonalBest();
        if (personalBest && this.currentScore >= personalBest.score) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('NEW PERSONAL BEST!', w / 2, h * 0.20);
        } else if (personalBest) {
            ctx.fillStyle = '#888888';
            ctx.font = '14px monospace';
            ctx.fillText(`Personal Best: ${personalBest.score}`, w / 2, h * 0.20);
        }

        // Calculate stats
        const elapsed = (this.levelCompleteTime - this.levelStartTime) / 1000;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const stats = this.player.stats;
        const killed = stats.enemiesKilled;
        const total = this.totalEnemyCount;
        const accuracy = stats.shotsFired > 0
            ? Math.round((stats.shotsHit / stats.shotsFired) * 100)
            : 0;
        const damageTaken = Math.round(stats.damageTaken);

        // Stats panel background
        const panelX = w * 0.2;
        const panelY = h * 0.23;
        const panelW = w * 0.6;
        const panelH = h * 0.50;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Stats lines
        ctx.font = '16px monospace';
        const startX = panelX + 20;
        let y = panelY + 32;
        const lineH = 30;

        const comboInfo = this.player.getComboInfo ? this.player.getComboInfo() : null;
        const bestStreak = comboInfo ? comboInfo.bestStreak : 0;
        const comboKills = comboInfo ? comboInfo.totalComboKills : 0;

        const headshots = stats.headshots || 0;
        const headshotPct = stats.shotsHit > 0 ? Math.round((headshots / stats.shotsHit) * 100) : 0;

        const statLines = [
            ['Time', timeStr],
            ['Enemies Killed', `${killed} / ${total}`],
            ['Accuracy', `${accuracy}%`],
            ['Headshots', `${headshots} (${headshotPct}%)`],
            ['Damage Taken', `${damageTaken}`],
            ['Best Combo', `${bestStreak}x`],
            ['Combo Kills', `${comboKills}`],
            ['Player Level', `${this.player.level}`],
            ['Score', `${this.currentScore}`]
        ];

        for (const [label, value] of statLines) {
            ctx.fillStyle = '#AAAAAA';
            ctx.textAlign = 'left';
            ctx.fillText(label, startX, y);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'right';
            ctx.fillText(value, panelX + panelW - 20, y);
            y += lineH;
        }

        // High scores section
        const scores = this.getHighScores();
        if (scores.length > 0) {
            y += 8;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('TOP SCORES', w / 2, y);
            y += 20;

            ctx.font = '13px monospace';
            for (let i = 0; i < Math.min(scores.length, 5); i++) {
                const s = scores[i];
                const isCurrentRun = s.score === this.currentScore && i === scores.findIndex(x => x.score === this.currentScore);
                ctx.fillStyle = isCurrentRun ? '#FFD700' : '#AAAAAA';
                ctx.textAlign = 'left';
                ctx.fillText(`${i + 1}.`, startX, y);
                ctx.fillText(`${s.score}`, startX + 25, y);
                ctx.textAlign = 'right';
                const diffLabel = s.difficulty ? s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1) : '';
                ctx.fillText(`${diffLabel}  ${s.accuracy}% acc`, panelX + panelW - 20, y);
                y += 18;
            }
        }

        // Play Again button
        const btnW = 200;
        const btnH = 45;
        const btnX = (w - btnW) / 2;
        const btnY = panelY + panelH + 15;

        ctx.fillStyle = '#CC3300';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PLAY AGAIN', w / 2, btnY + 30);

        // Store button bounds for click handling
        this._playAgainBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

        // Attach click handler once
        if (!this._completionClickBound) {
            this._completionClickBound = true;
            this.canvas.addEventListener('click', (e) => {
                if (!this.levelComplete || !this._playAgainBtn) return;
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const mx = (e.clientX - rect.left) * scaleX;
                const my = (e.clientY - rect.top) * scaleY;
                const btn = this._playAgainBtn;
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    this.restartLevel();
                }
            });
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

                case 'm':
                    this.hud.toggleMinimap();
                    console.log('Minimap:', this.hud.showMinimap ? 'ON' : 'OFF');
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
    
    toggleFullscreen() {
        const wrapper = this.canvas.parentElement;
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(err => {
                console.warn('Fullscreen request failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // ========== PAUSE MENU ==========

    handlePauseInput() {
        // Check for Escape to resume
        if (this.inputManager.isKeyPressed('menu')) {
            this.resume();
        }
        // Update input manager to clear frame states even while paused
        this.inputManager.update();
    }

    renderPauseMenu() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        // Menu box
        const menuW = 300;
        const menuH = 280;
        const menuX = (w - menuW) / 2;
        const menuY = (h - menuH) / 2;

        ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
        ctx.fillRect(menuX, menuY, menuW, menuH);
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuW, menuH);

        // Title
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', w / 2, menuY + 40);

        // Menu items
        const items = [
            { label: 'RESUME', action: 'resume' },
            { label: 'RESTART LEVEL', action: 'restart' },
            { label: 'MUSIC: ' + (window.soundEngine && window.soundEngine.musicMuted ? 'OFF' : 'ON'), action: 'toggleMusic' }
        ];

        const itemH = 45;
        const itemStartY = menuY + 70;
        const mouseX = this.inputManager.mouse.x;
        const mouseY = this.inputManager.mouse.y;

        // Store menu item bounds for click handling
        this._pauseMenuItems = [];

        for (let i = 0; i < items.length; i++) {
            const itemY = itemStartY + i * itemH;
            const itemRect = {
                x: menuX + 20,
                y: itemY,
                w: menuW - 40,
                h: itemH - 8,
                action: items[i].action
            };
            this._pauseMenuItems.push(itemRect);

            // Hover detection
            const hovered = mouseX >= itemRect.x && mouseX <= itemRect.x + itemRect.w &&
                           mouseY >= itemRect.y && mouseY <= itemRect.y + itemRect.h;

            // Item background
            ctx.fillStyle = hovered ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(itemRect.x, itemRect.y, itemRect.w, itemRect.h);

            // Item border
            ctx.strokeStyle = hovered ? '#FF4444' : '#555555';
            ctx.lineWidth = 1;
            ctx.strokeRect(itemRect.x, itemRect.y, itemRect.w, itemRect.h);

            // Item text
            ctx.fillStyle = hovered ? '#FFFFFF' : '#CCCCCC';
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(items[i].label, w / 2, itemY + itemH / 2 - 2);
        }

        // Controls hint at bottom
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ESC to resume | N to toggle music', w / 2, menuY + menuH - 15);
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