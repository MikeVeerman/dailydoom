#!/usr/bin/env python3
"""
Generate the remaining sprites with better rate limiting
"""

import os
import requests
import time
import sys
from pathlib import Path

REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')
if not REPLICATE_API_TOKEN:
    print("❌ Error: Set REPLICATE_API_TOKEN environment variable")
    sys.exit(1)

# Only the ones that failed
REMAINING_SPRITES = [
    {
        "name": "demon_idle",
        "prompt": "16-bit pixel art large demon monster sprite, 64x64 pixels, retro video game style, red creature with horns and claws, front-facing, transparent background, chunky pixels, 90s game graphics",
        "path": "assets/sprites/enemies/demon_idle.png"
    },
    {
        "name": "pistol_idle", 
        "prompt": "First person view pixel art handgun, retro FPS game style, brown grip, silver barrel, held in hands at bottom of screen, 16-bit graphics, classic shooter weapon sprite",
        "path": "assets/sprites/weapons/pistol_idle.png"
    },
    {
        "name": "rifle_idle",
        "prompt": "First person view pixel art military rifle, retro FPS style, black metal weapon, held in hands, 16-bit graphics, classic video game gun sprite",
        "path": "assets/sprites/weapons/rifle_idle.png"  
    },
    {
        "name": "health_pack",
        "prompt": "16-bit pixel art medical kit item, retro video game style, red cross symbol, 32x32 pixels, top-down view, transparent background, classic game pickup",
        "path": "assets/sprites/items/health_pack.png"
    },
    {
        "name": "blood_splat",
        "prompt": "16-bit pixel art red liquid drops effect, retro video game style, small splash pattern, 32x32 pixels, transparent background, classic game effect",
        "path": "assets/sprites/enemies/blood_splat.png"
    }
]

def generate_image_with_retry(prompt, output_path, max_retries=3):
    """Generate image with retry logic for rate limiting"""
    
    for attempt in range(max_retries):
        print(f"🎨 Generating: {Path(output_path).stem} (attempt {attempt + 1}/{max_retries})")
        print(f"📝 Prompt: {prompt[:70]}...")
        
        headers = {
            "Authorization": f"Token {REPLICATE_API_TOKEN}",
            "Content-Type": "application/json"
        }
        
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
                "seed": 42 + attempt  # Different seed for retries
            }
        }
        
        # Start prediction
        response = requests.post("https://api.replicate.com/v1/predictions", 
                               headers=headers, json=data)
        
        if response.status_code == 429:  # Rate limited
            retry_after = response.json().get("retry_after", 10)
            print(f"⏳ Rate limited, waiting {retry_after}s...")
            time.sleep(retry_after + 2)  # Extra buffer
            continue
            
        if response.status_code != 201:
            print(f"❌ Failed to start: {response.text}")
            if attempt < max_retries - 1:
                time.sleep(5)
                continue
            return False
        
        prediction = response.json()
        prediction_id = prediction["id"]
        
        print(f"⏳ Waiting for generation (ID: {prediction_id[:8]}...)")
        
        # Poll for completion
        for wait_attempt in range(60):  # 5 minutes max
            time.sleep(5)
            
            response = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}",
                                  headers=headers)
            
            if response.status_code != 200:
                continue
                
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
                    
            elif status == "failed":
                error_msg = prediction.get('error', 'Unknown error')
                print(f"❌ Generation failed: {error_msg}")
                if "NSFW" in error_msg and attempt < max_retries - 1:
                    print("🔄 Retrying with different seed...")
                    break  # Try again with different seed
                return False
                
            elif status == "canceled":
                print(f"❌ Generation canceled")
                return False
            else:
                if wait_attempt % 6 == 0:  # Every 30 seconds
                    print(f"⏳ Status: {status}")
        
        # If we get here, it timed out - try again
        if attempt < max_retries - 1:
            print("⏳ Timed out, retrying...")
            time.sleep(5)
    
    print(f"❌ All attempts failed")
    return False

def main():
    print("🎨 Generating remaining Daily Doom sprites...")
    print(f"📊 Will generate {len(REMAINING_SPRITES)} missing sprites")
    print("⏳ Using smart rate limiting and retry logic")
    print()
    
    successful = 0
    failed = 0
    
    for i, sprite in enumerate(REMAINING_SPRITES, 1):
        print(f"\n--- Sprite {i}/{len(REMAINING_SPRITES)} ---")
        
        if generate_image_with_retry(sprite["prompt"], sprite["path"]):
            successful += 1
        else:
            failed += 1
            
        # Pause between sprites to avoid rate limiting
        if i < len(REMAINING_SPRITES):
            print("⏳ Pausing to avoid rate limits...")
            time.sleep(10)
    
    print(f"\n🎯 Generation Complete!")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    
    if successful > 0:
        print(f"\n📁 New sprites saved to assets/ directory")
        print("🚀 The game now has professional AI-generated art!")

if __name__ == "__main__":
    main()