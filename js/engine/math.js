/**
 * Math utilities for raycasting engine
 */
class MathUtils {
    static PI = Math.PI;
    static PI2 = Math.PI * 2;
    static HALF_PI = Math.PI / 2;
    
    // Convert degrees to radians
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    // Convert radians to degrees
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    // Normalize angle to 0-2π range
    static normalizeAngle(angle) {
        while (angle < 0) angle += this.PI2;
        while (angle >= this.PI2) angle -= this.PI2;
        return angle;
    }
    
    // Linear interpolation
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Calculate distance between two points
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Check if point is inside rectangle
    static pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
    }
    
    // Fast integer operations for performance
    static fastFloor(x) {
        return x | 0;
    }
    
    static fastCeil(x) {
        return (x | 0) + (x > (x | 0) ? 1 : 0);
    }
    
    // Fix floating point precision issues
    static fixAngle(angle) {
        if (angle > MathUtils.PI2) angle -= MathUtils.PI2;
        if (angle < 0) angle += MathUtils.PI2;
        return angle;
    }
    
    // Calculate perpendicular distance (for fish-eye correction)
    static perpDistance(distance, rayAngle, playerAngle) {
        return distance * Math.cos(rayAngle - playerAngle);
    }
}

/**
 * 2D Vector class for position and direction calculations
 */
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    // Vector operations
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    
    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
    
    divide(scalar) {
        return new Vector2(this.x / scalar, this.y / scalar);
    }
    
    // Vector properties
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2(0, 0);
        return this.divide(len);
    }
    
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    
    // Rotation
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
    
    // Create vector from angle
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
}

// Export to global scope
window.MathUtils = MathUtils;
window.Vector2 = Vector2;