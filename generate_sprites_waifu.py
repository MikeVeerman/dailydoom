#!/usr/bin/env python3
"""
Generate game sprites using waifu-diffusion model
Based on successful Variant 4 style - muscular, detailed but clean
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

# Sprite definitions with waifu-diffusion optimized prompts
SPRITES_TO_GENERATE = {
    'skeleton': {
        'prompt': 'skeleton warrior, anime art style, game sprite, clean background, bone warrior with sword, undead enemy, flat colors, 2d art style',
        'filename': 'skeleton.png'
    },
    'zombie': {
        'prompt': 'zombie monster, anime style art, game sprite, green rotting skin, undead enemy, simple colors, clean background, 2d art style',
        'filename': 'zombie.png'
    },
    'orc': {
        'prompt': 'green orc warrior, anime art style, game sprite, muscular green skin, big axe, fantasy enemy, flat colors, clean background',
        'filename': 'orc.png'
    },
    'demon_lord': {
        'prompt': 'demon lord boss, anime style art, large red demon, big horns, muscular build, boss enemy sprite, dark wings, clean background',
        'filename': 'demon_lord.png'
    },
    'health_potion': {
        'prompt': 'red health potion, anime art style, game item sprite, red liquid in glass bottle, simple design, clean background, 2d art',
        'filename': 'health_potion.png'
    },
    'mana_potion': {
        'prompt': 'blue mana potion, anime art style, game item sprite, blue liquid in glass bottle, simple design, clean background, 2d art',
        'filename': 'mana_potion.png'
    },
    'sword': {
        'prompt': 'metal sword weapon, anime art style, game weapon sprite, silver blade, simple design, clean background, 2d art style',
        'filename': 'sword.png'
    },
    'axe': {
        'prompt': 'battle axe weapon, anime art style, game weapon sprite, wooden handle metal blade, simple design, clean background, 2d art',
        'filename': 'axe.png'
    }
}

def generate_sprite(name, config, seed_offset=0):
    """Generate one sprite using waifu-diffusion"""
    print(f"\n🎨 Generating: {name}")
    print(f"📝 Prompt: {config['prompt']}")
    
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Use proven waifu-diffusion model and parameters
    data = {
        "version": "25d2f75ecda0c0bed34c806b7b70319a53a1bccad3ade1a7496524f013f48983",
        "input": {
            "prompt": config['prompt'],
            "width": 512,
            "height": 512,
            "num_outputs": 1,
            "num_inference_steps": 35,  # Proven settings from Variant 4
            "guidance_scale": 11.0,     # Good prompt adherence
            "seed": 400 + seed_offset   # Start after our successful range
        }
    }
    
    print("📤 Starting generation...")
    response = requests.post("https://api.replicate.com/v1/predictions", 
                           headers=headers, json=data)
    
    if response.status_code == 429:  # Rate limited
        retry_after = response.json().get("retry_after", 15)
        print(f"⏳ Rate limited, waiting {retry_after}s...")
        time.sleep(retry_after + 5)
        return generate_sprite(name, config, seed_offset)  # Retry
        
    if response.status_code != 201:
        print(f"❌ Failed to start: {response.text}")
        return False
    
    prediction = response.json()
    prediction_id = prediction["id"]
    
    print(f"⏳ Processing... (ID: {prediction_id[:8]})")
    
    for attempt in range(24):  # 2 minutes max
        time.sleep(5)
        
        response = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}",
                              headers=headers)
        
        if response.status_code == 200:
            prediction = response.json()
            status = prediction["status"]
            
            if status == "succeeded":
                image_url = prediction["output"][0]
                
                # Download and save to assets/sprites/
                img_response = requests.get(image_url)
                if img_response.status_code == 200:
                    output_path = f"assets/sprites/{config['filename']}"
                    os.makedirs("assets/sprites", exist_ok=True)
                    
                    with open(output_path, 'wb') as f:
                        f.write(img_response.content)
                    print(f"✅ Saved: {output_path}")
                    return True
                    
            elif status in ["failed", "canceled"]:
                print(f"❌ {status}: {prediction.get('error', 'Unknown')}")
                return False
            else:
                if attempt % 4 == 0:  # Every 20 seconds
                    print(f"   ⏳ {status}")
    
    print(f"❌ Timed out")
    return False

def main():
    print("🎮 Daily Doom - Waifu-Diffusion Sprite Generator")
    print("🎨 Using proven anime/manga model for clean game art")
    print(f"🎯 Generating {len(SPRITES_TO_GENERATE)} sprites...")
    print()
    
    results = {'success': [], 'failed': []}
    
    for i, (name, config) in enumerate(SPRITES_TO_GENERATE.items(), 1):
        print(f"\n{'='*60}")
        print(f"🔄 Sprite {i}/{len(SPRITES_TO_GENERATE)}: {name}")
        
        success = generate_sprite(name, config, seed_offset=i*10)
        
        if success:
            results['success'].append(name)
        else:
            results['failed'].append(name)
        
        # Pause between generations to avoid rate limiting
        if i < len(SPRITES_TO_GENERATE):
            print("⏳ Brief pause...")
            time.sleep(10)
    
    print(f"\n{'='*60}")
    print(f"🎯 Generation Complete!")
    print(f"✅ Successful: {len(results['success'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    
    if results['success']:
        print(f"\n📁 Generated sprites:")
        for name in results['success']:
            print(f"  • {name}")
    
    if results['failed']:
        print(f"\n💥 Failed sprites:")
        for name in results['failed']:
            print(f"  • {name}")
            
    return len(results['failed']) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)