#!/usr/bin/env python3
"""
Generate final imp sprite variants using waifu-diffusion
Now that we know it works, create multiple clean variants
"""

import requests
import time
import sys

def generate_sprite(prompt, filename, seed=42):
    """Generate one sprite variant"""
    print(f"\n🎨 Generating: {filename}")
    print(f"📝 Prompt: {prompt}")
    
    headers = {
        "Authorization": "Token r8_7RlAjLfn9zHyBufWw9UBhInbRMix1TK0Khb1w",
        "Content-Type": "application/json"
    }
    
    data = {
        "version": "25d2f75ecda0c0bed34c806b7b70319a53a1bccad3ade1a7496524f013f48983",
        "input": {
            "prompt": prompt,
            "width": 512,
            "height": 512,
            "num_outputs": 1,
            "num_inference_steps": 35,  # Slightly more for quality
            "guidance_scale": 11.0,     # Good adherence  
            "seed": seed
        }
    }
    
    print("📤 Starting generation...")
    response = requests.post("https://api.replicate.com/v1/predictions", 
                           headers=headers, json=data)
    
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
                
                # Download
                img_response = requests.get(image_url)
                if img_response.status_code == 200:
                    output_path = f"/home/claw/.openclaw/workspace/{filename}"
                    with open(output_path, 'wb') as f:
                        f.write(img_response.content)
                    print(f"✅ Saved: {filename}")
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
    print("🎮 Final Imp Sprite Generation")
    print("🎨 Using proven waifu-diffusion model")
    print("🎯 Creating multiple variants for selection")
    print()
    
    # Optimized prompts for waifu-diffusion (anime/manga model)
    variants = [
        {
            "prompt": "red demon imp, anime art style, white background, flat colors, simple shading, game sprite, front view, small black horns, green glowing eyes",
            "filename": "imp_final_v1.png",
            "seed": 100
        },
        {
            "prompt": "demon imp character, red skin, anime style, simple background, game art, sprite design, black horns, green eyes, flat coloring, clean lines",
            "filename": "imp_final_v2.png", 
            "seed": 200
        },
        {
            "prompt": "small red demon, anime art, video game character, flat colors, simple design, black horns, glowing green eyes, front facing pose, clean art",
            "filename": "imp_final_v3.png",
            "seed": 300
        },
        {
            "prompt": "red imp monster, anime style art, game sprite, simple colors, black small horns, green glowing eyes, clean background, 2d art style",
            "filename": "imp_final_v4.png",
            "seed": 400
        }
    ]
    
    results = []
    
    for i, variant in enumerate(variants, 1):
        print(f"\n{'='*60}")
        print(f"🔄 Variant {i}/{len(variants)}")
        
        success = generate_sprite(
            variant["prompt"], 
            variant["filename"],
            variant["seed"]
        )
        
        if success:
            results.append(variant["filename"])
        
        # Pause between generations to avoid rate limiting
        if i < len(variants):
            print("⏳ Brief pause...")
            time.sleep(8)
    
    print(f"\n{'='*60}")
    print(f"🎯 Final Generation Complete!")
    print(f"✅ Successful variants: {len(results)}")
    
    if results:
        print(f"\n📁 Generated sprites:")
        for filename in results:
            print(f"  • {filename}")
            
        print(f"\n🎮 All variants should have clean anime-style art!")
        print(f"🎨 Much better than the SDXL attempts!")
        print(f"📂 Files saved to workspace for review")
    else:
        print("❌ No successful generations")

if __name__ == "__main__":
    main()