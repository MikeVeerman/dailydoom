/**
 * Pickup System - Health packs, ammo, and power-ups
 */
class Pickup {
    constructor(x, y, type = 'health') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.collected = false;
        
        // Visual properties
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2; // radians per second
        this.bobAmount = 8; // pixels
        this.scale = 1.0;
        this.rotation = 0;
        this.rotationSpeed = 1; // radians per second
        
        // Pickup properties based on type
        this.properties = this.getPickupProperties(type);
        
        // Collection range
        this.collectionRadius = 30;
        
        // Animation timing
        this.lastUpdateTime = Date.now();
        
        console.log(`Created ${type} pickup at (${x}, ${y})`);
    }
    
    getPickupProperties(type) {
        const properties = {
            health: {
                value: 25,
                color: '#00FF00',
                maxValue: 100,
                sound: 'health',
                message: '+25 Health'
            },
            health_large: {
                value: 50,
                color: '#00AA00',
                maxValue: 100,
                sound: 'health',
                message: '+50 Health'
            },
            ammo_pistol: {
                value: 24,
                color: '#FFFF00',
                maxValue: 200,
                sound: 'ammo',
                message: '+24 Pistol Ammo'
            },
            ammo_shotgun: {
                value: 16,
                color: '#FF8800',
                maxValue: 100,
                sound: 'ammo',
                message: '+16 Shotgun Shells'
            },
            ammo_rifle: {
                value: 60,
                color: '#AA8800',
                maxValue: 300,
                sound: 'ammo',
                message: '+60 Rifle Ammo'
            },
            armor: {
                value: 25,
                color: '#0088FF',
                maxValue: 100,
                sound: 'armor',
                message: '+25 Armor'
            },
            speed_boost: {
                value: 10000, // duration in ms
                color: '#FF0088',
                maxValue: 0, // no limit
                sound: 'powerup',
                message: 'Speed Boost!'
            },
            damage_boost: {
                value: 15000, // duration in ms
                color: '#FF4400',
                maxValue: 0,
                sound: 'powerup',
                message: 'Damage Boost!'
            }
        };
        
        return properties[type] || properties.health;
    }
    
    update(deltaTime, player) {
        if (!this.active) return;
        
        const now = Date.now();
        deltaTime = deltaTime || (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        
        // Animate bobbing
        this.bobOffset += this.bobSpeed * deltaTime;
        
        // Animate rotation for power-ups
        if (this.type.includes('boost')) {
            this.rotation += this.rotationSpeed * deltaTime;
        }
        
        // Check for collection
        this.checkCollection(player);
    }
    
    checkCollection(player) {
        if (!player || this.collected) return;
        
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.collectionRadius) {
            this.collect(player);
        }
    }
    
    collect(player) {
        if (this.collected) return;
        
        let canCollect = false;
        const props = this.properties;
        
        switch (this.type) {
            case 'health':
            case 'health_large':
                if (player.health < player.maxHealth) {
                    player.health = Math.min(player.maxHealth, player.health + props.value);
                    canCollect = true;
                }
                break;
                
            case 'ammo_pistol':
                if (player.weaponManager.weapons.pistol.maxAmmo > 0) {
                    player.weaponManager.weapons.pistol.maxAmmo += props.value;
                    canCollect = true;
                }
                break;
                
            case 'ammo_shotgun':
                if (player.weaponManager.weapons.shotgun.maxAmmo > 0) {
                    player.weaponManager.weapons.shotgun.maxAmmo += props.value;
                    canCollect = true;
                }
                break;
                
            case 'ammo_rifle':
                if (player.weaponManager.weapons.rifle.maxAmmo > 0) {
                    player.weaponManager.weapons.rifle.maxAmmo += props.value;
                    canCollect = true;
                }
                break;
                
            case 'armor':
                if (player.armor < player.maxArmor) {
                    player.armor = Math.min(player.maxArmor, player.armor + props.value);
                    canCollect = true;
                }
                break;
                
            case 'speed_boost':
                player.applySpeedBoost(props.value);
                canCollect = true;
                break;
                
            case 'damage_boost':
                player.applyDamageBoost(props.value);
                canCollect = true;
                break;
        }
        
        if (canCollect) {
            this.collected = true;
            this.active = false;
            
            // Play collection sound
            this.playCollectionSound();
            
            // Show collection message
            this.showCollectionMessage(props.message);
            
            console.log(`Player collected ${this.type}: ${props.message}`);
        }
    }
    
    playCollectionSound() {
        if (!window.soundEngine || !window.soundEngine.isInitialized) return;
        
        const soundType = this.properties.sound;
        
        // Play appropriate sound based on pickup type
        if (soundType === 'health') {
            this.playHealthSound();
        } else if (soundType === 'ammo') {
            this.playAmmoSound();
        } else if (soundType === 'armor') {
            this.playArmorSound();
        } else if (soundType === 'powerup') {
            this.playPowerupSound();
        }
    }
    
    playHealthSound() {
        const now = window.soundEngine.audioContext.currentTime;
        const oscillator = window.soundEngine.audioContext.createOscillator();
        const gainNode = window.soundEngine.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(window.soundEngine.masterGain);
        
        // Healing sound - upward sweep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.3);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        oscillator.start(now);
        oscillator.stop(now + 0.4);
    }
    
    playAmmoSound() {
        const now = window.soundEngine.audioContext.currentTime;
        
        // Metallic click sound
        for (let i = 0; i < 3; i++) {
            const oscillator = window.soundEngine.audioContext.createOscillator();
            const gainNode = window.soundEngine.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(window.soundEngine.masterGain);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800 + i * 200, now + i * 0.05);
            
            gainNode.gain.setValueAtTime(0, now + i * 0.05);
            gainNode.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
            
            oscillator.start(now + i * 0.05);
            oscillator.stop(now + i * 0.05 + 0.1);
        }
    }
    
    playArmorSound() {
        const now = window.soundEngine.audioContext.currentTime;
        const oscillator = window.soundEngine.audioContext.createOscillator();
        const gainNode = window.soundEngine.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(window.soundEngine.masterGain);
        
        // Metallic armor sound
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.setValueAtTime(400, now + 0.1);
        oscillator.frequency.setValueAtTime(350, now + 0.2);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
    
    playPowerupSound() {
        const now = window.soundEngine.audioContext.currentTime;
        
        // Power-up chord
        const frequencies = [220, 277, 330, 440]; // A minor chord
        
        frequencies.forEach((freq, i) => {
            const oscillator = window.soundEngine.audioContext.createOscillator();
            const gainNode = window.soundEngine.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(window.soundEngine.masterGain);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now);
            
            const startDelay = i * 0.05;
            gainNode.gain.setValueAtTime(0, now + startDelay);
            gainNode.gain.linearRampToValueAtTime(0.15, now + startDelay + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 0.8);
            
            oscillator.start(now + startDelay);
            oscillator.stop(now + startDelay + 0.8);
        });
    }
    
    showCollectionMessage(message) {
        // This would integrate with a message system or HUD
        // For now, just console log
        console.log(`💡 ${message}`);
    }
    
    // Get rendering information for sprite system
    getRenderInfo() {
        const bobY = Math.sin(this.bobOffset) * this.bobAmount;
        
        return {
            x: this.x,
            y: this.y + bobY,
            scale: this.scale,
            rotation: this.rotation,
            color: this.properties.color,
            type: this.type,
            active: this.active
        };
    }
}

