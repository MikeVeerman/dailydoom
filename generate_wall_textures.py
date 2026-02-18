#!/usr/bin/env python3
"""
Generate procedural wall textures for Daily Doom
Creates tileable textures that match classic Doom aesthetic
"""

from PIL import Image, ImageDraw, ImageFilter
import random
import math
import os

def create_stone_texture(size=64):
    """Create a stone/concrete texture"""
    img = Image.new('RGB', (size, size))
    pixels = img.load()
    
    # Base grey color with variation
    for y in range(size):
        for x in range(size):
            # Add noise and variation
            noise = random.randint(-20, 20)
            base_color = 100 + noise
            base_color = max(50, min(150, base_color))
            
            # Add some crack-like patterns
            if random.random() < 0.02:
                base_color -= 30
            
            pixels[x, y] = (base_color, base_color, base_color + random.randint(-5, 5))
    
    # Add some horizontal lines for concrete look
    draw = ImageDraw.Draw(img)
    for i in range(3):
        y_pos = random.randint(5, size-5)
        draw.line([(0, y_pos), (size, y_pos)], fill=(80, 80, 80), width=1)
    
    return img

def create_metal_texture(size=64):
    """Create a metal panel texture"""
    img = Image.new('RGB', (size, size))
    pixels = img.load()
    
    # Base metallic color
    base_r, base_g, base_b = 120, 130, 140
    
    for y in range(size):
        for x in range(size):
            # Metallic variation
            variation = random.randint(-15, 15)
            r = max(80, min(160, base_r + variation))
            g = max(80, min(160, base_g + variation))
            b = max(80, min(160, base_b + variation))
            
            pixels[x, y] = (r, g, b)
    
    # Add panel lines
    draw = ImageDraw.Draw(img)
    # Vertical panels
    for x in [size//3, 2*size//3]:
        draw.line([(x, 0), (x, size)], fill=(90, 90, 90), width=2)
        draw.line([(x+1, 0), (x+1, size)], fill=(160, 160, 160), width=1)
    
    return img

def create_brick_texture(size=64):
    """Create a brick wall texture"""
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Fill with mortar color
    draw.rectangle([(0, 0), (size, size)], fill=(80, 75, 70))
    
    # Draw bricks
    brick_height = size // 4
    brick_colors = [(140, 80, 60), (120, 70, 50), (160, 90, 70)]
    
    for row in range(4):
        y = row * brick_height
        offset = (brick_height // 2) if row % 2 else 0
        
        brick_width = size // 3
        for col in range(4):  # Extra column for offset wrapping
            x = col * brick_width - offset
            if x < size and x + brick_width > 0:
                color = random.choice(brick_colors)
                # Add some variation
                color = tuple(max(30, min(200, c + random.randint(-10, 10))) for c in color)
                
                x_start = max(0, x + 1)
                x_end = min(size, x + brick_width - 1)
                y_start = y + 1
                y_end = min(size, y + brick_height - 1)
                
                if x_start < x_end and y_start < y_end:
                    draw.rectangle([(x_start, y_start), (x_end, y_end)], fill=color)
    
    return img

def create_tech_texture(size=64):
    """Create a high-tech facility texture"""
    img = Image.new('RGB', (size, size))
    pixels = img.load()
    
    # Base dark blue/grey
    base_color = (60, 70, 90)
    
    for y in range(size):
        for x in range(size):
            variation = random.randint(-10, 10)
            r = max(40, min(100, base_color[0] + variation))
            g = max(40, min(100, base_color[1] + variation))
            b = max(70, min(120, base_color[2] + variation))
            pixels[x, y] = (r, g, b)
    
    # Add circuit-like patterns
    draw = ImageDraw.Draw(img)
    
    # Add some glowing lines
    for i in range(2):
        if random.random() < 0.7:
            if random.random() < 0.5:
                # Horizontal line
                y = random.randint(size//4, 3*size//4)
                draw.line([(5, y), (size-5, y)], fill=(0, 150, 255), width=1)
                draw.line([(5, y), (size-5, y)], fill=(100, 200, 255), width=1)
            else:
                # Vertical line
                x = random.randint(size//4, 3*size//4)
                draw.line([(x, 5), (x, size-5)], fill=(0, 150, 255), width=1)
                draw.line([(x, 5), (x, size-5)], fill=(100, 200, 255), width=1)
    
    return img

def create_marble_texture(size=64):
    """Create a polished marble texture"""
    img = Image.new('RGB', (size, size))
    pixels = img.load()
    
    # Base white/cream color
    for y in range(size):
        for x in range(size):
            # Create subtle marble veining pattern
            wave1 = math.sin(x * 0.1 + y * 0.05) * 10
            wave2 = math.sin(y * 0.15 + x * 0.03) * 8
            
            base = 220 + wave1 + wave2 + random.randint(-5, 5)
            base = max(200, min(240, base))
            
            # Slight color variation
            r = base
            g = base - random.randint(0, 10)
            b = base - random.randint(0, 15)
            
            pixels[x, y] = (int(r), int(g), int(b))
    
    # Add some darker veins
    draw = ImageDraw.Draw(img)
    for i in range(2):
        # Random marble vein
        start_x, start_y = random.randint(0, size), random.randint(0, size)
        points = [(start_x, start_y)]
        
        # Create wavy line
        for j in range(10):
            last_x, last_y = points[-1]
            new_x = last_x + random.randint(-8, 8)
            new_y = last_y + random.randint(-8, 8)
            new_x = max(0, min(size-1, new_x))
            new_y = max(0, min(size-1, new_y))
            points.append((new_x, new_y))
        
        # Draw the vein
        for k in range(len(points)-1):
            draw.line([points[k], points[k+1]], fill=(180, 180, 170), width=1)
    
    return img

def main():
    """Generate all wall textures"""
    textures = {
        'stone': create_stone_texture(),
        'metal': create_metal_texture(),
        'brick': create_brick_texture(),
        'tech': create_tech_texture(),
        'marble': create_marble_texture()
    }
    
    os.makedirs('assets/textures', exist_ok=True)
    
    for name, texture in textures.items():
        # Save original size
        texture.save(f'assets/textures/{name}.png')
        print(f'Generated {name}.png (64x64)')
        
        # Also save a larger version for higher quality
        large = texture.resize((128, 128), Image.NEAREST)
        large.save(f'assets/textures/{name}_large.png')
        print(f'Generated {name}_large.png (128x128)')
    
    print(f'\nGenerated {len(textures)} wall texture types!')
    print('Textures saved in assets/textures/')

if __name__ == '__main__':
    main()