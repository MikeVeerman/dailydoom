#!/usr/bin/env python3
"""
Daily Doom Sprite Generator
Creates initial sprite assets via Replicate API

COST ESTIMATE: ~$1.50-2.00 total (15 images @ ~$0.10 each)
"""

import os
import requests
import time
import sys
from pathlib import Path

# Configuration
REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')
if not REPLICATE_API_TOKEN:
    print("❌ Error: Set REPLICATE_API_TOKEN environment variable")
    print("Get token from: https://replicate.com/account/api-tokens")
    sys.exit(1)

# Create directories
Path("assets/sprites/enemies").mkdir(parents=True, exist_ok=True)
Path("assets/sprites/weapons").mkdir(parents=True, exist_ok=True)
Path("assets/sprites/items").mkdir(parents=True, exist_ok=True)

# Sprite definitions - carefully curated to avoid cost explosion!
SPRITES_TO_GENERATE = [
    # Enemies (5 sprites)
    {
        "name": "imp_idle",
        "prompt": "16-bit pixel art demon imp sprite, 64x64 pixels, Doom game style, red skin with small horns, front-facing idle pose, transparent background, retro 90s video game graphics, sharp pixels, no anti-aliasing",
        "path": "assets/sprites/enemies/imp_idle.png"
    },
    {
        "name": "zombie_idle", 
        "prompt": "16-bit pixel art zombie soldier sprite, 64x64 pixels, Doom game style, gray uniform, shambling pose, front-facing, transparent background, retro 90s video game graphics, sharp pixels",
        "path": "assets/sprites/enemies/zombie_idle.png"
    },
    {
        "name": "demon_idle",
        "prompt": "16-bit pixel art demon sprite, 64x64 pixels, Doom game style, large red monster with horns and claws, front-facing, transparent background, retro video game art, chunky pixels",
        "path": "assets/sprites/enemies/demon_idle.png"
    },
    
    # Weapons (4 sprites)  
    {
        "name": "pistol_idle",
        "prompt": "First person view pixel art pistol, Doom game style, brown grip, silver barrel, held in hands at bottom of screen, 16-bit graphics, retro FPS weapon sprite",
        "path": "assets/sprites/weapons/pistol_idle.png"
    },
    {
        "name": "shotgun_idle",
        "prompt": "First person view pixel art shotgun, Doom game style, wooden stock, double barrel, held in hands, 16-bit graphics, retro FPS weapon sprite",
        "path": "assets/sprites/weapons/shotgun_idle.png"
    },
    {
        "name": "rifle_idle", 
        "prompt": "First person view pixel art assault rifle, Doom game style, black metal, military weapon, held in hands, 16-bit graphics, retro FPS weapon sprite",
        "path": "assets/sprites/weapons/rifle_idle.png"
    },
    
    # Items (4 sprites)
    {
        "name": "health_pack",
        "prompt": "16-bit pixel art health pack item, Doom game style, red cross medical kit, 32x32 pixels, top-down view, transparent background, retro video game pickup item",
        "path": "assets/sprites/items/health_pack.png"
    },
    {
        "name": "ammo_box",
        "prompt": "16-bit pixel art ammo box, Doom game style, brown/green military ammo crate, 32x32 pixels, top-down view, transparent background, retro video game item",
        "path": "assets/sprites/items/ammo_box.png"
    },
    
    # Effects (2 sprites)
    {
        "name": "muzzle_flash",
        "prompt": "16-bit pixel art muzzle flash effect, Doom game style, bright yellow/orange explosion, 32x32 pixels, transparent background, retro FPS effect sprite",
        "path": "assets/sprites/weapons/muzzle_flash.png" 
    },
    {
        "name": "blood_splat",
        "prompt": "16-bit pixel art blood splatter effect, Doom game style, red blood drops, 32x32 pixels, transparent background, retro video game gore effect",
        "path": "assets/sprites/enemies/blood_splat.png"
    }
]

def generate_image(prompt, output_path):
    """Generate image via Replicate API"""
    print(f"🎨 Generating: {Path(output_path).stem}")
    print(f"📝 Prompt: {prompt[:80]}...")
    
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Using SDXL model - good for pixel art with right prompts
    data = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "input": {
            "prompt": prompt,
            "width": 512,
            "height": 512,
            "num_outputs": 1,
            "scheduler": "K_EULER",
            "num_inference_steps": 25,
            "guidance_scale": 7.5,
            "seed": None
        }
    }
    
    # Start prediction
    response = requests.post("https://api.replicate.com/v1/predictions", 
                           headers=headers, json=data)
    
    if response.status_code != 201:
        print(f"❌ Failed to start generation: {response.text}")
        return False
    
    prediction = response.json()
    prediction_id = prediction["id"]
    
    # Poll for completion
    print(f"⏳ Waiting for generation (ID: {prediction_id[:8]}...)")
    
    max_attempts = 60  # 5 minutes max
    for attempt in range(max_attempts):
        time.sleep(5)
        
        response = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}",
                              headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Failed to check status: {response.text}")
            return False
            
        prediction = response.json()
        status = prediction["status"]
        
        if status == "succeeded":
            image_url = prediction["output"][0]
            
            # Download image
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, 'wb') as f:
                    f.write(img_response.content)
                print(f"✅ Saved: {output_path}")
                return True
            else:
                print(f"❌ Failed to download image")
                return False
                
        elif status == "failed":
            print(f"❌ Generation failed: {prediction.get('error', 'Unknown error')}")
            return False
        elif status == "canceled":
            print(f"❌ Generation canceled")
            return False
        else:
            print(f"⏳ Status: {status} (attempt {attempt + 1}/{max_attempts})")
    
    print(f"❌ Generation timed out")
    return False

def main():
    print("🎮 Daily Doom Sprite Generator")
    print(f"📊 Will generate {len(SPRITES_TO_GENERATE)} sprites")
    print(f"💰 Estimated cost: ${len(SPRITES_TO_GENERATE) * 0.10:.2f}")
    print()
    
    # Confirm before proceeding
    confirm = input("Continue? (y/N): ").lower().strip()
    if confirm not in ['y', 'yes']:
        print("❌ Canceled")
        return
    
    successful = 0
    failed = 0
    
    for i, sprite in enumerate(SPRITES_TO_GENERATE, 1):
        print(f"\n--- Sprite {i}/{len(SPRITES_TO_GENERATE)} ---")
        
        if generate_image(sprite["prompt"], sprite["path"]):
            successful += 1
        else:
            failed += 1
            
        # Brief pause between generations
        if i < len(SPRITES_TO_GENERATE):
            time.sleep(2)
    
    print(f"\n🎯 Generation Complete!")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"💰 Estimated cost: ${successful * 0.10:.2f}")
    
    if successful > 0:
        print(f"\n📁 Sprites saved to assets/ directory")
        print("🚀 Run the game to see your new assets!")

if __name__ == "__main__":
    main()