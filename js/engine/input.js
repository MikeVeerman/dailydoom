/**
 * Input Manager - Handles keyboard and mouse input
 */
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Key state tracking
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        
        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            leftButton: false,
            rightButton: false,
            middleButton: false,
            locked: false
        };
        
        // Input settings
        this.mouseSensitivity = 0.003;
        this.keyRepeatDelay = 150;
        
        // Key mappings
        this.keyMap = {
            // Movement
            'KeyW': 'forward',
            'KeyS': 'backward', 
            'KeyA': 'strafeLeft',
            'KeyD': 'strafeRight',
            
            // Alternative movement
            'ArrowUp': 'forward',
            'ArrowDown': 'backward',
            'ArrowLeft': 'turnLeft',
            'ArrowRight': 'turnRight',
            
            // Actions
            'Space': 'dash',
            'ShiftLeft': 'run',
            'ShiftRight': 'run',
            'ControlLeft': 'crouch',
            'ControlRight': 'crouch',
            
            // Weapon/interaction
            'KeyX': 'fire',
            'KeyV': 'punch',
            'KeyE': 'use',
            'KeyR': 'reload',
            'KeyQ': 'weapon1',
            'Digit1': 'weapon1',
            'Digit2': 'weapon2',
            'Digit3': 'weapon3',
            'Digit4': 'weapon4',
            'Digit5': 'weapon5',
            
            // System
            'Escape': 'menu',
            'KeyM': 'map',
            'KeyN': 'toggleMusic',
            'Tab': 'scores',
            'F1': 'debug',
            'KeyF': 'fullscreen'
        };
        
        // Bind event listeners
        this.bindEvents();
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mouse events
        this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('contextmenu', this.onContextMenu.bind(this));
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this));
        
        // Prevent default behaviors
        document.addEventListener('keydown', (e) => {
            if (this.keyMap[e.code]) {
                e.preventDefault();
            }
        });
        
        // Focus handling
        window.addEventListener('blur', this.onWindowBlur.bind(this));
        window.addEventListener('focus', this.onWindowFocus.bind(this));
    }
    
    update() {
        // Reset frame-specific input states
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    // Keyboard event handlers
    onKeyDown(event) {
        const actions = this.keyMap[event.code];
        if (actions) {
            const list = Array.isArray(actions) ? actions : [actions];
            for (const action of list) {
                if (!this.keys[action]) {
                    this.keysPressed[action] = true;
                }
                this.keys[action] = true;
            }
        }
    }

    onKeyUp(event) {
        const actions = this.keyMap[event.code];
        if (actions) {
            const list = Array.isArray(actions) ? actions : [actions];
            for (const action of list) {
                this.keys[action] = false;
                this.keysReleased[action] = true;
            }
        }
        
        // Handle escape key for pointer lock
        if (event.code === 'Escape' && this.mouse.locked) {
            document.exitPointerLock();
        }
    }
    
    // Mouse event handlers
    onCanvasClick(event) {
        // Don't request pointer lock while game is paused
        if (!this.mouse.locked && !(window.game && window.game.isPaused())) {
            this.requestPointerLock();
        }
    }
    
    onMouseMove(event) {
        if (this.mouse.locked) {
            this.mouse.deltaX += event.movementX || 0;
            this.mouse.deltaY += event.movementY || 0;
        } else {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        }
    }
    
    onMouseDown(event) {
        switch (event.button) {
            case 0: // Left button
                this.mouse.leftButton = true;
                break;
            case 1: // Middle button
                this.mouse.middleButton = true;
                event.preventDefault();
                break;
            case 2: // Right button
                this.mouse.rightButton = true;
                break;
        }
    }
    
    onMouseUp(event) {
        switch (event.button) {
            case 0: // Left button
                this.mouse.leftButton = false;
                break;
            case 1: // Middle button
                this.mouse.middleButton = false;
                break;
            case 2: // Right button
                this.mouse.rightButton = false;
                break;
        }
    }
    
    onContextMenu(event) {
        event.preventDefault(); // Disable right-click context menu
    }
    
    // Pointer lock handlers
    requestPointerLock() {
        this.canvas.requestPointerLock();
    }
    
    onPointerLockChange() {
        this.mouse.locked = document.pointerLockElement === this.canvas;
        
        if (this.mouse.locked) {
            console.log('Pointer locked');
        } else {
            console.log('Pointer unlocked');
        }
    }
    
    onPointerLockError() {
        console.error('Pointer lock failed');
    }
    
    // Window focus handlers
    onWindowBlur() {
        // Clear all input states when window loses focus
        this.keys = {};
        this.mouse.leftButton = false;
        this.mouse.rightButton = false;
        this.mouse.middleButton = false;
    }
    
    onWindowFocus() {
        // Reset input state when window gains focus
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    // Input query methods
    isKeyDown(action) {
        return !!this.keys[action];
    }
    
    isKeyPressed(action) {
        return !!this.keysPressed[action];
    }
    
    isKeyReleased(action) {
        return !!this.keysReleased[action];
    }
    
    getMouseDelta() {
        return {
            x: this.mouse.deltaX * this.mouseSensitivity,
            y: this.mouse.deltaY * this.mouseSensitivity
        };
    }
    
    isMouseLocked() {
        return this.mouse.locked;
    }
    
    isMouseButtonDown(button) {
        switch (button) {
            case 'left': return this.mouse.leftButton;
            case 'right': return this.mouse.rightButton;
            case 'middle': return this.mouse.middleButton;
            default: return false;
        }
    }
    
    // Movement helper methods
    getMovementVector() {
        const movement = { x: 0, y: 0 };
        
        if (this.isKeyDown('forward')) movement.y += 1;
        if (this.isKeyDown('backward')) movement.y -= 1;
        if (this.isKeyDown('strafeLeft')) movement.x -= 1;
        if (this.isKeyDown('strafeRight')) movement.x += 1;
        
        // Normalize diagonal movement
        if (movement.x !== 0 && movement.y !== 0) {
            const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            movement.x /= length;
            movement.y /= length;
        }
        
        return movement;
    }
    
    getTurnInput() {
        let turn = 0;
        
        // Keyboard turning
        if (this.isKeyDown('turnLeft')) turn -= 1;
        if (this.isKeyDown('turnRight')) turn += 1;
        
        // Mouse turning (if locked)
        if (this.mouse.locked) {
            turn += this.mouse.deltaX * this.mouseSensitivity * 100; // Scale mouse input
        }
        
        return turn;
    }
    
    // Action queries
    isRunning() {
        return this.isKeyDown('run');
    }
    
    isCrouching() {
        return this.isKeyDown('crouch');
    }
    
    isJumping() {
        return this.isKeyPressed('jump');
    }
    
    isUsingItem() {
        return this.isKeyPressed('use');
    }
    
    isShooting() {
        return this.mouse.leftButton || this.isKeyDown('fire');
    }

    isPunching() {
        return this.isKeyPressed('punch');
    }

    isDashing() {
        return this.isKeyPressed('dash');
    }

    isAltFiring() {
        return this.mouse.rightButton;
    }
    
    // Debug
    getDebugInfo() {
        return {
            mouseLocked: this.mouse.locked,
            activeKeys: Object.keys(this.keys).filter(key => this.keys[key]),
            mouseButtons: {
                left: this.mouse.leftButton,
                right: this.mouse.rightButton,
                middle: this.mouse.middleButton
            },
            mouseDelta: { x: this.mouse.deltaX, y: this.mouse.deltaY }
        };
    }
}

// Export to global scope
window.InputManager = InputManager;