// Pickup Manager for handling multiple pickups
class PickupManager {
    constructor() {
        this.pickups = [];
    }
    
    addPickup(x, y, type) {
        const pickup = new Pickup(x, y, type);
        this.pickups.push(pickup);
        return pickup;
    }
    
    update(deltaTime, player) {
        this.pickups.forEach(pickup => {
            pickup.update(deltaTime, player);
        });
        
        // Remove collected pickups
        this.pickups = this.pickups.filter(pickup => pickup.active);
    }
    
    getActivePickups() {
        return this.pickups.filter(pickup => pickup.active);
    }
    
    clear() {
        this.pickups = [];
    }
    
    // Spawn random pickups around the map
    spawnRandomPickups(map, count = 5) {
        const pickupTypes = ['health', 'ammo_pistol', 'ammo_shotgun', 'ammo_rifle', 'armor'];
        
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            
            // Find valid spawn position
            do {
                x = (Math.random() * (map.width - 2) + 1) * map.tileSize;
                y = (Math.random() * (map.height - 2) + 1) * map.tileSize;
                attempts++;
            } while (map.isWallAtPosition(x, y) && attempts < 100);
            
            if (attempts < 100) {
                const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
                this.addPickup(x, y, type);
            }
        }
        
        // Add one power-up with lower probability
        if (Math.random() < 0.3) {
            let x, y;
            let attempts = 0;
            
            do {
                x = (Math.random() * (map.width - 2) + 1) * map.tileSize;
                y = (Math.random() * (map.height - 2) + 1) * map.tileSize;
                attempts++;
            } while (map.isWallAtPosition(x, y) && attempts < 100);
            
            if (attempts < 100) {
                const powerupType = Math.random() < 0.5 ? 'speed_boost' : 'damage_boost';
                this.addPickup(x, y, powerupType);
            }
        }
    }
}

// Export to global scope
window.Pickup = Pickup;
window.PickupManager = PickupManager;