#!/usr/bin/env python3
"""
Generate imp sprite using waifu-diffusion model (anime/manga trained)
This should produce much cleaner, more sprite-appropriate results than SDXL
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

def generate_sprite_with_waifu_diffusion(prompt, filename_suffix="waifu"):
    """Generate sprite using waifu-diffusion model"""
    print(f"\n🎨 Generating sprite with waifu-diffusion...")
    print(f"📝 Prompt: {prompt}")
    
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Using waifu-diffusion model - much better for clean anime/sprite art
    data = {
        "version": "25d2f75ecda0c0bed34c806b7b70319a53a1bccad3ade1a7496524f013f48983",
        "input": {
            "prompt": prompt,
            "width": 512,
            "height": 512,
            "num_outputs": 1,
            "num_inference_steps": 50,  # More steps for quality
            "guidance_scale": 12.0,     # Higher guidance for better prompt adherence
            "seed": 42  # Consistent seed
        }
    }
    
    # Start prediction
    response = requests.post("https://api.replicate.com/v1/predictions", 
                           headers=headers, json=data)
    
    if response.status_code == 429:  # Rate limited
        retry_after = response.json().get("retry_after", 15)
        print(f"⏳ Rate limited, waiting {retry_after}s...")
        time.sleep(retry_after + 5)
        return generate_sprite_with_waifu_diffusion(prompt, filename_suffix)
        
    if response.status_code != 201:
        print(f"❌ Failed to start: {response.text}")
        return False
    
    prediction = response.json()
    prediction_id = prediction["id"]
    
    print(f"⏳ Generating... (ID: {prediction_id[:8]})")
    
    # Poll for completion
    for attempt in range(60):  # 5 minutes max
        time.sleep(5)
        
        response = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}",
                              headers=headers)
        
        if response.status_code != 200:
            continue
            
        prediction = response.json()
        status = prediction["status"]
        
        if status == "succeeded":
            image_url = prediction["output"][0]
            
            # Download and save
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                filename = f"imp_{filename_suffix}.png"
                output_path = f"/home/claw/.openclaw/workspace/{filename}"
                
                with open(output_path, 'wb') as f:
                    f.write(img_response.content)
                print(f"✅ Saved: {filename}")
                return output_path
                
        elif status == "failed":
            print(f"❌ Failed: {prediction.get('error', 'Unknown error')}")
            return False
            
        elif status == "canceled":
            print(f"❌ Canceled")
            return False
        else:
            if attempt % 6 == 0:  # Every 30 seconds
                print(f"⏳ Status: {status}")
    
    print(f"❌ Timed out")
    return False

def main():
    print("🎮 Improved Imp Sprite Generation")
    print("🎨 Using waifu-diffusion (anime/manga trained model)")
    print("🎯 Should produce much cleaner sprites than SDXL!")
    print()
    
    # Optimized prompts for anime/manga model
    prompts = [
        # Clean anime sprite style
        "red demon imp, anime art style, clean background, flat colors, simple shading, game sprite, front view, small horns, pixel art influence",
        
        # Danbooru-style (the dataset waifu-diffusion was trained on)
        "1girl, red demon, imp, horns, anime style, simple background, game art, sprite sheet, flat coloring, clean lines",
        
        # Game asset focused
        "video game character, red imp demon, anime art style, transparent background, clean pixel art, 2d sprite, flat colors, simple design"
    ]
    
    results = []
    
    for i, prompt in enumerate(prompts, 1):
        print(f"\n{'='*60}")
        print(f"🔄 Testing prompt variation {i}/{len(prompts)}")
        
        result = generate_sprite_with_waifu_diffusion(prompt, f"waifu_v{i}")
        
        if result:
            results.append((i, result, prompt))
            print(f"✅ Variation {i} complete: {result}")
        else:
            print(f"❌ Variation {i} failed")
            
        # Pause between generations
        if i < len(prompts):
            print("⏳ Pausing before next variation...")
            time.sleep(10)
    
    print(f"\n{'='*60}")
    print(f"🎯 Waifu-Diffusion Test Complete!")
    print(f"✅ Successful generations: {len(results)}")
    
    if results:
        print(f"\n📁 Generated sprites:")
        for i, path, prompt in results:
            filename = path.split('/')[-1]
            print(f"  {i}: {filename}")
            print(f"     {prompt[:80]}...")
            
        print(f"\n🎮 These should be MUCH cleaner than the SDXL attempts!")
        print(f"🎨 Anime/manga training = better flat colors & clean edges")
    else:
        print("❌ No successful generations")

if __name__ == "__main__":
    main()