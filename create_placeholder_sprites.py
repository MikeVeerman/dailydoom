#!/usr/bin/env python3
"""
Create placeholder sprites for Daily Doom development
Simple colored sprites to get us started while Replicate account gets set up
"""

from PIL import Image, ImageDraw
import os
from pathlib import Path

def create_sprite_dirs():
    """Create sprite directories"""
    Path("assets/sprites/enemies").mkdir(parents=True, exist_ok=True)
    Path("assets/sprites/weapons").mkdir(parents=True, exist_ok=True)
    Path("assets/sprites/items").mkdir(parents=True, exist_ok=True)

def create_demon_sprite():
    """Create a simple red demon sprite"""
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Body (red circle)
    draw.ellipse([20, 25, 44, 50], fill=(180, 0, 0, 255))
    # Horns
    draw.polygon([(24, 20), (26, 25), (22, 25)], fill=(100, 0, 0, 255))  # Left horn
    draw.polygon([(38, 20), (42, 25), (40, 25)], fill=(100, 0, 0, 255))  # Right horn
    # Eyes  
    draw.ellipse([26, 28, 30, 32], fill=(255, 255, 0, 255))  # Left eye
    draw.ellipse([34, 28, 38, 32], fill=(255, 255, 0, 255))  # Right eye
    # Mouth
    draw.arc([28, 35, 36, 42], 0, 180, fill=(0, 0, 0, 255))
    
    return img

def create_zombie_sprite():
    """Create a gray zombie sprite"""
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Body (gray rectangle)
    draw.rectangle([25, 20, 39, 50], fill=(100, 100, 100, 255))
    # Head
    draw.ellipse([28, 15, 36, 25], fill=(120, 120, 100, 255))
    # Eyes (red)
    draw.rectangle([30, 18, 31, 20], fill=(180, 0, 0, 255))
    draw.rectangle([33, 18, 34, 20], fill=(180, 0, 0, 255))
    # Arms
    draw.rectangle([20, 25, 25, 35], fill=(100, 100, 100, 255))  # Left arm
    draw.rectangle([39, 25, 44, 35], fill=(100, 100, 100, 255))  # Right arm
    
    return img

def create_pistol_sprite():
    """Create a simple pistol sprite"""
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gun barrel (dark gray)
    draw.rectangle([40, 50, 80, 60], fill=(60, 60, 60, 255))
    # Gun grip (brown)  
    draw.rectangle([35, 60, 50, 85], fill=(139, 69, 19, 255))
    # Trigger guard
    draw.arc([45, 65, 55, 75], 0, 180, fill=(60, 60, 60, 255))
    
    return img

def create_health_pack_sprite():
    """Create a health pack sprite"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # White background
    draw.rectangle([4, 4, 28, 28], fill=(255, 255, 255, 255))
    # Red cross
    draw.rectangle([14, 8, 18, 24], fill=(255, 0, 0, 255))  # Vertical
    draw.rectangle([8, 14, 24, 18], fill=(255, 0, 0, 255))  # Horizontal
    
    return img

def create_ammo_box_sprite():
    """Create an ammo box sprite"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Brown box
    draw.rectangle([6, 6, 26, 26], fill=(101, 67, 33, 255))
    # Metal bands
    draw.rectangle([6, 10, 26, 12], fill=(80, 80, 80, 255))
    draw.rectangle([6, 20, 26, 22], fill=(80, 80, 80, 255))
    # Text area (darker)
    draw.rectangle([8, 14, 24, 18], fill=(80, 50, 20, 255))
    
    return img

def main():
    print("🎨 Creating placeholder sprites...")
    
    # Install PIL if needed
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Installing Pillow...")
        os.system("pip3 install Pillow")
        from PIL import Image, ImageDraw
    
    create_sprite_dirs()
    
    # Create enemy sprites
    demon = create_demon_sprite()
    demon.save("assets/sprites/enemies/demon_idle.png")
    print("✅ Created demon sprite")
    
    zombie = create_zombie_sprite()  
    zombie.save("assets/sprites/enemies/zombie_idle.png")
    print("✅ Created zombie sprite")
    
    # Imp is just a smaller demon
    imp = demon.resize((48, 48))
    imp_final = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    imp_final.paste(imp, (8, 8))
    imp_final.save("assets/sprites/enemies/imp_idle.png")
    print("✅ Created imp sprite")
    
    # Create weapon sprites
    pistol = create_pistol_sprite()
    pistol.save("assets/sprites/weapons/pistol_idle.png") 
    print("✅ Created pistol sprite")
    
    # Create item sprites
    health = create_health_pack_sprite()
    health.save("assets/sprites/items/health_pack.png")
    print("✅ Created health pack sprite")
    
    ammo = create_ammo_box_sprite()
    ammo.save("assets/sprites/items/ammo_box.png")
    print("✅ Created ammo box sprite")
    
    print("🎯 Placeholder sprites created!")
    print("📁 Check assets/sprites/ directory")
    print("🚀 The night shift AI will integrate these into the game!")
    print()
    print("💡 Once Replicate billing is set up, run:")  
    print("   ./generate_sprites.py")
    print("   (to replace these with AI-generated sprites)")

if __name__ == "__main__":
    main()