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

    // Ambient drone sound
    playAmbientDrone() {
        if (!this.isInitialized || this.ambientDrone) return;

        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Low frequency drone
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(30, this.audioContext.currentTime);

        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(30.5, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(this.musicVolume * 0.3, this.audioContext.currentTime);

        oscillator1.start();
        oscillator2.start();

        this.ambientDrone = { oscillator1, oscillator2, gainNode };
    }

    stopAmbientDrone() {
        if (this.ambientDrone) {
            this.ambientDrone.oscillator1.stop();
            this.ambientDrone.oscillator2.stop();
            this.ambientDrone = null;
        }
    }

    // Adaptive music system
    musicState = 'ambient'; // ambient, combat, victory

    updateMusicState(player, enemies) {
        if (!this.isInitialized) return;

        const nearbyEnemies = enemies ? enemies.filter(e => {
            if (!e.active) return false;
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            return Math.sqrt(dx * dx + dy * dy) < 300;
        }) : [];

        const newState = nearbyEnemies.length > 0 ? 'combat' : 'ambient';

        if (newState !== this.musicState) {
            this.musicState = newState;
            this.transitionMusic(newState);
        }
    }

    transitionMusic(state) {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Fade ambient drone based on state
        if (this.ambientDrone) {
            const targetVolume = state === 'combat' ? this.musicVolume * 0.1 : this.musicVolume * 0.3;
            this.ambientDrone.gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.5);
        }

        // Start combat pulse if entering combat
        if (state === 'combat' && !this.combatPulse) {
            this.startCombatMusic();
        } else if (state === 'ambient' && this.combatPulse) {
            this.stopCombatMusic();
        }
    }

    startCombatMusic() {
        if (!this.isInitialized) return;
        const now = this.audioContext.currentTime;

        // Create a pulsing bass for combat
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // LFO for pulsing effect
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now); // Low A

        gain.gain.setValueAtTime(this.musicVolume * 0.15, now);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(2, now); // 2 Hz pulse (120 BPM feel)
        lfoGain.gain.setValueAtTime(this.musicVolume * 0.1, now);

        osc.start(now);
        lfo.start(now);

        this.combatPulse = { osc, gain, lfo, lfoGain };
    }

    stopCombatMusic() {
        if (this.combatPulse) {
            const now = this.audioContext.currentTime;
            this.combatPulse.gain.gain.linearRampToValueAtTime(0.001, now + 1);
            this.combatPulse.lfoGain.gain.linearRampToValueAtTime(0, now + 1);

            const pulse = this.combatPulse;
            setTimeout(() => {
                try { pulse.osc.stop(); } catch(e) {}
                try { pulse.lfo.stop(); } catch(e) {}
            }, 1200);

            this.combatPulse = null;
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