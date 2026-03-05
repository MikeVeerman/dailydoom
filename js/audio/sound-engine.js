/**
 * Sound Engine - Procedural audio generation for Daily Doom
 * Creates retro-style sound effects using Web Audio API
 */
class SoundEngine {
    constructor() {
        // Web Audio API setup
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = {};
        this.isInitialized = false;
        
        // Volume settings
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        
        console.log('Sound Engine created (requires user interaction to start)');
    }
    
    // Initialize audio context (requires user interaction)
    async init() {
        if (this.isInitialized) return true;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);
            
            // Resume if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.isInitialized = true;
            console.log('Sound Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Sound Engine:', error);
            return false;
        }
    }
    
    // Generate retro-style weapon sounds
    playWeaponFire(weaponType = 'pistol') {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const noiseBuffer = this.createNoiseBuffer(0.1); // Short noise burst
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        
        // Connect noise
        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        // Connect oscillator
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Weapon-specific parameters
        let frequency, noiseMix;
        switch (weaponType) {
            case 'pistol':
                frequency = 150;
                noiseMix = 0.3;
                break;
            case 'shotgun':
                frequency = 80;
                noiseMix = 0.8;
                break;
            case 'rifle':
                frequency = 200;
                noiseMix = 0.4;
                break;
            case 'rocket':
                frequency = 60;
                noiseMix = 0.9;
                break;
            case 'chaingun':
                frequency = 250;
                noiseMix = 0.5;
                break;
            default:
                frequency = 150;
                noiseMix = 0.3;
        }
        
        // Set oscillator parameters
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, now + 0.1);
        
        // Set gain envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.8, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        // Noise envelope
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * noiseMix, now + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        // Start and stop
        oscillator.start(now);
        noiseSource.start(now);
        
        oscillator.stop(now + 0.15);
        noiseSource.stop(now + 0.08);
    }
    
    // Enemy hit/damage sound
    playEnemyHit() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Hit sound parameters - higher pitched thud
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        
        // Quick attack, longer decay
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.6, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
    
    // Enemy death sound
    playEnemyDeath() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Create a more complex death sound
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Multiple frequencies for richer sound
            const baseFreq = 120 + (i * 40);
            oscillator.type = i === 0 ? 'sawtooth' : 'square';
            oscillator.frequency.setValueAtTime(baseFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.2, now + 0.8);
            
            // Staggered envelope
            const startDelay = i * 0.1;
            gainNode.gain.setValueAtTime(0, now + startDelay);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + startDelay + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 0.9);
            
            oscillator.start(now + startDelay);
            oscillator.stop(now + startDelay + 0.9);
        }
    }
    
    // Footstep sounds
    playFootstep() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const noiseBuffer = this.createNoiseBuffer(0.05); // Very short
        const noiseSource = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        // Set up audio chain
        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Filter for more realistic footstep
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(200, now);
        filterNode.Q.setValueAtTime(2, now);
        
        // Quick envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.05);
    }
    
    // Reload sound
    playReload() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Mechanical click sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.setValueAtTime(400, now + 0.05);
        oscillator.frequency.setValueAtTime(600, now + 0.1);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.01);
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, now + 0.06);
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.2, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }
    
    // Player pain/hit sound
    playPlayerHit() {
        if (!this.isInitialized) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Low grunt/pain sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(180, now);
        oscillator.frequency.exponentialRampToValueAtTime(60, now + 0.25);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // Player death sound
    playPlayerDeath() {
        if (!this.isInitialized) return;

        const now = this.audioContext.currentTime;

        for (let i = 0; i < 4; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            const baseFreq = 200 - (i * 30);
            oscillator.type = i < 2 ? 'sawtooth' : 'square';
            oscillator.frequency.setValueAtTime(baseFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(20, now + 1.2);

            const startDelay = i * 0.15;
            gainNode.gain.setValueAtTime(0, now + startDelay);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + startDelay + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 1.2);

            oscillator.start(now + startDelay);
            oscillator.stop(now + startDelay + 1.2);
        }
    }

    // ========== PROCEDURAL BACKGROUND MUSIC SYSTEM ==========

    // Music state
    musicState = 'ambient';
    musicPlaying = false;
    musicMuted = false;
    combatIntensity = 0; // 0-1, smoothly interpolated

    /**
     * Start the background music system with multiple layers:
     * - Pad layer: dark ambient chord pad (always playing)
     * - Bass layer: rhythmic bass line (increases with combat)
     * - Lead layer: ominous melodic phrases (combat only)
     * - Percussion layer: rhythmic pulse (combat only)
     */
    startMusic() {
        if (!this.isInitialized || this.musicPlaying) return;
        this.musicPlaying = true;
        const now = this.audioContext.currentTime;

        // Create music bus (separate gain for music vs SFX)
        this.musicBus = this.audioContext.createGain();
        this.musicBus.gain.setValueAtTime(this.musicVolume, now);
        this.musicBus.connect(this.masterGain);

        // --- PAD LAYER: Dark ambient chord ---
        this._startPadLayer(now);

        // --- BASS LAYER: Rhythmic bass sequence ---
        this._startBassLayer(now);

        // --- PERCUSSION LAYER: Rhythmic pulse ---
        this._startPercLayer(now);

        // --- LEAD LAYER: Ominous melodic stabs ---
        this._startLeadScheduler();

        console.log('Procedural music system started');
    }

    _startPadLayer(now) {
        // Dark minor chord: A2, C3, E3 (Am) with slight detuning
        const padNotes = [55, 65.41, 82.41]; // A2, C3, E3
        this.padOscillators = [];
        this.padGain = this.audioContext.createGain();
        this.padGain.gain.setValueAtTime(0.35, now);
        const padFilter = this.audioContext.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(400, now);
        padFilter.Q.setValueAtTime(1, now);
        this.padFilter = padFilter;
        this.padGain.connect(padFilter);
        padFilter.connect(this.musicBus);

        for (const freq of padNotes) {
            // Two oscillators per note for width
            for (let detune = -6; detune <= 6; detune += 12) {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                osc.detune.setValueAtTime(detune, now);
                osc.connect(this.padGain);
                osc.start(now);
                this.padOscillators.push(osc);
            }
        }
    }

    _startBassLayer(now) {
        // Bass sequence: repeating pattern on Am pentatonic
        this.bassGain = this.audioContext.createGain();
        this.bassGain.gain.setValueAtTime(0, now); // Starts silent, fades in with combat
        this.bassGain.connect(this.musicBus);

        // Bass uses a looping scheduled pattern
        this.bassPattern = [55, 0, 55, 65.41, 0, 55, 0, 73.42]; // A2, rest, A2, C3, rest, A2, rest, D3
        this.bassStepDuration = 0.25; // 16th notes at ~120 BPM
        this.bassStepIndex = 0;
        this.bassScheduler = setInterval(() => this._playBassStep(), this.bassStepDuration * 1000);
    }

    _playBassStep() {
        if (!this.isInitialized || !this.musicPlaying) return;
        const now = this.audioContext.currentTime;
        const freq = this.bassPattern[this.bassStepIndex % this.bassPattern.length];
        this.bassStepIndex++;

        if (freq === 0) return; // Rest

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(gain);
        gain.connect(this.bassGain);

        const noteDuration = this.bassStepDuration * 0.8;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);

        osc.start(now);
        osc.stop(now + noteDuration);
    }

    _startPercLayer(now) {
        // Kick-like percussion pulse
        this.percGain = this.audioContext.createGain();
        this.percGain.gain.setValueAtTime(0, now); // Silent until combat
        this.percGain.connect(this.musicBus);

        this.percPattern = [1, 0, 0, 1, 0, 0, 1, 0]; // Simple kick pattern
        this.percStepIndex = 0;
        this.percScheduler = setInterval(() => this._playPercStep(), this.bassStepDuration * 1000);
    }

    _playPercStep() {
        if (!this.isInitialized || !this.musicPlaying) return;
        const now = this.audioContext.currentTime;
        const hit = this.percPattern[this.percStepIndex % this.percPattern.length];
        this.percStepIndex++;

        if (!hit) return;

        // Kick drum: sine sweep from 150 -> 40 Hz
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        osc.connect(gain);
        gain.connect(this.percGain);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    _startLeadScheduler() {
        // Ominous lead phrases - play occasional notes during combat
        // Am pentatonic: A3, C4, D4, E4, G4
        this.leadNotes = [220, 261.63, 293.66, 329.63, 392];
        this.leadGain = this.audioContext.createGain();
        this.leadGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        const leadFilter = this.audioContext.createBiquadFilter();
        leadFilter.type = 'lowpass';
        leadFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        this.leadGain.connect(leadFilter);
        leadFilter.connect(this.musicBus);

        this.leadScheduler = setInterval(() => this._playLeadPhrase(), 2000);
    }

    _playLeadPhrase() {
        if (!this.isInitialized || !this.musicPlaying) return;
        if (this.combatIntensity < 0.3) return; // Only play during combat

        const now = this.audioContext.currentTime;
        // Pick 2-3 random notes from the scale
        const noteCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < noteCount; i++) {
            const freq = this.leadNotes[Math.floor(Math.random() * this.leadNotes.length)];
            const delay = i * 0.3;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.connect(gain);
            gain.connect(this.leadGain);

            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.25, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

            osc.start(now + delay);
            osc.stop(now + delay + 0.5);
        }
    }

    stopMusic() {
        if (!this.musicPlaying) return;
        this.musicPlaying = false;

        // Stop schedulers
        if (this.bassScheduler) { clearInterval(this.bassScheduler); this.bassScheduler = null; }
        if (this.percScheduler) { clearInterval(this.percScheduler); this.percScheduler = null; }
        if (this.leadScheduler) { clearInterval(this.leadScheduler); this.leadScheduler = null; }

        // Stop pad oscillators
        if (this.padOscillators) {
            for (const osc of this.padOscillators) {
                try { osc.stop(); } catch(e) {}
            }
            this.padOscillators = null;
        }

        // Disconnect music bus
        if (this.musicBus) {
            try { this.musicBus.disconnect(); } catch(e) {}
            this.musicBus = null;
        }

        this.padGain = null;
        this.bassGain = null;
        this.percGain = null;
        this.leadGain = null;
    }

    // Legacy compatibility
    playAmbientDrone() {
        this.startMusic();
    }

    stopAmbientDrone() {
        this.stopMusic();
    }

    /**
     * Update music intensity based on nearby enemies and player state.
     * Called every frame from the game loop.
     */
    updateMusicState(player, enemies) {
        if (!this.isInitialized || !this.musicPlaying) return;
        const now = this.audioContext.currentTime;

        // Calculate combat intensity based on nearby enemy count and distance
        let intensity = 0;
        if (enemies) {
            const nearbyEnemies = enemies.filter(e => {
                if (!e.active) return false;
                const dx = e.x - player.x;
                const dy = e.y - player.y;
                return Math.sqrt(dx * dx + dy * dy) < 400;
            });
            // More enemies = higher intensity, cap at 1.0
            intensity = Math.min(1.0, nearbyEnemies.length / 4);
            // Boost if player health is low
            if (player.health < player.maxHealth * 0.3) {
                intensity = Math.min(1.0, intensity + 0.2);
            }
        }

        // Smooth interpolation (ease toward target)
        this.combatIntensity += (intensity - this.combatIntensity) * 0.05;

        const ci = this.combatIntensity;
        const newState = ci > 0.15 ? 'combat' : 'ambient';
        this.musicState = newState;

        // Adjust layer volumes based on intensity
        if (this.padGain) {
            // Pad: always present, gets darker/louder in combat
            const padVol = 0.2 + ci * 0.15;
            this.padGain.gain.linearRampToValueAtTime(padVol, now + 0.1);
        }
        if (this.padFilter) {
            // Open filter in combat for brighter sound
            const filterFreq = 300 + ci * 600;
            this.padFilter.frequency.linearRampToValueAtTime(filterFreq, now + 0.1);
        }
        if (this.bassGain) {
            // Bass: fades in during combat
            const bassVol = ci * 0.5;
            this.bassGain.gain.linearRampToValueAtTime(bassVol, now + 0.1);
        }
        if (this.percGain) {
            // Percussion: only audible during combat
            const percVol = Math.max(0, (ci - 0.2)) * 0.6;
            this.percGain.gain.linearRampToValueAtTime(percVol, now + 0.1);
        }
        if (this.leadGain) {
            // Lead: only during moderate-high combat
            const leadVol = Math.max(0, (ci - 0.3)) * 0.4;
            this.leadGain.gain.linearRampToValueAtTime(leadVol, now + 0.1);
        }
    }

    /** Set music volume (0-1) */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicBus) {
            this.musicBus.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
        }
    }

    /** Toggle music mute */
    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        if (this.musicBus) {
            const vol = this.musicMuted ? 0 : this.musicVolume;
            this.musicBus.gain.linearRampToValueAtTime(vol, this.audioContext.currentTime + 0.1);
        }
        return !this.musicMuted;
    }

    // ========== AMBIENT ENVIRONMENTAL AUDIO ==========

    ambientZone = null;
    ambientNodes = null;

    /**
     * Determine which ambient zone the player is in based on tile position.
     * Returns: 'control', 'reactor', 'waste', 'cooling', 'corridor'
     */
    getAmbientZone(playerX, playerY) {
        const tileSize = 64;
        const tx = Math.floor(playerX / tileSize);
        const ty = Math.floor(playerY / tileSize);

        // Control Room: cols 3-6, rows 3-7
        if (tx >= 3 && tx <= 6 && ty >= 3 && ty <= 7) return 'control';
        // Reactor Core: cols 9-15, rows 10-15
        if (tx >= 9 && tx <= 15 && ty >= 10 && ty <= 15) return 'reactor';
        // Waste Storage: cols 1-6, rows 18-22
        if (tx >= 1 && tx <= 6 && ty >= 18 && ty <= 22) return 'waste';
        // Cooling Tunnels: cols 1-6 or 18-22, rows 10-15
        if (((tx >= 1 && tx <= 6) || (tx >= 18 && tx <= 22)) && ty >= 10 && ty <= 15) return 'cooling';
        // Default: corridor
        return 'corridor';
    }

    /**
     * Update ambient sounds based on player position. Called from game loop.
     */
    updateAmbientAudio(playerX, playerY) {
        if (!this.isInitialized || this.musicMuted) return;

        const zone = this.getAmbientZone(playerX, playerY);
        if (zone === this.ambientZone) return; // No change

        // Fade out old ambient
        this.stopAmbientZoneAudio();

        this.ambientZone = zone;
        this.startAmbientZoneAudio(zone);
    }

    stopAmbientZoneAudio() {
        if (!this.ambientNodes) return;
        const now = this.audioContext.currentTime;
        // Fade out over 0.5s then stop
        if (this.ambientNodes.gain) {
            this.ambientNodes.gain.gain.linearRampToValueAtTime(0, now + 0.5);
        }
        const nodes = this.ambientNodes;
        setTimeout(() => {
            if (nodes.sources) {
                nodes.sources.forEach(s => { try { s.stop(); } catch(e) {} });
            }
        }, 600);
        this.ambientNodes = null;
    }

    startAmbientZoneAudio(zone) {
        const now = this.audioContext.currentTime;
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.15, now + 0.5);
        gainNode.connect(this.masterGain);

        const sources = [];

        switch (zone) {
            case 'control': {
                // Electrical buzz - high-frequency oscillation
                const buzz = this.audioContext.createOscillator();
                buzz.type = 'sawtooth';
                buzz.frequency.setValueAtTime(120, now);
                const buzzFilter = this.audioContext.createBiquadFilter();
                buzzFilter.type = 'bandpass';
                buzzFilter.frequency.setValueAtTime(180, now);
                buzzFilter.Q.setValueAtTime(8, now);
                buzz.connect(buzzFilter);
                buzzFilter.connect(gainNode);
                buzz.start(now);
                sources.push(buzz);

                // Subtle hum undertone
                const hum = this.audioContext.createOscillator();
                hum.type = 'sine';
                hum.frequency.setValueAtTime(60, now);
                const humGain = this.audioContext.createGain();
                humGain.gain.setValueAtTime(0.3, now);
                hum.connect(humGain);
                humGain.connect(gainNode);
                hum.start(now);
                sources.push(hum);
                break;
            }
            case 'reactor': {
                // Deep machinery hum - low rumble
                const rumble = this.audioContext.createOscillator();
                rumble.type = 'sawtooth';
                rumble.frequency.setValueAtTime(40, now);
                const rumbleFilter = this.audioContext.createBiquadFilter();
                rumbleFilter.type = 'lowpass';
                rumbleFilter.frequency.setValueAtTime(80, now);
                rumble.connect(rumbleFilter);
                rumbleFilter.connect(gainNode);
                rumble.start(now);
                sources.push(rumble);

                // Pulsing overtone
                const pulse = this.audioContext.createOscillator();
                pulse.type = 'sine';
                pulse.frequency.setValueAtTime(80, now);
                const lfo = this.audioContext.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.setValueAtTime(0.5, now);
                const lfoGain = this.audioContext.createGain();
                lfoGain.gain.setValueAtTime(0.4, now);
                lfo.connect(lfoGain);
                lfoGain.connect(pulse.frequency);
                pulse.connect(gainNode);
                pulse.start(now);
                lfo.start(now);
                sources.push(pulse, lfo);
                break;
            }
            case 'waste': {
                // Dripping water - periodic noise bursts
                this._startDripLoop(gainNode, sources);
                break;
            }
            case 'cooling': {
                // Wind/airflow - filtered noise
                const noiseBuffer = this.createNoiseBuffer(4);
                if (noiseBuffer) {
                    const noise = this.audioContext.createBufferSource();
                    noise.buffer = noiseBuffer;
                    noise.loop = true;
                    const windFilter = this.audioContext.createBiquadFilter();
                    windFilter.type = 'bandpass';
                    windFilter.frequency.setValueAtTime(400, now);
                    windFilter.Q.setValueAtTime(1.5, now);
                    // Slowly modulate filter for wind variation
                    const windLfo = this.audioContext.createOscillator();
                    windLfo.type = 'sine';
                    windLfo.frequency.setValueAtTime(0.15, now);
                    const windLfoGain = this.audioContext.createGain();
                    windLfoGain.gain.setValueAtTime(200, now);
                    windLfo.connect(windLfoGain);
                    windLfoGain.connect(windFilter.frequency);
                    noise.connect(windFilter);
                    windFilter.connect(gainNode);
                    noise.start(now);
                    windLfo.start(now);
                    sources.push(noise, windLfo);
                }
                break;
            }
            case 'corridor':
            default: {
                // Quiet low hum - distant machinery
                const distHum = this.audioContext.createOscillator();
                distHum.type = 'sine';
                distHum.frequency.setValueAtTime(50, now);
                const distFilter = this.audioContext.createBiquadFilter();
                distFilter.type = 'lowpass';
                distFilter.frequency.setValueAtTime(100, now);
                distHum.connect(distFilter);
                distFilter.connect(gainNode);
                distHum.start(now);
                sources.push(distHum);
                break;
            }
        }

        this.ambientNodes = { gain: gainNode, sources: sources };
    }

    _startDripLoop(gainNode, sources) {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Create a repeating drip using scheduled oscillators
        const dripInterval = 1.2; // seconds between drips
        const numDrips = 20; // enough for ~24 seconds

        for (let i = 0; i < numDrips; i++) {
            const t = now + i * dripInterval + Math.random() * 0.4;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + Math.random() * 400, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.06);
            const dripGain = this.audioContext.createGain();
            dripGain.gain.setValueAtTime(0, t);
            dripGain.gain.linearRampToValueAtTime(0.6, t + 0.005);
            dripGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(dripGain);
            dripGain.connect(gainNode);
            osc.start(t);
            osc.stop(t + 0.1);
            sources.push(osc);
        }
    }

    // Melee punch sound
    playPunch() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Low thud with noise burst
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.7, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);

        // Impact noise burst
        const noiseBuffer = this.createNoiseBuffer(0.06);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noiseSource.start(now);
        noiseSource.stop(now + 0.08);
    }

    playPunchHit(isCombo) {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Deep bass thump
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isCombo ? 80 : 60, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * (isCombo ? 0.9 : 0.7), now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);

        // Impact crunch noise
        const noiseBuffer = this.createNoiseBuffer(0.1);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isCombo ? 600 : 300, now);
        filter.Q.setValueAtTime(2, now);

        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * (isCombo ? 0.6 : 0.4), now + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noiseSource.start(now);
        noiseSource.stop(now + 0.12);
    }

    // Level complete victory fanfare
    playLevelComplete() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Three ascending chords
        const notes = [
            { freq: 262, delay: 0 },    // C4
            { freq: 330, delay: 0.15 },  // E4
            { freq: 392, delay: 0.3 },   // G4
            { freq: 523, delay: 0.5 }    // C5
        ];

        for (const note of notes) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, now + note.delay);

            gain.gain.setValueAtTime(0, now + note.delay);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + note.delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + 0.6);

            osc.start(now + note.delay);
            osc.stop(now + note.delay + 0.6);
        }
    }

    // Environmental sound effect
    playDoorSound() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
    }
    
    // Enemy alert bark - played when enemy first spots the player
    playEnemyAlert(enemyType = 'guard') {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Base parameters vary by enemy type for distinct voices
        const params = {
            guard:       { freq: 220, endFreq: 350, type: 'sawtooth', duration: 0.25 },
            imp:         { freq: 400, endFreq: 600, type: 'square',   duration: 0.15 },
            demon:       { freq: 80,  endFreq: 140, type: 'sawtooth', duration: 0.4  },
            soldier:     { freq: 260, endFreq: 320, type: 'square',   duration: 0.2  },
            berserker:   { freq: 120, endFreq: 250, type: 'sawtooth', duration: 0.35 },
            spitter:     { freq: 350, endFreq: 500, type: 'triangle', duration: 0.2  },
            shield_guard:{ freq: 180, endFreq: 280, type: 'square',   duration: 0.3  },
            boss:        { freq: 60,  endFreq: 120, type: 'sawtooth', duration: 0.5  },
        };
        const p = params[enemyType] || params.guard;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = p.type;
        osc.frequency.setValueAtTime(p.freq, now);
        osc.frequency.linearRampToValueAtTime(p.endFreq, now + p.duration * 0.6);
        osc.frequency.linearRampToValueAtTime(p.freq * 0.8, now + p.duration);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.duration);

        osc.start(now);
        osc.stop(now + p.duration);
    }

    // Enemy pain bark - distinct from death sound, played on taking damage
    playEnemyPain(enemyType = 'guard') {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        const params = {
            guard:       { freq: 300, type: 'triangle', duration: 0.18 },
            imp:         { freq: 500, type: 'square',   duration: 0.12 },
            demon:       { freq: 150, type: 'sawtooth', duration: 0.25 },
            soldier:     { freq: 320, type: 'triangle', duration: 0.15 },
            berserker:   { freq: 200, type: 'sawtooth', duration: 0.2  },
            spitter:     { freq: 420, type: 'triangle', duration: 0.14 },
            shield_guard:{ freq: 250, type: 'triangle', duration: 0.2  },
            boss:        { freq: 100, type: 'sawtooth', duration: 0.35 },
        };
        const p = params[enemyType] || params.guard;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = p.type;
        osc.frequency.setValueAtTime(p.freq, now);
        osc.frequency.exponentialRampToValueAtTime(p.freq * 0.4, now + p.duration);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.duration);

        osc.start(now);
        osc.stop(now + p.duration);
    }

    // Enemy attack bark - short aggressive sound during combat
    playEnemyAttackBark(enemyType = 'guard') {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        const params = {
            guard:       { freq: 180, endFreq: 300, type: 'sawtooth', duration: 0.2  },
            imp:         { freq: 350, endFreq: 500, type: 'square',   duration: 0.12 },
            demon:       { freq: 100, endFreq: 200, type: 'sawtooth', duration: 0.3  },
            soldier:     { freq: 240, endFreq: 340, type: 'square',   duration: 0.18 },
            berserker:   { freq: 140, endFreq: 350, type: 'sawtooth', duration: 0.25 },
            spitter:     { freq: 300, endFreq: 450, type: 'triangle', duration: 0.15 },
            shield_guard:{ freq: 200, endFreq: 300, type: 'square',   duration: 0.22 },
            boss:        { freq: 70,  endFreq: 180, type: 'sawtooth', duration: 0.4  },
        };
        const p = params[enemyType] || params.guard;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = p.type;
        osc.frequency.setValueAtTime(p.freq, now);
        osc.frequency.linearRampToValueAtTime(p.endFreq, now + p.duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(p.freq * 0.5, now + p.duration);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.duration);

        osc.start(now);
        osc.stop(now + p.duration);
    }

    // Barrel explosion
    playCrateBreak() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Short cracking/breaking noise
        const noiseBuffer = this.createNoiseBuffer(0.15);
        if (noiseBuffer) {
            const noise = this.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.Q.setValueAtTime(2, now);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.01);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            noise.start(now);
            noise.stop(now + 0.15);
        }

        // Low thud
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playWallBreak() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Heavy crumbling noise (longer and deeper than crate)
        const noiseBuffer = this.createNoiseBuffer(0.4);
        if (noiseBuffer) {
            const noise = this.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.6, now + 0.02);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            noise.start(now);
            noise.stop(now + 0.4);
        }

        // Deep impact thud
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playExplosion() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Low rumble
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.6, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // Noise burst
        const noiseBuffer = this.createNoiseBuffer(0.3);
        if (noiseBuffer) {
            const noise = this.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseGain = this.audioContext.createGain();
            noise.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + 0.01);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            noise.start(now);
            noise.stop(now + 0.3);
        }
    }

    // Utility: Create noise buffer for sound effects
    createNoiseBuffer(duration) {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < frameCount; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    // Set master volume
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        }
    }
    
    // Mute/unmute
    setMuted(muted) {
        if (this.masterGain) {
            const volume = muted ? 0 : this.masterVolume;
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }
}

// Global sound engine instance
window.SoundEngine = SoundEngine;
window.soundEngine = new SoundEngine();