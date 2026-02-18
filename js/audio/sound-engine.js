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
        oscillator2.frequency.setValueAtTime(30.5, this.audioContext.currentTime); // Slight beating
        
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